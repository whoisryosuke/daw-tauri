use crossbeam::channel::{Receiver, Sender};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use std::thread;

use crate::vst::vst_cache::VstPluginInstance;

#[cfg(target_os = "windows")]
use winapi::shared::minwindef::FALSE;
#[cfg(target_os = "windows")]
use winapi::um::processthreadsapi::GetCurrentThreadId;
#[cfg(target_os = "windows")]
use winapi::um::winuser::{
    DispatchMessageW, MsgWaitForMultipleObjects, PeekMessageW, PostThreadMessageW,
    TranslateMessage, MSG, PM_NOREMOVE, PM_REMOVE, QS_ALLINPUT, WM_QUIT, WM_USER,
};
#[cfg(target_os = "windows")]
const INFINITE: u32 = 0xFFFF_FFFF;
#[cfg(target_os = "windows")]
use std::ptr;

#[cfg(target_os = "macos")]
use core_foundation::runloop::{
    kCFRunLoopDefaultMode, CFRunLoop, CFRunLoopTimer, CFRunLoopTimerCallBack, CFRunLoopTimerContext,
};
#[cfg(target_os = "macos")]
use std::os::raw::c_void;

pub enum VstCommand {
    CreateWindow(String, VstPluginInstance),
    OpenWindow(String),
    CloseWindow(String),
    DestroyWindow(String),
}

pub struct VstMessaging {
    producer: Sender<VstCommand>,
    // Windows: id of the dedicated window-pump thread, so `send_message` can nudge it.
    #[cfg(target_os = "windows")]
    thread_id: Arc<AtomicU32>,
}

impl VstMessaging {
    pub fn new() -> Self {
        let (producer, consumer) = crossbeam::channel::bounded::<VstCommand>(128);

        #[cfg(target_os = "windows")]
        {
            let thread_id = Arc::new(AtomicU32::new(0));
            let thread_id_for_thread = thread_id.clone();
            Self::spawn_thread(consumer, thread_id_for_thread);
            return Self {
                producer,
                thread_id,
            };
        }

        #[cfg(target_os = "macos")]
        {
            // The editor MUST be opened on the main thread (the crate enforces this on macOS),
            // so we service commands + `service_platform_events` from a timer on the main run loop.
            Self::setup_main_runloop_timer(consumer);
            return Self { producer };
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        {
            Self::spawn_basic_thread(consumer);
            return Self { producer };
        }
    }

    pub fn send_message(&self, msg: VstCommand) {
        let _ = self.producer.send(msg);
        #[cfg(target_os = "windows")]
        {
            let tid = self.thread_id.load(Ordering::Relaxed);
            if tid != 0 {
                unsafe {
                    PostThreadMessageW(tid, WM_USER, 0, 0);
                }
            }
        }
    }

    /// Windows: a dedicated thread that (a) owns the plugin HWNDs and (b) runs a real Win32
    /// message pump. Without the pump, plugin editors (JUCE/VSTGUI) never receive their window
    /// messages and block inside `open()` -> the app freezes.
    #[cfg(target_os = "windows")]
    fn spawn_thread(consumer: Receiver<VstCommand>, thread_id: Arc<AtomicU32>) {
        thread::spawn(move || {
            // Ensure this thread owns a message queue before anyone posts to it.
            unsafe {
                let mut dummy: MSG = std::mem::zeroed();
                PeekMessageW(&mut dummy, ptr::null_mut(), 0, 0, PM_NOREMOVE);
            }
            thread_id.store(unsafe { GetCurrentThreadId() }, Ordering::Relaxed);

            let mut window_map: HashMap<String, vst3_host::PluginWindow> = HashMap::new();
            loop {
                unsafe {
                    // nCount = 0: just block until any message is queued for this thread.
                    MsgWaitForMultipleObjects(0, ptr::null(), FALSE, INFINITE, QS_ALLINPUT);

                    while let Ok(message) = consumer.try_recv() {
                        match message {
                            VstCommand::CreateWindow(id, plugin) => {
                                let mut window = vst3_host::PluginWindow::new(plugin);
                                let _ = window.open();
                                window_map.insert(id, window);
                            }
                            VstCommand::OpenWindow(id) => {
                                if let Some(window) = window_map.get_mut(&id) {
                                    if !window.is_open() {
                                        let _ = window.open();
                                    }
                                }
                            }
                            VstCommand::CloseWindow(id) => {
                                if let Some(window) = window_map.get_mut(&id) {
                                    if window.is_open() {
                                        window.close();
                                    }
                                }
                            }
                            VstCommand::DestroyWindow(id) => {
                                if let Some(mut window) = window_map.remove(&id) {
                                    window.close();
                                }
                            }
                        }
                    }

                    // Pump the editor's window messages (paint, mouse, keyboard, timers...).
                    let mut msg: MSG = std::mem::zeroed();
                    while PeekMessageW(&mut msg, ptr::null_mut(), 0, 0, PM_REMOVE) != 0 {
                        if msg.message == WM_QUIT {
                            break;
                        }
                        TranslateMessage(&msg);
                        DispatchMessageW(&msg);
                    }

                    // Required by the crate: apply plugin-initiated resizes and DPI changes
                    // outside the window procedure, and tear down windows dismissed by the user.
                    for window in window_map.values() {
                        let _ = window.service_platform_events();
                    }
                    let closed: Vec<String> = window_map
                        .iter()
                        .filter(|(_, w)| w.closed_by_user())
                        .map(|(k, _)| k.clone())
                        .collect();
                    for id in closed {
                        if let Some(mut w) = window_map.remove(&id) {
                            w.close();
                        }
                    }
                }
            }
        });
    }

    /// macOS: `open()` must run on the main thread, and the main run loop (owned by Tauri/AppKit)
    /// already pumps NSWindow messages. We only need a repeating main-thread timer to (a) drain
    /// commands and (b) call `service_platform_events()` each frame.
    #[cfg(target_os = "macos")]
    fn setup_main_runloop_timer(consumer: Receiver<VstCommand>) {
        struct HostState {
            receiver: Receiver<VstCommand>,
            windows: HashMap<String, vst3_host::PluginWindow>,
        }

        extern "C" fn on_tick(_timer: *mut c_void, info: *mut c_void) {
            unsafe {
                let state = &mut *(info as *mut HostState);
                while let Ok(cmd) = state.receiver.try_recv() {
                    match cmd {
                        VstCommand::CreateWindow(id, plugin) => {
                            let mut w = vst3_host::PluginWindow::new(plugin);
                            let _ = w.open();
                            state.windows.insert(id, w);
                        }
                        VstCommand::OpenWindow(id) => {
                            if let Some(w) = state.windows.get_mut(&id) {
                                if !w.is_open() {
                                    let _ = w.open();
                                }
                            }
                        }
                        VstCommand::CloseWindow(id) => {
                            if let Some(w) = state.windows.get_mut(&id) {
                                if w.is_open() {
                                    w.close();
                                }
                            }
                        }
                        VstCommand::DestroyWindow(id) => {
                            if let Some(mut w) = state.windows.remove(&id) {
                                w.close();
                            }
                        }
                    }
                }
                for w in state.windows.values() {
                    let _ = w.service_platform_events();
                }
                let closed: Vec<String> = state
                    .windows
                    .iter()
                    .filter(|(_, w)| w.closed_by_user())
                    .map(|(k, _)| k.clone())
                    .collect();
                for id in closed {
                    if let Some(mut w) = state.windows.remove(&id) {
                        w.close();
                    }
                }
            }
        }

        // Leak the box: it lives for the whole process and is only ever touched from the main
        // thread (the run-loop timer fires there).
        let state = Box::into_raw(Box::new(HostState {
            receiver: consumer,
            windows: HashMap::new(),
        }));
        let context = CFRunLoopTimerContext {
            version: 0,
            info: state as *mut c_void,
            retain: None,
            release: None,
            copyDescription: None,
        };
        // `on_tick` takes `*mut c_void` for the timer; cast to the expected callback signature.
        let timer = CFRunLoopTimer::new(
            0.0,
            1.0 / 60.0,
            0,
            0,
            on_tick as CFRunLoopTimerCallBack,
            &context as *const CFRunLoopTimerContext as *mut CFRunLoopTimerContext,
        );
        CFRunLoop::get_main().add_timer(&timer, kCFRunLoopDefaultMode);
    }

    /// Fallback for other platforms (no proper native pump here). Kept so the crate still builds,
    /// but VST editor windows need a real OS event loop to be responsive.
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    fn spawn_basic_thread(consumer: Receiver<VstCommand>) {
        thread::spawn(move || {
            let mut window_map: HashMap<String, vst3_host::PluginWindow> = HashMap::new();
            loop {
                while let Ok(message) = consumer.try_recv() {
                    match message {
                        VstCommand::CreateWindow(id, plugin) => {
                            let mut window = vst3_host::PluginWindow::new(plugin);
                            let _ = window.open();
                            window_map.insert(id, window);
                        }
                        VstCommand::OpenWindow(id) => {
                            if let Some(w) = window_map.get_mut(&id) {
                                if !w.is_open() {
                                    let _ = w.open();
                                }
                            }
                        }
                        VstCommand::CloseWindow(id) => {
                            if let Some(w) = window_map.get_mut(&id) {
                                if w.is_open() {
                                    w.close();
                                }
                            }
                        }
                        VstCommand::DestroyWindow(id) => {
                            if let Some(mut w) = window_map.remove(&id) {
                                w.close();
                            }
                        }
                    }
                }
                for w in window_map.values() {
                    let _ = w.service_platform_events();
                }
                let closed: Vec<String> = window_map
                    .iter()
                    .filter(|(_, w)| w.closed_by_user())
                    .map(|(k, _)| k.clone())
                    .collect();
                for id in closed {
                    if let Some(mut w) = window_map.remove(&id) {
                        w.close();
                    }
                }
                thread::sleep(std::time::Duration::from_millis(16));
            }
        });
    }
}

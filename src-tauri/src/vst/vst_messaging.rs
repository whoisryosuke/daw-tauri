use crossbeam::channel::{Receiver, Sender};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    thread,
    time::Duration,
};

use crate::vst::vst_cache::VstPluginInstance;

pub enum VstCommand {
    CreateWindow(String, VstPluginInstance),
    OpenWindow(String),
    CloseWindow(String),
}

pub struct VstMessaging {
    producer: Sender<VstCommand>,
}

impl VstMessaging {
    pub fn new() -> Self {
        let (producer, consumer) = crossbeam::channel::bounded::<VstCommand>(128);
        Self::spawn_thread(consumer);

        Self { producer }
    }

    pub fn send_message(&self, msg: VstCommand) {
        self.producer.send(msg);
    }

    pub fn spawn_thread(consumer: Receiver<VstCommand>) {
        thread::spawn(move || {
            // Store the windows inside this thread.
            // They can't travel across threads because underlying handles (like HWND for Windows)
            // doesn't implement Copy/Send, so it can't be sent across threads (like Tauri commands).
            let mut window_map: HashMap<String, vst3_host::PluginWindow> = HashMap::new();

            // Check for messages from other threads
            loop {
                // Handle commands
                while let Ok(message) = consumer.try_recv() {
                    match message {
                        VstCommand::CreateWindow(id, plugin) => {
                            let mut window = vst3_host::PluginWindow::new(plugin.clone());
                            let _ = window.open();
                            window_map.insert(id, window);
                        }
                        VstCommand::OpenWindow(id) => {
                            if let Some(window) = window_map.get_mut(&id) {
                                if !window.is_open() {
                                    window.open();
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
                    }
                }

                thread::sleep(Duration::from_millis(16)); // ~60 FPS
            }
        });
    }
}

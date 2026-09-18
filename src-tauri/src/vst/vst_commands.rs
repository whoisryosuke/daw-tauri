use tauri::State;
use vst3_host::{PluginInfo, Vst3Host};

use std::cell::RefCell;
use std::collections::HashMap;
use tauri::async_runtime::Mutex;

use crate::engine::audio_engine::AudioEngine;
use crate::engine::audio_engine_messaging::AudioEngineMessaging;
use crate::vst::vst_cache::VstCache;
use crate::vst::vst_messaging::VstMessaging;

thread_local! {
    pub static PLUGIN_WINDOW_MAP: RefCell<HashMap<String, vst3_host::PluginWindow>> = RefCell::new(HashMap::new());
}

#[tauri::command]
pub fn create_vst(
    engine: State<'_, Mutex<AudioEngine>>,
    messaging: State<'_, AudioEngineMessaging>,
    vst_cache: State<'_, Mutex<VstCache>>,
) -> Result<(), String> {
    let engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;

    // Get samples from cache
    let sample_rate = engine.config.sample_rate();

    // Create plugin and store in cache
    let mut vst_cache = vst_cache
        .try_lock()
        .map_err(|_| "Couldn't lock VST cache")?;

    let plugin = vst_cache.load_plugin("test".to_string(), "".to_string())?;

    messaging.create_vst_node(0, sample_rate as f64, plugin);

    Ok(())
}

#[tauri::command]
pub fn test_vst(vst_cache: State<'_, Mutex<VstCache>>) -> Result<(), String> {
    // Create plugin and store in cache
    let mut vst_cache = vst_cache
        .try_lock()
        .map_err(|_| "Couldn't lock VST cache")?;

    let id = "test".to_string();

    match vst_cache.plugins.get_mut(&id) {
        Some(plugin_data) => {
            let plugin = plugin_data
                .plugin
                .clone()
                .ok_or("Plugin isn't loaded".to_string())?;
            let mut plugin = plugin.try_lock().map_err(|_| "Couldn't lock VST cache")?;
            let event = vst3_host::MidiEvent::NoteOn {
                channel: vst3_host::MidiChannel::Ch1,
                note: 60,
                velocity: 100,
            };
            plugin.send_midi_event(event);
            Ok(())
        }
        None => Err("Couldn't find that plugin".into()),
    }
}

#[tauri::command]
pub async fn open_vst_window(
    app: tauri::AppHandle,
    vst_cache: State<'_, Mutex<VstCache>>,
) -> Result<(), String> {
    // Grab plugin cache and lock it
    let mut vst_cache = vst_cache
        .try_lock()
        .map_err(|_| "Couldn't lock VST cache")?;
    let id = "test".to_string();

    // Get plugin by ID
    let plugin = vst_cache
        .plugins
        .get_mut(&id)
        .ok_or("Couldn't find that plugin".to_string())?;

    let plugin = plugin.plugin.clone();
    let plugin = plugin.ok_or("Plugin isn't loaded".to_string())?;

    // Create a cross-thread communication to send the result when window is done (or error)
    let (tx, rx) = std::sync::mpsc::channel();

    // We need to open the plugin window on the main thread.
    // The underlying window open function for Windows and Mac check for main thread
    // and will crash app if requirement isn't met.
    app.run_on_main_thread(move || {
        // Lock the plugin window "cache", create the window, open it, and store it
        let result = PLUGIN_WINDOW_MAP.with(|plugin_windows| {
            let mut window = vst3_host::PluginWindow::new(plugin.clone());
            let r = window.open().map_err(|e| e.to_string());
            plugin_windows.borrow_mut().insert(id, window);
            r
        });
    })
    .map_err(|_| "Couldn't create window on main thread")?;

    // Wait for the result and return it to user
    rx.recv()
        .map_err(|_| "Main thread task dropped".to_string())?
}

#[tauri::command]
pub async fn discover_vst_plugins(
    vst_cache: State<'_, Mutex<VstCache>>,
) -> Result<Vec<PluginInfo>, String> {
    // Create plugin and store in cache
    let mut vst_cache = vst_cache
        .try_lock()
        .map_err(|_| "Couldn't lock VST cache")?;

    let plugins = vst_cache
        .discover_vst_plugins()
        .await
        .map_err(|_| "Couldn't discover plugins")?;

    Ok(plugins)
}

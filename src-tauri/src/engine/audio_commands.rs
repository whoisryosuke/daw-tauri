use cpal::traits::{DeviceTrait, HostTrait};
use serde::Serialize;
use tauri::{async_runtime::Mutex, State};

use crate::{
    cache::media_cache::{AudioCache, MidiCache},
    composition::composition::CompositionStore,
    engine::{audio_engine::AudioEngine, audio_engine_messaging::AudioEngineMessaging},
    math::seconds_to_frames,
};

#[tauri::command(async)]
pub async fn play_audio(
    messaging: State<'_, AudioEngineMessaging>,
    midi_cache: State<'_, Mutex<MidiCache>>,
    audio_cache: State<'_, Mutex<AudioCache>>,
    composition: State<'_, Mutex<CompositionStore>>,
    engine: State<'_, Mutex<AudioEngine>>,
) -> Result<bool, String> {
    let engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;
    let midi_cache = midi_cache
        .try_lock()
        .map_err(|_| "Couldn't lock midi cache")?;
    let asset_store = audio_cache
        .try_lock()
        .map_err(|_| "Couldn't lock audio cache")?;
    println!("loading audio from Rust");

    let sample_rate = engine.config.sample_rate();
    let channel_count = engine.config.channels() as usize;
    let store = &composition
        .try_lock()
        .map_err(|_| "Couldn't lock composition")?;

    messaging.play(store, &asset_store, &midi_cache, sample_rate, channel_count);

    Ok(true)
}

#[tauri::command(async)]
pub async fn stop_audio(messaging: State<'_, AudioEngineMessaging>) -> Result<bool, bool> {
    println!("stopping audio from Rust");

    // Get samples from cache
    messaging.stop();

    Ok(true)
}

#[tauri::command(async)]
pub async fn add_synth(
    engine: State<'_, Mutex<AudioEngine>>,
    messaging: State<'_, AudioEngineMessaging>,
) -> Result<bool, String> {
    let engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;

    // Get samples from cache
    let sample_rate = engine.config.sample_rate();
    println!("adding synth in Rust");

    // Get samples from cache
    messaging.add_synth(0, sample_rate);

    Ok(true)
}

#[tauri::command(async)]
pub async fn get_sample_rate(engine: State<'_, Mutex<AudioEngine>>) -> Result<u32, String> {
    let engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;

    // Get samples from cache
    let sample_rate = engine.config.sample_rate();

    Ok(sample_rate)
}

#[tauri::command(async)]
pub async fn set_playback_time(
    engine: State<'_, Mutex<AudioEngine>>,
    messaging: State<'_, AudioEngineMessaging>,
    time: f64,
) -> Result<bool, String> {
    let engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;

    // Get samples from cache
    let sample_rate = engine.config.sample_rate();

    // Convert seconds to frames
    let frame_count = seconds_to_frames(time, sample_rate)?;

    // Get samples from cache
    messaging.set_playback_time(frame_count);

    Ok(true)
}

#[derive(Serialize)]
pub struct DeviceInfo {
    name: String,
    selected: bool,
}
#[derive(Serialize)]
pub struct OutputDeviceResponse {
    devices: Vec<DeviceInfo>,
    selected: String,
}

#[tauri::command(async)]
pub async fn get_output_devices(
    engine: State<'_, Mutex<AudioEngine>>,
) -> Result<OutputDeviceResponse, String> {
    let engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;

    let selected_device = &engine.selected_device;

    // Set up CPAL.
    let host = cpal::default_host();
    let devices = host.output_devices().map_err(|e| e.to_string())?;

    let mut device_list = Vec::new();

    for device in devices {
        let name = device
            .description()
            .map_err(|e| e.to_string())?
            .name()
            .to_string();
        let selected = *selected_device == name;
        device_list.push(DeviceInfo { name, selected });
    }

    let response = OutputDeviceResponse {
        devices: device_list,
        selected: engine.selected_device.clone(),
    };

    Ok(response)
}

#[tauri::command]
pub fn change_audio_device(
    engine: State<'_, Mutex<AudioEngine>>,
    device_name: String, // The name of the device selected in UI
) -> Result<(), String> {
    let mut engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;

    engine
        .create_stream_for_device_name(device_name)
        .map_err(|e| e.to_string())?;

    Ok(())
}

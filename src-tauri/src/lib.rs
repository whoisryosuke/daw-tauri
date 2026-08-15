mod asset_store;
mod audio_buffer;
mod audio_cache;
mod audio_engine;
mod audio_node;
mod composition;
mod effects;
mod math;
mod midi;
mod music;
mod utils;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use serde::Serialize;
use symphonia::core::audio::{AudioBufferRef, Signal, SignalSpec};
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::{FormatOptions, Track};
use symphonia::core::meta::MetadataOptions;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Builder, Emitter, Manager, State};

use std::collections::{HashMap, VecDeque};
use std::fs::{self, File};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use crate::asset_store::{get_assets, AssetStore, MediaAsset};
use crate::audio_buffer::AudioBuffer;
use crate::audio_cache::{get_sample_waveform, AudioCache};
use crate::audio_engine::{AudioCommand, AudioEngine, AudioEngineMessaging};
use crate::audio_node::AudioNode;
use crate::composition::{
    add_clip, add_track, add_track_clip, add_track_effect, reset_composition,
    set_midi_track_as_playable, update_midi_track_clip, update_track_clip_time,
    update_track_effect, update_track_gain, CompositionStore,
};
use crate::midi::{
    connect_to_midi_input_device, get_midi_input_devices, play_midi_key, start_midi_connection,
    MIDIStore,
};

const WAVEFORM_SAMPLE_NUM: usize = 2048;

type AudioSamples = HashMap<String, Vec<f32>>;

struct AudioState {
    messaging: AudioEngineMessaging,
    asset_store: Arc<AudioCache>,
}

// @TODO: Return a Result instead of blank array for better error handling
fn load_sample_data_from_disk(file_path: &str) -> (Vec<f32>, f64, usize, u32) {
    let audio_path = std::path::Path::new(file_path);

    // Open reader and probe MP3.
    let file = File::open(audio_path).expect("Couldn't load file");
    // let reader = BufReader::new(file);
    let mss = symphonia::core::io::MediaSourceStream::new(Box::new(file), Default::default());
    let mut hint = symphonia::core::probe::Hint::new();
    hint.with_extension("mp3");
    let probed = symphonia::default::get_probe()
        .format(
            &hint,
            mss,
            &FormatOptions::default(),
            &MetadataOptions::default(),
        )
        .expect("Failed to probe audio format");

    let mut format = probed.format;

    // Select the first audio track.
    let track = format
        .tracks()
        .iter()
        .find(|t| t.codec_params.sample_rate.is_some())
        .expect("no audio track");

    let track_id = track.id;
    let track_params = &track.codec_params;

    // Get the duration of the clip
    let mut track_duration = 0.0;
    let mut sample_rate = 0;
    if let (Some(track_sample_rate), Some(n_frames)) =
        (track_params.sample_rate, track_params.n_frames)
    {
        track_duration = n_frames as f64 / track_sample_rate as f64;
        sample_rate = track_sample_rate;
    }

    let mut channel_count = 1;
    if let Some(channels) = track_params.channels {
        channel_count = channels.count();
    }

    // Create a decoder.
    let mut decoder = symphonia::default::get_codecs()
        .make(&track_params, &DecoderOptions::default())
        .expect("Couldn't create decoder");

    // Decode the ENTIRE MP3 ahead of time into f32 interleaved PCM.
    // For streaming large files, switch to a ring buffer; but for simplicity,
    // decode into memory.
    let mut samples: Vec<f32> = Vec::new();

    loop {
        let packet = match format.next_packet() {
            Ok(p) => p,
            Err(symphonia::core::errors::Error::IoError(_)) => break,
            Err(err) => {
                eprintln!("Error decoding packet: {err}");
                break;
            }
        };

        if packet.track_id() != track_id {
            continue;
        }

        let decoded = decoder.decode(&packet).expect("Couldn't decode audio");

        match decoded {
            AudioBufferRef::F32(buf) => {
                let channels = buf.spec().channels.count();
                let frames = buf.frames();

                for frame in 0..frames {
                    for ch in 0..channels {
                        samples.push(buf.chan(ch)[frame]);
                    }
                }
            }
            AudioBufferRef::S16(buf) => {
                let channels = buf.spec().channels.count();
                let frames = buf.frames();

                for frame in 0..frames {
                    for ch in 0..channels {
                        samples.push(buf.chan(ch)[frame] as f32 / i16::MAX as f32);
                    }
                }
            }
            other => {
                eprintln!("Unsupported sample format: {:?}", other.spec());
                return (Vec::new(), 0.0, 0, 0);
            }
        }
    }

    (samples, track_duration, channel_count, sample_rate)
}

// #[tauri::command]
// async fn load_sample_file(app: AppHandle, state: State<'_, Mutex<AudioState>>) -> Result<bool, bool> {
//    println!("loading audio from Rust");
//     let mut state = state.lock().unwrap();

//     let file_name = "ff8-magic.mp3";
//     let samples = load_sample_data_from_disk(&app, file_name);

//     state.samples.insert(file_name.to_string(), samples);

//     Ok(true)
// }

#[tauri::command(async)]
async fn play_audio(
    messaging: State<'_, AudioEngineMessaging>,
    asset_store: State<'_, AudioCache>,
    composition: State<'_, Mutex<CompositionStore>>,
    engine: State<'_, Mutex<AudioEngine>>,
) -> Result<bool, String> {
    let engine = engine.lock().map_err(|_| "Couldn't lock engine")?;
    println!("loading audio from Rust");

    let sample_rate = engine.config.sample_rate().0;
    let channel_count = engine.config.channels() as usize;
    let store = &composition
        .lock()
        .map_err(|_| "Couldn't lock composition")?;

    messaging.play(store, &asset_store, sample_rate, channel_count);

    Ok(true)
}

#[tauri::command(async)]
async fn stop_audio(messaging: State<'_, AudioEngineMessaging>) -> Result<bool, bool> {
    println!("stopping audio from Rust");

    // Get samples from cache
    messaging.stop();

    Ok(true)
}

#[tauri::command(async)]
async fn add_synth(messaging: State<'_, AudioEngineMessaging>) -> Result<bool, bool> {
    println!("adding synth in Rust");

    // Get samples from cache
    messaging.add_synth(0);

    Ok(true)
}

#[tauri::command(async)]
async fn get_sample_rate(engine: State<'_, Mutex<AudioEngine>>) -> Result<u32, String> {
    let engine = engine.lock().map_err(|_| "Couldn't lock engine")?;

    // Get samples from cache
    let sample_rate = engine.config.sample_rate().0;

    Ok(sample_rate)
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
async fn get_output_devices(
    engine: State<'_, Mutex<AudioEngine>>,
) -> Result<OutputDeviceResponse, String> {
    println!("getting output devices from cpal");
    let engine = engine.lock().map_err(|_| "Couldn't lock engine")?;

    let selected_device = &engine.selected_device;

    // Set up CPAL.
    let host = cpal::default_host();
    let devices = host.output_devices().map_err(|e| e.to_string())?;

    let mut device_list = Vec::new();

    for device in devices {
        let name = device.name().map_err(|e| e.to_string())?.to_string();
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
fn change_audio_device(
    engine: State<'_, Mutex<AudioEngine>>,
    device_name: String, // The name of the device selected in UI
) -> Result<(), String> {
    let mut engine = engine.lock().map_err(|_| "Couldn't lock engine")?;

    engine
        .create_stream_for_device_name(device_name)
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn load_assets(handle: &AppHandle, asset_store: &mut AssetStore, audio_cache: &mut AudioCache) {
    let resource_path = handle
        .path()
        .resolve("audio", BaseDirectory::Resource)
        .expect("Couldn't get audio folder");

    let resources = fs::read_dir(resource_path).expect("Couldn't read audio resources folder");

    for path_result in resources {
        match path_result {
            Ok(path) => {
                println!("path found");
                let file_name = path.file_name().display().to_string();
                let file_path = path.path();
                let file_path_str = file_path.to_str().unwrap();

                println!("Loading asset {}...", file_name);

                let (sample_data, duration, channel_count, sample_rate) =
                    load_sample_data_from_disk(file_path_str);

                let audio_asset =
                    MediaAsset::new(file_name.to_string(), file_path_str.to_string(), duration);

                // Add to appropriate stores
                asset_store.insert(file_name.to_string(), audio_asset);
                audio_cache.insert(
                    file_path_str.to_string(),
                    AudioBuffer::new(sample_data, sample_rate, channel_count),
                );
            }
            Err(error) => {
                println!("error loading audio resource: {}", error);
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Set up audio backend (aka CPAL)
            let engine = AudioEngine::new(app.handle().clone());
            app.manage(Mutex::new(engine));

            // Setup additional global state
            // Create the asset store to contain any samples cached in memory
            let mut audio_cache = AudioCache::new(Mutex::new(HashMap::new()));
            let mut asset_store = AssetStore::new(Mutex::new(HashMap::new()));
            let composition_store = Mutex::new(CompositionStore::new());
            let midi_store = Mutex::new(MIDIStore::new(app.handle().clone()));

            // DEBUG: Load a test sample
            load_assets(app.handle(), &mut asset_store, &mut audio_cache);

            app.manage(audio_cache);
            app.manage(asset_store);
            app.manage(composition_store);
            app.manage(midi_store);

            println!("app setup success");

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_output_devices,
            change_audio_device,
            play_audio,
            stop_audio,
            add_synth,
            get_sample_rate,
            get_assets,
            get_sample_waveform,
            // Composition
            reset_composition,
            set_midi_track_as_playable,
            add_track,
            update_track_gain,
            add_track_effect,
            update_track_effect,
            add_track_clip,
            update_track_clip_time,
            update_midi_track_clip,
            add_clip,
            // MIDI
            get_midi_input_devices,
            start_midi_connection,
            connect_to_midi_input_device,
            play_midi_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub mod asset_store;
pub mod cache;
pub mod composition;
pub mod effects;
pub mod engine;
pub mod math;
pub mod media;
pub mod midi;
pub mod music;
pub mod utils;
pub mod vst;

#[cfg(test)]
pub mod testing;

use symphonia::core::audio::{AudioBufferRef, Signal};
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::FormatOptions;
use symphonia::core::meta::MetadataOptions;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

use std::fs::{self, File};
use tauri::async_runtime::Mutex;

use crate::asset_store::{get_assets, AssetStore, MediaAsset, MediaAssetType};
use crate::cache::media_cache::{AudioCache, MidiCache};
use crate::cache::media_cache_commands::get_sample_waveform;
use crate::composition::composition::{
    add_clip, add_track, add_track_clip, add_track_effect, reset_composition,
    set_midi_track_as_playable, update_midi_track_clip, update_track_clip_range,
    update_track_clip_time, update_track_effect, update_track_gain, CompositionStore,
};
use crate::engine::audio_commands::{
    add_synth, change_audio_device, get_output_devices, get_sample_rate, play_audio,
    set_playback_time, stop_audio,
};
use crate::engine::audio_engine::AudioEngine;
use crate::engine::exporter::export_file;
use crate::engine::shared::audio_buffer::AudioBuffer;
use crate::midi::{
    connect_to_midi_input_device, get_midi_input_devices, play_midi_key, start_midi_connection,
    start_midi_recording, stop_midi_recording, MIDIStore,
};

use crate::vst::vst_cache::VstCache;
use crate::vst::vst_commands::{
    create_vst, discover_vst_plugins, open_vst_window, test_vst, PLUGIN_WINDOW_MAP,
};

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

                let audio_asset = MediaAsset::new(
                    file_name.to_string(),
                    file_path_str.to_string(),
                    duration,
                    MediaAssetType::Audio,
                );

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
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_prevent_default::init())
        .setup(|app| {
            // Set up audio backend (aka CPAL)
            let engine = AudioEngine::new(app.handle().clone());
            let midi_store = Mutex::new(MIDIStore::new(
                app.handle().clone(),
                engine.playback_time.clone(),
            ));
            app.manage(Mutex::new(engine));

            // Setup additional global state
            // Create the asset store to contain any samples cached in memory
            let mut audio_cache = AudioCache::new();
            let midi_cache = MidiCache::new();
            let mut asset_store = AssetStore::new();
            let composition_store = Mutex::new(CompositionStore::new());
            let vst_store = Mutex::new(VstCache::new());

            // DEBUG: Load a test sample
            load_assets(app.handle(), &mut asset_store, &mut audio_cache);

            app.manage(Mutex::new(audio_cache));
            app.manage(Mutex::new(midi_cache));
            app.manage(Mutex::new(asset_store));
            app.manage(composition_store);
            app.manage(midi_store);
            app.manage(vst_store);

            println!("app setup success");

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Audio Engine
            get_output_devices,
            change_audio_device,
            play_audio,
            stop_audio,
            add_synth,
            get_sample_rate,
            get_assets,
            get_sample_waveform,
            set_playback_time,
            // Composition
            reset_composition,
            set_midi_track_as_playable,
            add_track,
            update_track_gain,
            add_track_effect,
            update_track_effect,
            add_track_clip,
            update_track_clip_time,
            update_track_clip_range,
            update_midi_track_clip,
            add_clip,
            // MIDI
            get_midi_input_devices,
            start_midi_connection,
            connect_to_midi_input_device,
            play_midi_key,
            start_midi_recording,
            stop_midi_recording,
            // VST
            create_vst,
            test_vst,
            open_vst_window,
            discover_vst_plugins,
            //Exporter
            export_file
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|_app_handle, event| {
        if let tauri::RunEvent::MainEventsCleared = event {
            PLUGIN_WINDOW_MAP.with_borrow_mut(|map| {
                // Cleanup any closed windows
                map.retain(|_, value| value.closed_by_user());
                // Sync any  window events
                for (_, window) in map {
                    let _ = window.service_platform_events();
                }
            });
        }
    })
}

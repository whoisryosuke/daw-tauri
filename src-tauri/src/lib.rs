mod audio_engine;
mod audio_node;
mod audio_player;

use tauri::path::BaseDirectory;
use tauri::{AppHandle, Builder, Emitter, Manager, State};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use symphonia::core::audio::{AudioBufferRef, Signal, SignalSpec};
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::{FormatOptions, Track };
use symphonia::core::meta::MetadataOptions;


use std::collections::{HashMap, VecDeque};
use std::fs::File;
use std::io::BufReader;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use std::{f32::consts::PI, sync::{Arc, Mutex}};

use crate::audio_engine::{AudioBuffer, AudioEngine};
use crate::audio_node::AudioNode;
use crate::audio_player::AudioPlayer;

const WAVEFORM_SAMPLE_NUM: usize = 2048;

type AudioSamples = HashMap<String, Vec<f32>>;

struct AudioState {
    engine: AudioEngine,
    // player: AudioPlayer,
    // samples: AudioSamples,
}

fn load_sample_data_from_disk(app: &AppHandle, file_name: &str) -> Vec<f32> {

    let resource_path = app.path().resolve("audio", BaseDirectory::Resource).expect("Couldn't get migrations folder");
    let audio_path = resource_path.join(file_name);

    // Open reader and probe MP3.
    let file = File::open(audio_path).expect("Couldn't load file");
    // let reader = BufReader::new(file);
    let mss = symphonia::core::io::MediaSourceStream::new(Box::new(file), Default::default());
    let mut hint = symphonia::core::probe::Hint::new();
    hint.with_extension("mp3");
    let probed = symphonia::default::get_probe().format(
        &hint,
        mss,
        &FormatOptions::default(),
        &MetadataOptions::default(),
    ).expect("Failed to probe audio format");

    
    let mut format = probed.format;

    // Select the first audio track.
    let track = format
        .tracks()
        .iter()
        .find(|t| t.codec_params.sample_rate.is_some())
        .expect("no audio track");

    let track_id = track.id;

    // Create a decoder.
    let mut decoder = symphonia::default::get_codecs().make(
        &track.codec_params,
        &DecoderOptions::default(),
    ).expect("Couldn't create decoder");

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
            },
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
                eprintln!(
                    "Unsupported sample format: {:?}",
                    other.spec()
                );
                return Vec::new()
            }
        }
    }

    samples

}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
async fn play_audio(app: AppHandle, state: State<'_, Mutex<AudioState>>) -> Result<bool, bool> {
    println!("loading audio from Rust");
    let mut state = state.lock().unwrap();

    // Get samples from cache
    let file_name = "ff8-magic.mp3".to_string();
    state.engine.play(file_name);

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {

            
            // Set up audio backend (aka CPAL)
            let mut engine = AudioEngine::new();
            
            // Setup additional global state
            // let audio_player = AudioPlayer::new();
            // let mut samples: AudioSamples = HashMap::new();

            // DEBUG: Load a test sample
            let file_name = "ff8-magic.mp3";
            let sample_data = load_sample_data_from_disk(app.handle(), file_name);
            engine.asset_store.insert(file_name.to_string(), AudioBuffer::new(sample_data, 0));
            
            app.manage(Mutex::new(AudioState {
                engine,
                // player: audio_player,
                // samples,
            }));

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, play_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

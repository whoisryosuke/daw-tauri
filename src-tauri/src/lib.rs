mod audio_engine;

use tauri::path::BaseDirectory;
use tauri::{AppHandle, Builder, Emitter, Manager, State};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use symphonia::core::audio::{AudioBufferRef, Signal, SignalSpec};
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::{FormatOptions, Track };
use symphonia::core::meta::MetadataOptions;


use std::collections::VecDeque;
use std::fs::File;
use std::io::BufReader;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use std::{f32::consts::PI, sync::{Arc, Mutex}};

const WAVEFORM_SAMPLE_NUM: usize = 2048;

struct AudioState {
    device: cpal::Device,
    config: cpal::SupportedStreamConfig,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn build_stream(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    cursor: Arc<Mutex<usize>>,
    samples: Vec<f32>,
    finish_flag: Arc<AtomicBool>,
    mut waveform_data: Arc<Mutex<VecDeque<f32>>>
) -> Result<cpal::Stream, cpal::BuildStreamError>
{
    let channels = config.channels as usize;

    device.build_output_stream(
        config,
        move |output: &mut [f32], _| {
            let mut pos = cursor.lock().unwrap();

            for frame in output.chunks_mut(channels) {
                // Run out of samples? Turn volume to 0
                if *pos >= samples.len() {
                    // Mark audio as finished playing
                    finish_flag.store(true, Ordering::Relaxed);

                    for ch in frame {
                        *ch = 0.0;
                    }
                    continue;
                }

                // Calculate mono sample by averaging all channels for this frame
                // Audio data is interleaved, so every other index we need to average
                let mono_sample = if channels > 1 {
                    let mut sum = 0.0;
                    for ch in 0..channels {
                        if *pos + ch < samples.len() {
                            sum += samples[*pos + ch];
                        }
                    }
                    sum / channels as f32
                } else {
                    samples[*pos]
                };

                // Send waveform data
                {
                    let mut waveform_data = waveform_data.lock().unwrap();
                    if waveform_data.len() >= WAVEFORM_SAMPLE_NUM {
                        waveform_data.pop_front();
                    }
                    waveform_data.push_back(mono_sample);
                }

                // Replace output channel with sample data
                for ch in 0..channels {
                    if *pos < samples.len() {
                        // Override output with our sample
                        frame[ch] = samples[*pos];
                        // Increment our sample array index counter
                        *pos += 1;
                    } else {
                        frame[ch] = 0.0;
                    }
                }
            }
        },
        move |err| eprintln!("stream error: {err}"),
        None,
    )
}

#[tauri::command]
async fn play_audio(app: AppHandle, state: State<'_, Mutex<AudioState>>) -> Result<bool, bool> {
    println!("playing audio from Rust");
    let mut state = state.lock().unwrap();

    let file_name = "ff8-magic.mp3";
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
                return Err(false)
            }
        }
    }
    
    // Shared audio buffer cursor for CPAL.
    let cursor = Arc::new(Mutex::new(0usize));
    let finished = Arc::new(AtomicBool::new(false));
    let finished_cb = Arc::clone(&finished);
    let waveform_data: Arc<Mutex<VecDeque<f32>>> = Arc::new(Mutex::new(VecDeque::with_capacity(WAVEFORM_SAMPLE_NUM)));

    let stream = match state.config.sample_format() {
        cpal::SampleFormat::F32 => build_stream(&state.device, &state.config.clone().into(), cursor, samples, finished_cb, waveform_data.clone()),
        cpal::SampleFormat::I16 =>  todo!(),
        cpal::SampleFormat::U16 => todo!(),
        cpal::SampleFormat::I8 => todo!(),
        cpal::SampleFormat::I24 => todo!(),
        cpal::SampleFormat::I32 => todo!(),
        cpal::SampleFormat::I64 => todo!(),
        cpal::SampleFormat::U8 => todo!(),
        cpal::SampleFormat::U32 => todo!(),
        cpal::SampleFormat::U64 => todo!(),
        cpal::SampleFormat::F64 => todo!(),
        _ => todo!(),
    }.expect("Audio error");

    stream.play().expect("Couldn't play");

    // Keep the thread alive while streaming audio.
    // std::thread::park();

    while !finished.load(Ordering::Relaxed) {
        // Send samples to frontend
        if let Ok(waveform_data) = waveform_data.lock() {
            if let Err(e) = app.emit("audio-waveform-time", &*waveform_data) {
                eprintln!("Failed to emit event: {}", e);
            }
        }

        std::thread::sleep(Duration::from_millis(100));
    }

    println!("finished playing audio");

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            
            // Set up CPAL.
            let host = cpal::default_host();
            let device = host
                .default_output_device()
                .expect("no output device available");

            let config = device.default_output_config().expect("Couldn't load config");

            app.manage(Mutex::new(AudioState {
                device,
                config,
            }));

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, play_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

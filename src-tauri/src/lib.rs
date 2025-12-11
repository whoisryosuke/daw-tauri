use tauri::path::BaseDirectory;
use tauri::{AppHandle, Builder, Manager, State};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use symphonia::core::audio::{AudioBufferRef, Signal, SignalSpec};
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::{FormatOptions, Track };
use symphonia::core::meta::MetadataOptions;


use std::fs::File;
use std::io::BufReader;
use std::{f32::consts::PI, sync::{Arc, Mutex}};

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
    samples: Vec<f32>
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
                    for ch in frame {
                        *ch = 0.0;
                    }
                    continue;
                }

                //
                for ch in 0..channels {
                    let sample = if *pos < samples.len() {
                        samples[*pos]
                    } else {
                        0.0
                    };
                    frame[ch] = sample;
                    *pos += 1;
                }
            }
        },
        move |err| eprintln!("stream error: {err}"),
        None,
    )
}

#[tauri::command]
fn play_audio(app: AppHandle, state: State<'_, Mutex<AudioState>>) {
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
                samples.extend_from_slice(buf.chan(0));
                if buf.spec().channels.count() > 1 {
                    // Interleave for multi-channel.
                    for frame in 0..buf.frames() {
                        for ch in 0..buf.spec().channels.count() {
                            samples.push(*buf.chan(ch).get(frame).expect("frame not found"));
                        }
                    }
                }
            }
            AudioBufferRef::S16(buf) => {
                for frame in 0..buf.frames() {
                    for ch in 0..buf.spec().channels.count() {
                        samples.push(buf.chan(ch)[frame] as f32 / i16::MAX as f32);
                    }
                }
            }
            other => {
                return eprintln!(
                    "Unsupported sample format: {:?}",
                    other.spec()
                );
            }
        }
    }
    
    // Shared audio buffer cursor for CPAL.
    let cursor = Arc::new(Mutex::new(0usize));

    let stream = match state.config.sample_format() {
        cpal::SampleFormat::F32 => build_stream(&state.device, &state.config.clone().into(), cursor, samples),
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
    std::thread::park();
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

use tauri::{Builder, Manager, State};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
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
    signal: Arc<Mutex<impl FnMut() -> f32 + Send + 'static>>,
) -> Result<cpal::Stream, cpal::BuildStreamError>
{
    let channels = config.channels as usize;

    device.build_output_stream(
        config,
        move |data: &mut [f32], _| {
            let mut osc = signal.lock().unwrap();

            for frame in data.chunks_mut(channels) {
                // We get latest oscillator value (which increments each call)
                let raw_sample = osc();
                // println!("raw_sample: {}", raw_sample);
                
                // Process signal

                // Convert to CPAL output sample type.
                let sample = raw_sample;

                // Overwrite the output signal with our sample
                for out in frame {
                    *out = sample;
                }
            }
        },
        move |err| eprintln!("stream error: {err}"),
        None,
    )
}

#[tauri::command]
fn play_audio(state: State<'_, Mutex<AudioState>>) {
    println!("playing audio from Rust");
    let mut state = state.lock().unwrap();
    
    
    // Simple sine wave oscillator.
    let freq = 440.0;
    let mut phase = 0.0f32;

    let sample_rate = state.config.sample_rate().0 as f32;
    let signal = move || {
        let value = (2.0 * PI * phase).sin();
        phase = (phase + freq / sample_rate) % 1.0;
        value
    };

    let shared = Arc::new(Mutex::new(signal));

    let stream = match state.config.sample_format() {
        cpal::SampleFormat::F32 => build_stream(&state.device, &state.config.clone().into(), shared),
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

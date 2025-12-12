use std::sync::Arc;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use ringbuf::HeapRb;

struct PlaybackBuffer {
    data: Vec<f32>,
    position: usize,
}

pub struct AudioEngine {
    /**
     * The audio stream. This has to stay alive to ensure sound continues playing.
     */
    stream: cpal::Stream,
    
    // device: &cpal::Device,
    config: cpal::StreamConfig,
    playback_buffer: ArcSwap<PlaybackBuffer>,
    heap: HeapRb<f32>,
}

impl AudioEngine {
    pub fn new() -> Self {
        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let config = device.default_output_config().expect("Couldn't load config");
         
        let initial_playback_buffer = Arc::new(
            PlaybackBuffer{
                data: vec![0.0; 1],
                position: 0,
            }
        );

        let playback_buffer = ArcSwap::new(initial_playback_buffer.clone());
        let playback_buffer_copy = playback_buffer.clone();

        let channels = config.channels() as usize;

        
        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_output_stream(&config.into(), move |output: &mut [f32], _| {
                Self::render(output, channels, &playback_buffer_copy);
            },
        |err| eprintln!("couldn't build audio stream: {err}"), None).expect("couldn't build audio stream"),
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
        };

        stream.play().expect("Couldn't play");

        Self {
            config: config.into(),
            stream,
            playback_buffer
        }
    }

    fn render(output: &mut [f32], channels: usize, buffer: &ArcSwap<PlaybackBuffer>) {
        let mut sample = buffer.load_full();

        for frame in output.chunks_mut(channels) {
            
            // Replace output channel with sample data
            for ch in 0..channels {
                if sample.position < sample.data.len() {
                    // Override output with our sample
                    frame[ch] = sample.data[sample.position];
                    // Increment our sample array index counter
                    sample.position += 1;
                } else {
                    frame[ch] = 0.0;
                }
            }
        }

        ArcSwap::store(buffer, sample);
    }
}
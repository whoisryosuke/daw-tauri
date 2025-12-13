use std::sync::{Arc, atomic::{AtomicBool, AtomicUsize, Ordering::Relaxed}};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use ringbuf::{Cons, HeapCons, HeapProd, HeapRb, Prod, SharedRb, storage::Heap, traits::{Consumer, Observer, Producer, Split}, wrap::caching::Caching};
use symphonia::core::sample;


const SAMPLE_BUFFER_SIZE: usize = 48_000;

pub struct AudioEngine {
    /**
     * The audio stream. This has to stay alive to ensure sound continues playing.
     */
    stream: cpal::Stream,
    
    config: cpal::SupportedStreamConfig,
    
    producer: HeapProd<f32>,
}

impl AudioEngine {
    pub fn new() -> Self {
        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let config = device.default_output_config().expect("Couldn't load config");

        // Allocate a ring buffer to hold samples for the audio stream
        let heap = HeapRb::<f32>::new(SAMPLE_BUFFER_SIZE);
        let (producer, mut consumer) = heap.split();
        
        let channels = config.channels() as usize;
        
        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_output_stream(&config.clone().into(), move |output: &mut [f32], _| {
                Self::render(output, channels, &mut consumer);
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
            config,
            stream,
            producer
        }
    }

    pub fn push_sample(&mut self, sample: f32) {
        while self.producer.is_full() {
            // Wait until we can insert sample
            std::thread::sleep(std::time::Duration::from_millis(1));
        }
        self.producer.try_push(sample);
    }

    fn render(output: &mut [f32], channels: usize, consumer: &mut HeapCons<f32>) {
        // Read from ring buffer
        // Loop over the output and override with new audio
        for frame in output.chunks_mut(channels) {
            
            // Replace output channel with sample data
            for ch in 0..channels {
                // Override output with our sample
                // Here we "pop" the value off, freeing up the ring buffer for more data
                let sample = consumer.try_pop().unwrap_or(0.0);
                frame[ch] = sample;
            }
        }
    }
}
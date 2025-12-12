use std::sync::{Arc, atomic::{AtomicBool, AtomicUsize, Ordering::Relaxed}};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use ringbuf::{HeapRb, SharedRb, storage::Heap, traits::{Consumer, Split}, wrap::caching::Caching};

const SAMPLE_BUFFER_SIZE: usize = 1024;

pub struct AudioEngine {
    /**
     * The audio stream. This has to stay alive to ensure sound continues playing.
     */
    stream: cpal::Stream,
    
    // device: &cpal::Device,
    config: cpal::StreamConfig,
    
    // heap: HeapRb<f32>,
    producer: Caching<Arc<SharedRb<Heap<f32>>>, true, false>,

    position: Arc<AtomicUsize>,
    finished: AtomicBool,
}

impl AudioEngine {
    pub fn new() -> Self {
        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let config = device.default_output_config().expect("Couldn't load config");

        // Heap
        let heap = HeapRb::<f32>::new(SAMPLE_BUFFER_SIZE);
        let (mut producer, mut consumer) = heap.split();
         
        // Create audio state
        // These need to be atomic so they can be updated
        let position = Arc::new(AtomicUsize::new(0usize));
        let finished = AtomicBool::new(false);
        // let waveform_data: Arc<Mutex<VecDeque<f32>>> = Arc::new(Mutex::new(VecDeque::with_capacity(WAVEFORM_SAMPLE_NUM)));

        // let playback_buffer = ArcSwap::new(initial_playback_buffer.clone());
        // let playback_buffer_copy = playback_buffer.clone();

        let channels = config.channels() as usize;

        
        let position_clone = Arc::clone(&position);
        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_output_stream(&config.clone().into(), move |output: &mut [f32], _| {
                Self::render(output, channels, &mut consumer, &position_clone);
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
            position,
            producer,
            // heap,
            finished,
        }
    }

    fn render(output: &mut [f32], channels: usize, consumer: &mut Caching<Arc<SharedRb<Heap<f32>>>, false, true>, position: &Arc<AtomicUsize>,) {
        // Read from ring buffer
        let mut samples = vec![0.0; SAMPLE_BUFFER_SIZE];
        let read = consumer.occupied_slices(&mut samples);
        
        let sample_index = position.load(Relaxed);

        // Loop over the output and override with new audio
        for frame in output.chunks_mut(channels) {
            
            // Replace output channel with sample data
            for ch in 0..channels {
                if sample_index < samples.len() {
                    // Override output with our sample
                    frame[ch] = samples[sample_index];
                    // Increment our sample array index counter
                    position.store(sample_index + 1, Relaxed);
                } else {
                    frame[ch] = 0.0;
                }
            }
        }
    }
}
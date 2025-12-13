use std::sync::{Arc, atomic::{AtomicBool, AtomicUsize, Ordering::Relaxed}};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use symphonia::core::sample;

const SAMPLE_BUFFER_SIZE: usize = 1024;

#[derive(Clone)]
pub struct AudioSample {
    playback_buffer: Vec<f32>,
    finished: Arc<AtomicBool>,
    position: Arc<AtomicUsize>,
}

impl AudioSample {
    pub fn new() -> Self {

        let playback_buffer = Vec::new();
        let position = Arc::new(AtomicUsize::new(0usize));
        let finished = Arc::new(AtomicBool::new(false));

        Self {
            playback_buffer,
            position,
            finished
        }
    }

    pub fn set_buffer(&mut self, new_buffer: Vec<f32>) {
        self.playback_buffer = new_buffer;
        self.position.store(0, Relaxed);
        self.finished.store(false, Relaxed);
    }

    pub fn next(&mut self) -> (bool, f32) {
        let sample_index = self.position.load(Relaxed);

        // Check if it's finished, otherwise keep incrementing
        let next_index = sample_index + 1;
        let mut finished = false;
        if next_index >= self.playback_buffer.len() {
            self.finished.store(true, Relaxed);
            finished = true;      

            // Return silence
            return (finished, 0.0)
        } else {
            self.position.store(sample_index + 1, Relaxed);
        }

        // Return current sample to user
        (finished, self.playback_buffer[sample_index])
    }
}

pub struct AudioEngine {
    /**
     * The audio stream. This has to stay alive to ensure sound continues playing.
     */
    stream: cpal::Stream,
    
    config: cpal::SupportedStreamConfig,
    
    pub playback_buffer: Arc<AudioSample>,
}

impl AudioEngine {
    pub fn new() -> Self {
        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let config = device.default_output_config().expect("Couldn't load config");
         
        // Create audio state
        // These need to be atomic so they can be updated
        // let position = Arc::new(AtomicUsize::new(0usize));
        // let finished = AtomicBool::new(false);
        // let waveform_data: Arc<Mutex<VecDeque<f32>>> = Arc::new(Mutex::new(VecDeque::with_capacity(WAVEFORM_SAMPLE_NUM)));

        let playback_buffer = Arc::new(AudioSample::new());
        let mut playback_buffer_copy = Arc::clone(&playback_buffer);

        
        let channels = config.channels() as usize;

        // Send the samples over 
        let mut get_samples = move || playback_buffer_copy.next();
        
        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_output_stream(&config.clone().into(), move |output: &mut [f32], _| {
                Self::render(output, channels, &mut get_samples);
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
            playback_buffer,
        }
    }

    fn render(output: &mut [f32], channels: usize, get_samples: &mut dyn FnMut() -> (bool, f32)) {
        // Read from ring buffer
        // Loop over the output and override with new audio
        for frame in output.chunks_mut(channels) {
            
            // Replace output channel with sample data
            for ch in 0..channels {
                let (finished, sample) = get_samples();
                println!("playing sound: {ch} {sample}");

                if !finished {
                    // Override output with our sample
                    frame[ch] = sample;
                } else {
                    frame[ch] = 0.0;
                }
            }
        }
    }
}
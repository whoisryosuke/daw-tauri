use std::{collections::HashMap, sync::{Arc, Mutex, atomic::{AtomicBool, AtomicUsize, Ordering::Relaxed}}};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use ringbuf::{Cons, HeapCons, HeapProd, HeapRb, Prod, SharedRb, storage::Heap, traits::{Consumer, Observer, Producer, Split}, wrap::caching::Caching};
use symphonia::core::sample;

use crate::audio_node::AudioNode;


const SAMPLE_BUFFER_SIZE: usize = 48_000;

/**
 * Queue of audio to play in the form of `AudioNode`s.
 * Plays each audio node sample by sample until they're finished, then removes them.
 * The queue is controlled by `AudioCommand`s
 */
pub struct Mixer {
    nodes: Vec<AudioNode>,
}

impl Mixer {
    pub fn process(
        &mut self,
        output: &mut [f32],
        channels: usize,
        consumer: &mut HeapCons<AudioCommand>,
    ) {
        // Handle commands
        while let Some(command) = consumer.try_pop() {
            match command {
                AudioCommand::Play(buffer) => {
                    self.nodes.push(AudioNode::new(buffer));
                },
                AudioCommand::Pause => {

                },
            }
        }
            
        // Read from ring buffer
        // Loop over the output and override with new audio
        for frame in output.chunks_mut(channels) {
            
            // Replace output channel with sample data
            for ch in 0..channels {
                
                let mut mix = 0.0;
                // Override output with our sample
                self.nodes.retain_mut(|node| {
                    if let Some(s) = node.get_sample() {
                        mix += s;
                        true
                    } else {
                        false
                    }
                });
                frame[ch] = mix;
            }
        }

    }
}

pub struct AudioBuffer {
    samples: Vec<f32>,
    sample_rate: i32,
}

impl AudioBuffer {
    pub fn new(samples: Vec<f32>, sample_rate: i32) -> Self{
        Self {
            samples, 
            sample_rate
        }
    }
}

type AssetId = String;

pub struct AssetStore {
    buffers: Mutex<HashMap<AssetId, Arc<AudioBuffer>>>,
}

impl AssetStore {
    pub fn insert(&mut self, id: AssetId, buffer: AudioBuffer) {
        let buffer_lock = self.buffers.lock();
        match buffer_lock {
            Ok(mut buffers) => {
                buffers.insert(id, Arc::new(buffer));
            },
            Err(error) => {
                eprintln!("{}", error);
            },
        }
    }
}

enum AudioCommand {
    Play(Vec<f32>),
    Pause,
}

pub struct AudioEngine {
    /**
     * The audio stream. This has to stay alive to ensure sound continues playing.
     */
    stream: cpal::Stream,
    
    config: cpal::SupportedStreamConfig,
    
    producer: HeapProd<AudioCommand>,
    
    pub asset_store: AssetStore,
}

impl AudioEngine {
    pub fn new() -> Self {
        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let config = device.default_output_config().expect("Couldn't load config");

        // Create the asset store to contain any samples cached in memory
        let asset_store = AssetStore { buffers: Mutex::new(HashMap::new()) };

        // Create a mixer
        let mut mixer = Mixer { nodes: Vec::new() };

        // Allocate a ring buffer to hold commands for the audio stream
        let heap = HeapRb::<AudioCommand>::new(128);
        let (producer, mut consumer) = heap.split();
        
        let channels = config.channels() as usize;
        
        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_output_stream(&config.clone().into(), move |output: &mut [f32], _| {
                // Run the mixer which runs any commands and 
                // combines samples into one signal,
                // then overrides the output signal with it
                mixer.process(output, channels, &mut consumer);
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
            producer,
            asset_store
        }
    }

    pub fn play(&mut self, id: AssetId) {
        let buffer = {
            let asset_store = self.asset_store.buffers.lock().expect("Couldn't lock asset store buffer");
            asset_store.get(&id).map(|buf| buf.samples.clone())
        };
        if let Some(buffer) = buffer {
            self.send_command(AudioCommand::Play(buffer));
        }
    }

    pub fn send_command(&mut self, command: AudioCommand) {
        // Wait until we can insert sample
        while self.producer.is_full() {
            std::thread::sleep(std::time::Duration::from_millis(1));
        }

        self.producer.try_push(command);
    }

}
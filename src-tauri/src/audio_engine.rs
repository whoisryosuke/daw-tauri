use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicBool, AtomicUsize, Ordering::Relaxed},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use crossbeam::channel::{Receiver, Sender};
use tauri::{AppHandle, Emitter};

use crate::audio_node::{AudioNode, SampleNode};

const SAMPLE_BUFFER_SIZE: usize = 48_000;

/**
 * Queue of audio to play in the form of `AudioNode`s.
 * Plays each audio node sample by sample until they're finished, then removes them.
 * The queue is controlled by `AudioCommand`s
 */
pub struct Mixer {
    nodes: Vec<SampleNode>,
}

impl Mixer {
    pub fn process(
        &mut self,
        output: &mut [f32],
        channels: usize,
        consumer: &mut Receiver<AudioCommand>,
        waveform_producer: &mut Sender<f32>,
    ) {
        // Handle commands
        while let Ok(command) = consumer.try_recv() {
            match command {
                AudioCommand::Play(buffer) => {
                    self.nodes.push(SampleNode::new(buffer));
                }
                AudioCommand::Pause => {}
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

                // Send the waveform data
                waveform_producer.try_send(mix);
            }
        }
    }
}

pub struct AudioBuffer {
    samples: Arc<Vec<f32>>,
    sample_rate: i32,
}

impl AudioBuffer {
    pub fn new(samples: Vec<f32>, sample_rate: i32) -> Self {
        Self {
            samples: Arc::new(samples),
            sample_rate,
        }
    }
}

type AssetId = String;

pub struct AssetStore {
    buffers: Mutex<HashMap<AssetId, Arc<AudioBuffer>>>,
}

impl AssetStore {
    pub fn new(buffers: Mutex<HashMap<AssetId, Arc<AudioBuffer>>>) -> Self {
        Self { buffers }
    }
    pub fn insert(&mut self, id: AssetId, buffer: AudioBuffer) {
        let buffer_lock = self.buffers.lock();
        match buffer_lock {
            Ok(mut buffers) => {
                buffers.insert(id, Arc::new(buffer));
            }
            Err(error) => {
                eprintln!("{}", error);
            }
        }
    }
    pub fn get_buffer_by_id(&self, id: AssetId) -> Option<Arc<AudioBuffer>> {
        let buffer = {
            let asset_store = self
                .buffers
                .lock()
                .expect("Couldn't lock asset store buffer");
            asset_store.get(&id).cloned()
        };
        buffer
    }
}

pub enum AudioCommand {
    Play(Vec<f32>),
    Pause,
}

pub struct AudioEngineMessaging {
    producer: Sender<AudioCommand>,
}
impl AudioEngineMessaging {
    pub fn new(app: AppHandle, producer: Sender<AudioCommand>, waveform: Receiver<f32>) -> Self {
        Self::spawn_waveform_thread(app, waveform);

        Self { producer }
    }

    pub fn play(&self, buffer: Option<Arc<AudioBuffer>>) {
        if let Some(buffer) = buffer {
            // The AudioBuffer here has "samples" that are also wrapped in `Arc`
            // so we can ideally do a "free" clone
            self.send_command(AudioCommand::Play(buffer.samples.clone().to_vec()));
        }
    }

    pub fn send_command(&self, command: AudioCommand) {
        // Wait until we can insert sample
        while self.producer.is_full() {
            std::thread::sleep(std::time::Duration::from_millis(1));
        }

        let result = self.producer.try_send(command);

        println!("command result: {:?}", result);
    }

    pub fn spawn_waveform_thread(app: AppHandle, waveform: Receiver<f32>) {
        thread::spawn(move || {
            let mut waveform_buffer = Vec::with_capacity(512);

            loop {
                // Handle commands
                while let Ok(waveform_data) = waveform.try_recv() {
                    waveform_buffer.push(waveform_data);
                }

                if !waveform_buffer.is_empty() {
                    let _ = app.emit("waveform", waveform_buffer.clone());
                    waveform_buffer.clear();
                }
                thread::sleep(Duration::from_millis(16)); // ~60 FPS
            }
        });
    }
}

pub struct AudioEngine {
    /**
     * The audio stream. This has to stay alive to ensure sound continues playing.
     */
    stream: cpal::Stream,

    config: cpal::SupportedStreamConfig,
}

impl AudioEngine {
    pub fn new(mut consumer: Receiver<AudioCommand>, mut waveform_producer: Sender<f32>) -> Self {
        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let config = device
            .default_output_config()
            .expect("Couldn't load config");
        // Create a mixer
        let mut mixer = Mixer { nodes: Vec::new() };

        let channels = config.channels() as usize;

        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device
                .build_output_stream(
                    &config.clone().into(),
                    move |output: &mut [f32], _| {
                        // Run the mixer which runs any commands and
                        // combines samples into one signal,
                        // then overrides the output signal with it
                        mixer.process(output, channels, &mut consumer, &mut waveform_producer);
                    },
                    |err| eprintln!("couldn't build audio stream: {err}"),
                    None,
                )
                .expect("couldn't build audio stream"),
            cpal::SampleFormat::I16 => todo!(),
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

        Self { config, stream }
    }
}

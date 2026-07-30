use std::{
    collections::HashMap,
    sync::{
        atomic::{
            AtomicBool, AtomicU64, AtomicUsize,
            Ordering::{self, Relaxed},
        },
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    SampleRate,
};
use crossbeam::channel::{Receiver, Sender};
use tauri::{AppHandle, Emitter};

use crate::{
    audio_buffer::AudioBuffer,
    audio_node::{AudioNode, AudioNodeTypes, SampleNode, SynthNode},
};

/**
 * Queue of audio to play in the form of `AudioNode`s.
 * Plays each audio node sample by sample until they're finished, then removes them.
 * The queue is controlled by `AudioCommand`s
 */
pub struct Mixer {
    nodes: Vec<AudioNodeTypes>,
    playing: bool,
}

impl Mixer {
    pub fn new() -> Self {
        Self {
            nodes: Vec::new(),
            playing: false,
        }
    }

    pub fn process(
        &mut self,
        output: &mut [f32],
        channels: usize,
        sample_rate: u32,
        consumer: &mut Receiver<AudioCommand>,
        waveform_producer: &mut Sender<f32>,
        playback_time: Arc<AtomicU64>,
    ) {
        // Handle commands
        while let Ok(command) = consumer.try_recv() {
            match command {
                AudioCommand::Play(buffer) => {
                    self.nodes
                        .push(AudioNodeTypes::StaticBuffer(SampleNode::new(buffer)));
                    self.playing = true;
                }
                AudioCommand::AddSynth => {
                    self.nodes
                        .push(AudioNodeTypes::Synthesizer(SynthNode::new(sample_rate)));
                    // @TODO: Need to keep track of synth somehow to allow for removing
                }
                AudioCommand::RemoveSynth(id) => {
                    self.nodes[id] = AudioNodeTypes::Silence;
                }
                AudioCommand::Pause => {
                    self.playing = false;
                }
            }
        }

        // Check if we have anything to play
        // We don't stop audio immediately, or you may get strange noises without resetting signal
        let should_play = self.nodes.len() > 0;

        // Not playing? Don't update samples
        if self.playing == false {
            return;
        }

        // Get current time for playback
        let current_time = playback_time.load(Ordering::Relaxed);

        // Debug input for now
        // TODO: This would be mic input that should be mixed into output
        let input_raw = [1.0, 2.0, 3.0, 4.0, 5.0];
        let input: &[f32] = &input_raw;

        // Process all nodes (aka play audio, apply effects like gain, etc)
        self.nodes.iter_mut().for_each(|node| {
            node.process(input, output, current_time as f32);
        });

        // Increment frame timer
        if should_play {
            let sample_count = (output.len() / channels) as u64;
            playback_time.fetch_add(sample_count, Ordering::Relaxed);
            // Update waveform (decimated: ~256 samples per callback max)
            // TODO: Use peak envelopes instead of decimation.
            let frames = output.len() / channels;
            let stride = (frames / 256).max(1);
            for frame in (0..frames).step_by(stride) {
                let _ = waveform_producer.try_send(output[frame * channels]);
            }
        }
    }
}

pub enum AudioCommand {
    Play(Vec<f32>),
    AddSynth,
    RemoveSynth(usize),
    Pause,
}

pub struct AudioEngineMessaging {
    producer: Sender<AudioCommand>,
    playback_time: Arc<AtomicU64>,
}
impl AudioEngineMessaging {
    pub fn new(
        app: AppHandle,
        producer: Sender<AudioCommand>,
        waveform: Receiver<f32>,
        playback_time: Arc<AtomicU64>,
    ) -> Self {
        Self::spawn_waveform_thread(app, waveform, playback_time.clone());

        Self {
            producer,
            playback_time: playback_time.clone(),
        }
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

    pub fn add_synth(&self) {
        self.send_command(AudioCommand::AddSynth);
    }

    pub fn stop(&self) {
        self.send_command(AudioCommand::Pause);
        self.playback_time.store(0, Ordering::SeqCst);
    }

    pub fn spawn_waveform_thread(
        app: AppHandle,
        waveform: Receiver<f32>,
        playback_time: Arc<AtomicU64>,
    ) {
        thread::spawn(move || {
            let mut waveform_buffer = Vec::with_capacity(512);

            loop {
                // Handle commands
                while let Ok(waveform_data) = waveform.try_recv() {
                    waveform_buffer.push(waveform_data);
                }

                // Send data to frontend
                if !waveform_buffer.is_empty() {
                    let _ = app.emit("waveform", waveform_buffer.clone());
                    waveform_buffer.clear();
                }
                let _ = app.emit("playback_time", playback_time.load(Ordering::SeqCst));

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

    pub config: cpal::SupportedStreamConfig,
}

impl AudioEngine {
    pub fn new(
        mut consumer: Receiver<AudioCommand>,
        mut waveform_producer: Sender<f32>,
        playback_time: Arc<AtomicU64>,
    ) -> Self {
        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let config = device
            .default_output_config()
            .expect("Couldn't load config");
        // Create a mixer
        let mut mixer = Mixer::new();

        let SampleRate(sample_rate) = config.sample_rate();

        let channels = config.channels() as usize;

        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device
                .build_output_stream(
                    &config.clone().into(),
                    move |output: &mut [f32], _| {
                        let playback_time_clone = playback_time.clone();
                        // Run the mixer which runs any commands and
                        // combines samples into one signal,
                        // then overrides the output signal with it
                        mixer.process(
                            output,
                            channels,
                            sample_rate,
                            &mut consumer,
                            &mut waveform_producer,
                            playback_time_clone,
                        );
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

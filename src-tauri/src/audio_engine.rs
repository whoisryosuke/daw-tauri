use std::{
    collections::HashMap,
    println,
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
    audio_cache::AudioCache,
    audio_node::{AudioNode, AudioNodeTypes, EffectNodeTypes, SampleNode, SynthNode},
    composition::{CompositionStore, TrackClipType},
    math::seconds_to_frames,
};

pub struct MixerTrack {
    current_node: usize,

    nodes: Vec<AudioNodeTypes>,
    fx: Vec<EffectNodeTypes>,

    /// Scratch buffer to do track-specific operations on signal
    process_buffer: Vec<f32>,
    gain: f32,
}

impl MixerTrack {
    pub fn new() -> Self {
        let nodes = Vec::new();
        let fx = Vec::new();
        let process_buffer = Vec::new();

        Self {
            current_node: 0usize,
            nodes,
            fx,
            process_buffer,
            gain: 1.0,
        }
    }
}

/**
 * Queue of audio to play in the form of `AudioNode`s.
 * Plays each audio node sample by sample until they're finished, then removes them.
 * The queue is controlled by `AudioCommand`s
 */
pub struct Mixer {
    tracks: [MixerTrack; 20],
    playing: bool,
}

impl Mixer {
    pub fn new() -> Self {
        Self {
            tracks: std::array::from_fn(|_| MixerTrack::new()),
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
                AudioCommand::Play => {
                    self.playing = true;
                }
                AudioCommand::AddSample(track_index, node) => {
                    self.tracks[track_index].nodes.push(node);
                }
                AudioCommand::AddSynth(track_index) => {
                    self.tracks[track_index]
                        .nodes
                        .push(AudioNodeTypes::Synthesizer(SynthNode::new(sample_rate)));
                    // @TODO: Need to keep track of synth somehow to allow for removing
                }
                AudioCommand::RemoveSynth(track_index, id) => {
                    self.tracks[track_index].nodes[id] = AudioNodeTypes::Silence;
                }
                AudioCommand::Pause => {
                    self.playing = false;
                    // Clear output buffer to prevent screeching from leftover signals
                    output.fill(0.0);
                }
                AudioCommand::ClearNodes => {
                    for track in self.tracks.each_mut() {
                        // @TODO: Clear each node and make it silent
                    }
                }
            }
        }

        // Not playing? Don't update samples
        if self.playing == false {
            return;
        }

        // Get current time for playback
        let current_time = playback_time.load(Ordering::Relaxed);

        // Zero out output
        // TODO: I'm skeptical of this, here for testing to avoid accumulation
        output.fill(0.0);

        // Process all nodes (aka play audio, apply effects like gain, etc)
        // First we loop through each "track" and run processing locally
        for track in self.tracks.iter_mut() {
            // Allocate memory
            // TODO: Get this out of here!! just expose buffer size and allocate on track init
            if track.process_buffer.len() != output.len() {
                track.process_buffer.resize(output.len(), 0.0);
            }
            track.process_buffer.fill(0.0);

            for node in track.nodes.iter_mut() {
                node.process(&mut track.process_buffer, current_time);
            }
            // Then I need to loop over fx and provide result from above
            for fx in track.fx.iter_mut() {
                fx.process(&mut track.process_buffer, current_time);
            }

            // Any final track operations (e.g. track-based gain)
            if track.gain != 1.0 {
                for sample in track.process_buffer.iter_mut() {
                    *sample *= track.gain;
                }
            }

            // Then we combine (or "mix") all the signals together
            for (i, sample) in track.process_buffer.iter().enumerate() {
                output[i] += *sample;
            }
        }

        // Increment frame timer
        if self.playing {
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
    Play,
    AddSample(usize, AudioNodeTypes),
    AddSynth(usize),
    RemoveSynth(usize, usize),
    Pause,
    ClearNodes,
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

    pub fn play(
        &self,
        composition: &CompositionStore,
        asset_store: &AudioCache,
        sample_rate: u32,
        channel_count: usize,
    ) {
        println!("Playing timeline audio");

        // Queue up clips to play
        // Loop through each track in the composition
        for (track_index, (track_id, track)) in composition.tracks.iter().enumerate() {
            // TODO: Check if track is muted - don't add if so
            println!("Playing timeline track {}", track.name);

            // Grab clips inside that track (tecnically clip "references" by ID)
            match composition.track_clips.get(track_id) {
                Some(track_clips) => {
                    println!("Got track clips {}", track.name);
                    // Loop over each "track clip" then find actual audio clip
                    for track_clip in track_clips {
                        println!("Got track clips {}", track_clip.start_time);
                        // Handle each clip type (samples vs synths)
                        match track_clip.track_clip_type {
                            TrackClipType::Sample => {
                                println!("Got track clips {}", track_clip.clip_id);
                                // Find the actual clip data from the clip cache
                                match composition.clips.get(&track_clip.clip_id) {
                                    Some(clip) => {
                                        match asset_store.get_buffer_by_id(&clip.clip_id) {
                                            // Create audio nodes for the mixer to process
                                            Some(clip_data) => {
                                                let start_time = seconds_to_frames(
                                                    track_clip.start_time,
                                                    sample_rate,
                                                )
                                                .unwrap_or(0);
                                                let node =
                                                    AudioNodeTypes::StaticBuffer(SampleNode::new(
                                                        clip_data.samples.clone(),
                                                        start_time,
                                                    ));

                                                println!("Creating audio node {}", clip.name);

                                                self.send_command(AudioCommand::AddSample(
                                                    track_index,
                                                    node,
                                                ));
                                            }
                                            None => {
                                                println!(
                                                    "Couldn't get clip's asset from cache {}",
                                                    track.name
                                                );
                                            }
                                        }
                                    }
                                    None => {
                                        println!("Couldn't get the clip {}", track.name);
                                    }
                                }
                            }
                            TrackClipType::Synthesizer => {
                                self.add_synth(track_index);
                            }
                        }
                    }
                }
                None => {
                    println!("Couldn't load the track clips {}", track.name);
                }
            }
        }

        // Tell audio thread to start playing now that it has audio nodes
        self.send_command(AudioCommand::Play);
    }

    pub fn send_command(&self, command: AudioCommand) {
        // Wait until we can insert sample
        while self.producer.is_full() {
            std::thread::sleep(std::time::Duration::from_millis(1));
        }

        let result = self.producer.try_send(command);

        println!("command result: {:?}", result);
    }

    pub fn add_synth(&self, track_index: usize) {
        self.send_command(AudioCommand::AddSynth(track_index));
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

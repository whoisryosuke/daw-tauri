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
    Device, SampleRate, SupportedStreamConfig,
};
use crossbeam::channel::{Receiver, Sender};
use tauri::{window::Effect, AppHandle, Emitter, Manager};

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
                AudioCommand::AddEffect(track_index, node) => {
                    self.tracks[track_index].fx.push(node);
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
                AudioCommand::SetMixerGain(track_index, gain) => {
                    self.tracks[track_index].gain = gain;
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
            if track.gain < 1.0 {
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
    AddEffect(usize, EffectNodeTypes),
    RemoveSynth(usize, usize),
    Pause,
    ClearNodes,
    SetMixerGain(usize, f32),
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
        for (track_id, track) in composition.tracks.iter() {
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
                                                    track.pool_index,
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
                                self.add_synth(track.pool_index);
                            }
                        }
                    }

                    // Handle any effects
                    let effects = composition
                        .track_effects
                        .iter()
                        .filter(|(_, item)| &item.track_id == track_id);
                    effects.for_each(|(_, item)| {
                        println!("Creating effect node");

                        self.send_command(AudioCommand::AddEffect(
                            track.pool_index,
                            item.effect.clone(),
                        ));
                    });
                }
                None => {
                    println!("Couldn't load the track clips {}", track.name);
                }
            }
        }

        // Tell audio thread to start playing now that it has audio nodes
        self.send_command(AudioCommand::Play);
    }

    pub fn update_mixer_track_gain(&self, track_index: usize, gain: f32) {
        // Sync track gain to mixer track
        self.send_command(AudioCommand::SetMixerGain(track_index, gain));
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
    stream: Option<cpal::Stream>,

    pub config: cpal::SupportedStreamConfig,

    pub selected_device: String,

    consumer: Receiver<AudioCommand>,
    playback_time: Arc<AtomicU64>,
    waveform_producer: Sender<f32>,
}

impl AudioEngine {
    pub fn new(app: AppHandle) -> Self {
        // Allocate a ring buffer to hold commands for the audio stream
        let (producer, consumer) = crossbeam::channel::bounded::<AudioCommand>(128);
        let (waveform_producer, waveform_consumer) = crossbeam::channel::bounded::<f32>(128);

        // Allocate atomic memory for some shared state (like playback time)
        let playback_time = Arc::new(AtomicU64::new(0));

        // Create the messaging layer between UI and AudioEngine
        let messaging = AudioEngineMessaging::new(
            app.app_handle().clone(),
            producer,
            waveform_consumer,
            playback_time.clone(),
        );
        app.manage(messaging);

        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let selected_device = device.name().unwrap_or("Default Device".to_string());

        let config = device
            .default_output_config()
            .expect("Couldn't load config");

        let mut engine = Self {
            config,
            stream: None,
            selected_device,
            consumer,
            playback_time,
            waveform_producer,
        };

        engine.create_audio_stream(device);

        engine
    }

    fn create_audio_stream(&mut self, device: Device) -> Result<(), Box<dyn std::error::Error>> {
        // Create a new audio config for this specific device
        self.config = device.default_output_config().map_err(|e| e.to_string())?;

        // Create a mixer
        let mut mixer = Mixer::new();

        let SampleRate(sample_rate) = self.config.sample_rate();

        let channels = self.config.channels() as usize;
        let mut cloned_consumer = self.consumer.clone();
        let mut waveform_producer = self.waveform_producer.clone();
        let playback_time_clone = self.playback_time.clone();

        let stream = match self.config.sample_format() {
            cpal::SampleFormat::F32 => device
                .build_output_stream(
                    &self.config.clone().into(),
                    move |output: &mut [f32], _| {
                        let playback_time_local_clone = playback_time_clone.clone();
                        // Run the mixer which runs any commands and
                        // combines samples into one signal,
                        // then overrides the output signal with it
                        mixer.process(
                            output,
                            channels,
                            sample_rate,
                            &mut cloned_consumer,
                            &mut waveform_producer,
                            playback_time_local_clone,
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

        self.stream = Some(stream);

        Ok(())
    }

    pub fn create_stream_for_device_name(
        &mut self,
        device_name: String,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let host = cpal::default_host();

        // Find the device by name...
        let device = host
            .output_devices()
            .map_err(|e| e.to_string())?
            .find(|d| d.name().unwrap_or("".to_string()) == device_name)
            .ok_or("Device not found")?;

        // Recreate the stream using the engine's existing context
        self.create_audio_stream(device)
            .map_err(|e| e.to_string())?;

        self.selected_device = device_name;

        println!("Changed audio device to {}", self.selected_device);

        Ok(())
    }
}

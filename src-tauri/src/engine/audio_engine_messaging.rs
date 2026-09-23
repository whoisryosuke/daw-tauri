use std::{
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    thread,
    time::Duration,
};
use tauri::async_runtime::Mutex;

use crossbeam::channel::{Receiver, Sender};
use tauri::{AppHandle, Emitter, Manager};

use crate::{
    cache::media_cache::AudioCache,
    composition::{
        composition::CompositionStore,
        track::TrackType,
        track_clips::{TrackClip, TrackClipType},
    },
    engine::nodes::{
        audio::{sample_node::SampleNode, vst_node::VstNode},
        audio_node::AudioNodeTypes,
        effect_node::EffectNodeTypes,
    },
    math::seconds_to_frames,
    music::sampler::Sampler,
    vst::vst_cache::VstPluginInstance,
};

pub enum AudioCommand {
    Play,
    AddAudioNode(usize, AudioNodeTypes),
    AddSynth(usize, u32),
    AddEffect(usize, EffectNodeTypes),
    RemoveSynth(usize, usize),
    Pause,
    ClearNodes,
    Seek(u64),
    SetMixerGain(usize, f32),
    /// Queue an audio node for immediate playback. Requires an index
    AddPlaybackSample(u8, AudioNodeTypes),
    StopPlaybackNode(u8),
}

pub struct AudioEngineMessaging {
    app: AppHandle,
    producer: Sender<AudioCommand>,
    playback_time: Arc<AtomicU64>,
    sampler: Sampler,
}
impl AudioEngineMessaging {
    pub fn new(
        app: AppHandle,
        producer: Sender<AudioCommand>,
        waveform: Receiver<f32>,
        playback_time: Arc<AtomicU64>,
        sample_rate: u32,
    ) -> Self {
        Self::spawn_waveform_thread(app.clone(), waveform, playback_time.clone());

        let sampler = Sampler::new(60, sample_rate as f32);

        Self {
            app: app.clone(),
            producer,
            playback_time: playback_time.clone(),
            sampler,
        }
    }

    /// Play the composition.
    /// Loops through all tracks and queues track clips as audio nodes.
    pub fn play(
        &self,
        composition: &CompositionStore,
        asset_store: &AudioCache,
        sample_rate: u32,
        _channel_count: usize,
    ) {
        println!("Playing timeline audio");

        let (track_clips, effects) = composition.play();

        for (pool_index, track_clip) in track_clips {
            match track_clip.track_clip_type {
                TrackClipType::Sample => self.queue_sample(
                    pool_index,
                    track_clip,
                    composition,
                    asset_store,
                    sample_rate,
                ),
                TrackClipType::Synthesizer => self.add_synth(pool_index, sample_rate),
                // @TODO: Handle adding MIDI nodes
                TrackClipType::Midi => {}
            }
        }

        for (pool_index, item) in effects {
            self.send_command(AudioCommand::AddEffect(pool_index, item.effect.clone()));
        }

        // Handle seeking
        let new_time = self.playback_time.load(Ordering::SeqCst);
        self.send_command(AudioCommand::Seek(new_time));

        // Tell audio thread to start playing now that it has audio nodes
        self.send_command(AudioCommand::Play);
    }

    pub fn play_midi_input(&self, midi_key: u8) {
        // Get composition state and selected MIDI track
        let composition_handle = self.app.state::<Mutex<CompositionStore>>();

        let Ok(composition) = composition_handle.try_lock() else {
            println!("Couldn't lock composition");
            return;
        };

        let Some(midi_track_id) = &composition.play_midi_track else {
            println!("No MIDI track set");
            return;
        };

        let midi_track_id_key = midi_track_id.clone();

        // Get selected the MIDI track for the `clip`
        let Some(track) = composition.tracks.get(&midi_track_id_key) else {
            println!("Can't find MIDI track");
            // TODO: Handle error
            return;
        };
        let TrackType::Midi(midi_data) = &track.track_type else {
            println!("Can't get MIDI data from track");
            return;
        };

        // Get Clip by ID
        let Some(clip_id) = &midi_data.clip else {
            return;
        };

        let Some(clip) = composition.clips.get(&clip_id.clone()) else {
            println!("Can't get clip for MIDI");
            return;
        };

        // Get audio buffer from cache
        let audio_cache = self.app.state::<AudioCache>();

        let Some(clip_data) = audio_cache.get_buffer_by_id(&clip.clip_id) else {
            // TODO: Handle error "Couldn't find that asset"
            println!("Can't find audio cache for MIDI");
            return;
        };

        // Resample audio for playback
        let buffer = clip_data.samples.clone();
        let Ok(pitched_buffer) = self.sampler.pitch_shift(&buffer, midi_key) else {
            return;
        };

        // Create and queue node
        let node = AudioNodeTypes::StaticBuffer(SampleNode::new(Arc::new(pitched_buffer), 0, None));

        self.send_command(AudioCommand::AddPlaybackSample(midi_key, node));
    }

    pub fn stop_midi_input(&self, midi_key: u8) {
        self.send_command(AudioCommand::StopPlaybackNode(midi_key));
    }

    pub fn play_immediate_audio(&self, buffer: Vec<f32>) {
        // Create and queue node
        let node = AudioNodeTypes::StaticBuffer(SampleNode::new(Arc::new(buffer), 0, None));

        self.send_command(AudioCommand::AddPlaybackSample(0, node));
    }

    pub fn update_mixer_track_gain(&self, track_index: usize, gain: f32) {
        // Sync track gain to mixer track
        self.send_command(AudioCommand::SetMixerGain(track_index, gain));
    }

    pub fn create_vst_node(&self, track_index: u8, sample_rate: f64, plugin: VstPluginInstance) {
        let inner_node = VstNode::new(plugin, sample_rate);
        let node = AudioNodeTypes::Vst(inner_node);
        self.send_command(AudioCommand::AddPlaybackSample(track_index, node));
    }

    pub fn send_command(&self, command: AudioCommand) {
        // Wait until we can insert sample
        while self.producer.is_full() {
            std::thread::sleep(std::time::Duration::from_millis(1));
        }

        let result = self.producer.try_send(command);

        println!("command result: {:?}", result);
    }

    /// Create audio node from track clip using asset store data,
    /// then add node to appropriate mixer track via audio command.
    fn queue_sample(
        &self,
        pool_index: usize,
        track_clip: &TrackClip,
        composition: &CompositionStore,
        asset_store: &AudioCache,
        sample_rate: u32,
    ) {
        let Some(clip) = composition.clips.get(&track_clip.clip_id) else {
            println!("Couldn't get the clip {}", track_clip.clip_id);
            return;
        };
        let Some(clip_data) = asset_store.get_buffer_by_id(&clip.clip_id) else {
            println!("Couldn't get clip's asset from cache {}", clip.clip_id);
            return;
        };

        let start_time = seconds_to_frames(track_clip.start_time, sample_rate).unwrap_or(0);

        // Handle clip start/end time
        let frame_range = track_clip.range.map(|(start, end)| {
            // Convert seconds to frames
            // This assumes audio buffer from clip matches sample rate of app
            let start_frame = seconds_to_frames(start, sample_rate).unwrap_or(0);
            let end_frame = seconds_to_frames(end, sample_rate).unwrap_or(0);

            return (start_frame as usize, end_frame as usize);
        });

        println!("Creating audio node {}", clip.name);

        self.create_sample_node(
            clip_data.samples.clone(),
            start_time,
            pool_index,
            frame_range,
        );
    }

    /// Creates a sample node and send to mixer
    fn create_sample_node(
        &self,
        samples: Arc<Vec<f32>>,
        start_time: u64,
        track_index: usize,
        track_clip_range: Option<(usize, usize)>,
    ) {
        let node = AudioNodeTypes::StaticBuffer(SampleNode::new(
            samples.clone(),
            start_time,
            track_clip_range,
        ));

        self.send_command(AudioCommand::AddAudioNode(track_index, node));
    }

    pub fn add_synth(&self, track_index: usize, sample_rate: u32) {
        self.send_command(AudioCommand::AddSynth(track_index, sample_rate));
    }

    pub fn stop(&self) {
        self.send_command(AudioCommand::Pause);
        self.playback_time.store(0, Ordering::SeqCst);
        self.send_command(AudioCommand::ClearNodes);
    }

    /// Set playback time (in frames)
    pub fn set_playback_time(&self, new_time: u64) {
        self.playback_time.store(new_time, Ordering::Relaxed);

        // @TODO: Reschedule audio nodes based on new time
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

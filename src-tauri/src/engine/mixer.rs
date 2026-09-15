use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
};

use crossbeam::channel::{Receiver, Sender};
use slab::Slab;

use crate::engine::{
    audio_engine_messaging::AudioCommand,
    nodes::audio_node::{AudioNodeTypes, EffectNodeTypes, SynthNode},
};

const MAX_NODES: usize = 24;

pub struct MixerTrack {
    current_node: usize,

    nodes: Slab<AudioNodeTypes>,
    fx: Slab<EffectNodeTypes>,

    /// Scratch buffer to do track-specific operations on signal
    process_buffer: Vec<f32>,
    gain: f32,
}

impl MixerTrack {
    pub fn new(buffer_size: usize) -> Self {
        let nodes = Slab::with_capacity(MAX_NODES);
        let fx = Slab::with_capacity(MAX_NODES);
        let process_buffer = Vec::with_capacity(buffer_size);

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
    playback_nodes: Slab<AudioNodeTypes>,
    /// Maps MIDI keys to slab handles containing nodes
    playback_map: HashMap<u8, usize>,
    playback_process_buffer: Vec<f32>,
    /// Small collection to keep track of removed node IDs when they finish playing
    remove_node_handles: Vec<Option<usize>>,
    tracks: [MixerTrack; 20],
    playing: bool,
}

impl Mixer {
    pub fn new(buffer_size: usize) -> Self {
        let mut tracks = std::array::from_fn(|_| MixerTrack::new(buffer_size));
        let playback_nodes = Slab::with_capacity(MAX_NODES);
        let playback_process_buffer = Vec::with_capacity(buffer_size);
        let playback_map = HashMap::with_capacity(MAX_NODES);
        let remove_node_handles = Vec::with_capacity(MAX_NODES);

        // Pre-allocate memory for each track based on audio device's max buffer size
        for track in tracks.iter_mut() {
            if track.process_buffer.len() != buffer_size {
                track.process_buffer.resize(buffer_size, 0.0);
            }
        }

        Self {
            playback_nodes,
            playback_map,
            playback_process_buffer,
            remove_node_handles,
            tracks,
            playing: false,
        }
    }

    fn process_playback(&mut self, output: &mut [f32]) {
        let buffer_size = output.len();

        // If needed, resize scratch buffer. Minimal allocation, only happens once per device.
        if buffer_size > self.playback_process_buffer.len() {
            self.playback_process_buffer.resize(buffer_size, 0.0);
        }

        // Grab a slice of our track's process buffer that matches current output length
        // This lets us have a larger buffer to accomodate varying output/block size
        let playback_scratch_buffer = &mut self.playback_process_buffer[..buffer_size];

        // Reset buffer to prevent accumulation
        playback_scratch_buffer.fill(0.0);

        // Handle any immediate playback
        for (_, playback_node) in self.playback_nodes.iter_mut() {
            playback_node.process(playback_scratch_buffer, 0);
        }

        for (i, sample) in playback_scratch_buffer.iter().enumerate() {
            output[i] += *sample;
        }

        // Remove any finished nodes
        for (node_id, node) in self.playback_nodes.iter_mut() {
            // The only nodes that currently finish are audio buffers
            if let AudioNodeTypes::StaticBuffer(sample_node) = node {
                if sample_node.finished {
                    // Find an empty handle to use
                    let handle_id_result = self
                        .remove_node_handles
                        .iter()
                        .enumerate()
                        .find(|(id, handle)| **handle != None);

                    // Got one? Add this node ID to it
                    if let Some((handle_id, _)) = handle_id_result {
                        self.remove_node_handles[handle_id] = Some(node_id);
                    }
                }
            }
        }

        // Loop over finished nodes we need to remove from track
        for handle in self.remove_node_handles.iter_mut() {
            if let Some(handle_id) = handle {
                self.playback_nodes.remove(*handle_id);

                *handle = None;
            }
        }
    }

    pub fn add_audio_node(&mut self, track_index: usize, node: AudioNodeTypes) {
        self.tracks[track_index].nodes.insert(node);
    }

    pub fn add_fx_node(&mut self, track_index: usize, node: EffectNodeTypes) {
        self.tracks[track_index].fx.insert(node);
    }

    pub fn add_synth_node(&mut self, track_index: usize, sample_rate: u32) {
        self.tracks[track_index]
            .nodes
            .insert(AudioNodeTypes::Synthesizer(SynthNode::new(sample_rate)));
    }

    pub fn play(&mut self) {
        self.playing = true;
    }

    pub fn pause(&mut self) {
        self.playing = false;
    }

    pub fn run_commands(&mut self, consumer: &mut Receiver<AudioCommand>) {
        // Handle commands
        while let Ok(command) = consumer.try_recv() {
            match command {
                AudioCommand::Play => {
                    self.play();
                }
                AudioCommand::AddAudioNode(track_index, node) => {
                    self.add_audio_node(track_index, node);
                }
                AudioCommand::AddEffect(track_index, node) => {
                    self.add_fx_node(track_index, node);
                }
                AudioCommand::AddSynth(track_index, sample_rate) => {
                    self.add_synth_node(track_index, sample_rate);
                    // @TODO: Need to keep track of synth somehow to allow for removing
                }
                AudioCommand::RemoveSynth(track_index, id) => {
                    self.tracks[track_index].nodes[id] = AudioNodeTypes::Silence;
                }
                AudioCommand::Pause => {
                    self.pause();
                }
                AudioCommand::ClearNodes => {
                    for track in self.tracks.each_mut() {
                        track.nodes.clear();
                        track.fx.clear();
                    }
                }
                AudioCommand::SetMixerGain(track_index, gain) => {
                    self.tracks[track_index].gain = gain;
                }

                AudioCommand::AddPlaybackSample(id, node) => {
                    let handle = self.playback_nodes.insert(node);
                    self.playback_map.insert(id, handle);
                }

                AudioCommand::StopPlaybackNode(id) => {
                    if let Some(&key) = self.playback_map.get(&id) {
                        if let Some(node) = self.playback_nodes.get_mut(key) {
                            // TODO: Start the release phase of envelope.
                        }
                    }
                }

                AudioCommand::Seek(new_time) => {
                    for track in self.tracks.each_mut() {
                        for (_, node) in track.nodes.iter_mut() {
                            match node {
                                AudioNodeTypes::StaticBuffer(sample_node) => {
                                    sample_node.seek(new_time);
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
    }

    pub fn process(
        &mut self,
        output: &mut [f32],
        channels: usize,
        sample_rate: u32,
        waveform_producer: &mut Sender<f32>,
        playback_time: Arc<AtomicU64>,
    ) {
        // Zero out output
        // TODO: I'm skeptical of this, here for testing to avoid accumulation
        output.fill(0.0);

        // Handle any "immediate" playback like MIDI input, audio previews, etc
        self.process_playback(output);

        // Not playing? Don't update samples
        if self.playing == false {
            return;
        }

        // Get current time for playback
        let current_time = playback_time.load(Ordering::Relaxed);
        let buffer_size = output.len();

        // Process all nodes (aka play audio, apply effects like gain, etc)
        // First we loop through each "track" and run processing locally
        for track in self.tracks.iter_mut() {
            // If needed, resize scratch buffer. Minimal allocation, only happens once per device.
            if buffer_size > track.process_buffer.len() {
                track.process_buffer.resize(buffer_size, 0.0);
            }

            // Grab a slice of our track's process buffer that matches current output length
            // This lets us have a larger buffer to accomodate varying output/block size
            let mut scratch_buffer = &mut track.process_buffer[..buffer_size];

            // Reset buffer to prevent accumulation
            scratch_buffer.fill(0.0);

            for (node_id, node) in track.nodes.iter_mut() {
                node.process(&mut scratch_buffer, current_time);

                // Remove any finished nodes
                // The only nodes that currently finish are audio buffers
                if let AudioNodeTypes::StaticBuffer(sample_node) = node {
                    if sample_node.finished {
                        // Find an empty handle to use
                        let handle_id_result = self
                            .remove_node_handles
                            .iter()
                            .enumerate()
                            .find(|(id, handle)| **handle != None);

                        // Got one? Add this node ID to it
                        if let Some((handle_id, _)) = handle_id_result {
                            self.remove_node_handles[handle_id] = Some(node_id);
                        }
                    }
                }
            }
            // Then I need to loop over fx and provide result from above
            for (fx_id, fx) in track.fx.iter_mut() {
                fx.process(&mut scratch_buffer, current_time);
            }

            // Any final track operations (e.g. track-based gain)
            if track.gain < 1.0 {
                for sample in scratch_buffer.iter_mut() {
                    *sample *= track.gain;
                }
            }

            // Then we combine (or "mix") all the signals together
            for (i, sample) in scratch_buffer.iter().enumerate() {
                output[i] += *sample;
            }

            // Loop over finished nodes we need to remove from track
            for handle in self.remove_node_handles.iter_mut() {
                if let Some(handle_id) = handle {
                    track.nodes.remove(*handle_id);

                    *handle = None;
                }
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

mod common;
use std::sync::{atomic::AtomicU64, Arc};

use approx::assert_relative_eq;
use daw_tauri_lib::engine::{mixer::Mixer, nodes::audio_node::AudioNodeTypes};
use testing_common::{generate_maxed_samples, DEFAULT_SAMPLE_RATE};

use crate::common::create_sample_node_from_samples;

struct MixerTestContext {
    pub mixer: Mixer,
    channels: usize,
    buffer_size: usize,
    sample_rate: u32,
    total_frames: usize,
}

impl MixerTestContext {
    pub fn new(channels: usize, buffer_size: usize, sample_rate: u32, total_frames: usize) -> Self {
        // Initialize mixer and necessary dependencies
        let mixer = Mixer::new(buffer_size);

        Self {
            channels,
            buffer_size,
            sample_rate,
            total_frames,
            mixer,
        }
    }

    pub fn process(&mut self, samples: Vec<f32>) -> Vec<f32> {
        // Make sure to `ceil` while rounding to do more frames than needed (vs less)
        let segments = self.total_frames.div_ceil(self.buffer_size);
        // Mixer setup
        let (mut waveform_producer, _) = crossbeam::channel::bounded::<f32>(1);
        let playback_time = Arc::new(AtomicU64::new(0));

        // Create node
        let total_samples = samples.len();
        let node_samples = Arc::new(samples);
        let node = create_sample_node_from_samples(node_samples);
        self.mixer.add_audio_node(0, node);

        // Set Mixer to play
        self.mixer.play();

        // Process audio on Mixer in blocks based on buffer size
        let mut output: Vec<f32> = vec![0.0; self.buffer_size];
        let mut final_signal: Vec<f32> = Vec::new();

        for _ in 0..segments {
            output.fill(0.0);

            self.mixer.process(
                &mut output,
                self.channels,
                self.sample_rate,
                &mut waveform_producer,
                playback_time.clone(),
            );

            // Write this block to disk
            for &sample in &output {
                let clamped = sample.clamp(-1.0, 1.0);
                final_signal.push(clamped);
            }
        }
        // Limit signal to original sample size.
        // Removes any extra 0.0 from block processing overflow.
        final_signal.truncate(total_samples);
        final_signal
    }
}

#[test]
fn mixer_plays_audio() {
    let total_frames = (DEFAULT_SAMPLE_RATE as usize) * 2;
    // Create Mixer
    let mut mixer_context = MixerTestContext::new(2, 512, DEFAULT_SAMPLE_RATE, total_frames);

    // We generate the samples here so we can compare them to result
    let samples = generate_maxed_samples(total_frames);

    // Add audio node to mixer and process signal
    let final_signal = mixer_context.process(samples.clone());

    // Compare original samples to final signal
    let length = samples.len();
    assert_relative_eq!(
        final_signal.as_slice()[..length],
        samples.as_slice(),
        epsilon = 1e-3
    );
}

#[test]
fn mixer_changes_track_gain() {
    let total_frames = (DEFAULT_SAMPLE_RATE as usize) * 2;
    // Create Mixer
    let mut mixer_context = MixerTestContext::new(2, 512, DEFAULT_SAMPLE_RATE, total_frames);
    // Set the first MixerTrack to `0.5` gain (half volume)
    mixer_context.mixer.set_mixer_track_gain(0, 0.5);

    // We generate the samples here so we can compare them to result
    let samples = generate_maxed_samples(total_frames);
    let effected_samples: Vec<f32> = samples.iter().map(|sample| sample * 0.5).collect();

    // Add audio node to mixer and process signal
    let final_signal = mixer_context.process(samples.clone());

    // Compare original samples to final signal
    let length = samples.len();
    assert_relative_eq!(
        final_signal.as_slice()[..length],
        effected_samples.as_slice(),
        epsilon = 1e-3
    );
}

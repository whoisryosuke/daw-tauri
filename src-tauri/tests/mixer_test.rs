mod common;
use std::sync::{atomic::AtomicU64, Arc};

use approx::assert_relative_eq;
use daw_tauri_lib::engine::{
    mixer::Mixer,
    nodes::audio_node::{AudioNodeTypes, SampleNode},
};

use crate::common::{create_sample_node_from_samples, generate_sine_samples};

#[test]
fn mixer_plays_audio() {
    // Audio settings
    let channels = 2; // Stereo audio
    let buffer_size = 512; // Standard small buffer
    let sample_rate = 44100; // Standard sample rate (this many samples = 1 second)

    // Calculate time to frames
    // We do 1 second of playback, which is equal to sample rate (times 2 for each channel)
    let total_frames = ((sample_rate / 2) as usize) * channels;
    let segments = total_frames / buffer_size;

    // Initialize mixer and necessary dependencies
    let mut mixer = Mixer::new(buffer_size);
    // Mixer setup
    let (mut waveform_producer, _) = crossbeam::channel::bounded::<f32>(1);
    let playback_time = Arc::new(AtomicU64::new(0));

    // Add audio nodes to play
    // We generate the samples here so we can compare them to result
    let samples = generate_sine_samples(total_frames);
    let samples_ref = samples.clone();

    // Create node
    let node_samples = Arc::new(samples);
    let node = create_sample_node_from_samples(node_samples);
    mixer.add_audio_node(0, node);

    // Set Mixer to play
    mixer.play();

    // Process audio on Mixer in blocks based on buffer size
    let mut output: Vec<f32> = vec![0.0; buffer_size];
    let mut final_signal: Vec<f32> = Vec::new();

    for _ in 0..segments {
        output.fill(0.0);

        mixer.process(
            &mut output,
            channels,
            sample_rate,
            &mut waveform_producer,
            playback_time.clone(),
        );

        // Write this block to disk
        for &sample in &output {
            let clamped = sample.clamp(-1.0, 1.0);
            final_signal.push(clamped);
        }
    }

    // Compare original samples to final signal
    // They should be equal - if not super close - since no calculations happen (besides merging signals)
    let length = 64;
    assert_relative_eq!(
        final_signal.as_slice(),
        samples_ref.as_slice(),
        epsilon = 1e-3
    );
}

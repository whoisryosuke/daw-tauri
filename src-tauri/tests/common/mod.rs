use std::{f32::consts::PI, sync::Arc};

use daw_tauri_lib::engine::nodes::audio_node::{AudioNodeTypes, SampleNode};

pub fn generate_maxed_samples(duration_frames: usize) -> Vec<f32> {
    let samples = (0..duration_frames).map(|_| 1.0).collect::<Vec<f32>>();
    samples
}

pub fn generate_sine_samples(duration_frames: usize) -> Vec<f32> {
    let samples = (0..duration_frames)
        .map(|index| {
            let index = index as f32;
            let frequency = 440.0; // A4 note
            let sample = (index * frequency * 2.0 * PI).sin();
            sample
        })
        .collect::<Vec<f32>>();
    samples
}

pub fn create_sample_node_from_samples(samples: Arc<Vec<f32>>) -> AudioNodeTypes {
    let node = AudioNodeTypes::StaticBuffer(SampleNode::new(samples, 0, None));

    node
}

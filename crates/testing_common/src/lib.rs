
use std::{f32::consts::PI};

pub const DEFAULT_SAMPLE_RATE: u32 = 44100;

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
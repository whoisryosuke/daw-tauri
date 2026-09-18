use std::f32::consts::PI;

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

pub fn run_block_processing<F>(total_frames: usize, buffer_size: usize, mut process: F) -> Vec<f32>
where
    F: FnMut(&mut [f32], u64), // The trait bound for the callback
{
    // Make sure to `ceil` while rounding to do more frames than needed (vs less)
    let segments = total_frames.div_ceil(buffer_size);

    // Process audio in blocks based on buffer size
    let mut output: Vec<f32> = vec![0.0; buffer_size];
    let mut current_time: u64 = 0;

    let mut final_output: Vec<f32> = Vec::new();
    for _ in 0..segments {
        output.fill(0.0);

        // This should be a function user can pass
        process(&mut output, current_time);

        // Write this block to disk
        for &sample in &output {
            let clamped = sample.clamp(-1.0, 1.0);
            final_output.push(clamped);
        }

        // Increment time
        current_time += buffer_size as u64;
    }

    // Make signal length = to sample length
    final_output.truncate(total_frames);

    final_output
}

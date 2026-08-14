use rubato::{
    audioadapter_buffers::direct::InterleavedSlice, Async, Fft, FixedAsync, FixedSync, Resampler,
    SincInterpolationParameters, SincInterpolationType, WindowFunction,
};

pub struct Sampler {
    base_midi_note: u8, // The MIDI note the original sample was recorded at (e.g., 60 for C4)
    sample_rate: f32,
}

impl Sampler {
    pub fn new(base_midi_note: u8, sample_rate: f32) -> Self {
        Self {
            base_midi_note,
            sample_rate,
        }
    }

    /// Converts a MIDI note index to a resampling ratio.
    /// Ratio 1.0 = original pitch
    /// Ratio 2.0 = one octave up (double speed)
    /// Ratio 0.5 = one octave down (half speed)
    fn midi_to_ratio(&self, target_midi_note: u8) -> f32 {
        let semitones = target_midi_note as f32 - self.base_midi_note as f32;

        // Calculate the frequency ratio
        // Logarithmic Formula: ratio = 2^(n/12)
        // If n=12 (one octave up), ratio = 2.0
        2.0f32.powf(semitones / 12.0)
    }

    fn pitch_shift_simple(&self, input_buffer: &[f32], target_midi_note: u8) -> Vec<f32> {
        // Based on current MIDI key, what's pitch multiplier (e.g. 1 octave up = 2x faster)
        let pitch_ratio = self.midi_to_ratio(target_midi_note);
        let input_len = input_buffer.len();

        // Calculate new length based on ratio
        let output_len = (input_len as f32 / pitch_ratio) as usize;
        let mut output = Vec::with_capacity(output_len);

        for i in 0..output_len {
            let pos = i as f32 * pitch_ratio;
            let index = pos.floor() as usize;
            // The "animation" variable that powers the interpolation
            let frac = pos - index as f32;

            if index + 1 < input_len {
                // Linear interpolation formula: (1 - f)*a + f*b
                let sample = (1.0 - frac) * input_buffer[index] + frac * input_buffer[index + 1];
                output.push(sample);
            } else if index < input_len {
                output.push(input_buffer[index]);
            }
        }
        output
    }

    /// Resamples the input buffer to the new pitch
    pub fn pitch_shift(
        &self,
        input_buffer: &[f32],
        target_midi_note: u8,
    ) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        // Based on current MIDI key, what's pitch multiplier (e.g. 1 octave up = 2x faster)
        let pitch_ratio = self.midi_to_ratio(target_midi_note);

        // Resample ratio = output_rate / input_rate.
        // Since we start with a C4 sample, output_rate is 1.0.
        let resample_ratio = 1.0 / pitch_ratio;

        // Initialize the Resampler with new pitch
        // @TODO: Cache if note doesn't change
        let channels = 2;
        let chunk_size = 1024; // Smaller = lower latency, but worse quality/aliasing

        let params = SincInterpolationParameters {
            sinc_len: 128, // quality vs. speed; 64-256 is typical
            f_cutoff: Some(0.95),
            interpolation: SincInterpolationType::Linear, // cheaper than Cubic
            oversampling_factor: 128, // lower = faster, more interpolation error
            window: WindowFunction::BlackmanHarris2,
        };

        let mut resampler = Async::<f32>::new_sinc(
            resample_ratio.into(),
            2.0,
            &params,
            chunk_size,
            channels,
            FixedAsync::Input,
        )?;

        // Perform the resampling
        let input_frames = input_buffer.len() / channels;

        // rubato allows for generic types (like f64 vs f32) - but requires this wrapper "adapter"
        let input_adapter = InterleavedSlice::new(&input_buffer, channels, input_frames)?;

        // Resample audio using rubato resampler
        let resampled_buffer = resampler.process_all(&input_adapter, input_frames, None)?;

        // Pull our samples out of the adapter
        let output: Vec<f32> = resampled_buffer.take_data();

        Ok(output)
    }
}

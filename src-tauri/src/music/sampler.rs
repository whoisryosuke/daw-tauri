use rubato::{
    audioadapter_buffers::direct::InterleavedSlice, Fft, FixedSync, Resampler, WindowFunction,
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
    fn midi_to_ratio(&self, target_midi_note: u8) -> f64 {
        let semitones = target_midi_note as f64 - self.base_midi_note as f64;

        // Calculate the frequency ratio
        // Logarithmic Formula: ratio = 2^(n/12)
        // If n=12 (one octave up), ratio = 2.0
        2.0f64.powf(semitones / 12.0)
    }

    /// Resamples the input buffer to the new pitch
    pub fn pitch_shift(
        &self,
        input_buffer: &[f32],
        target_midi_note: u8,
    ) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        // Based on current MIDI key, what's pitch multiplier (e.g. 1 octave up = 2x faster)
        let pitch_ratio = self.midi_to_ratio(target_midi_note);

        // Determine the "virtual" input rate.
        // To make the sample sound higher, we pretend it was recorded at a higher rate.
        // If we want to pitch up by 2x, we tell rubato the input is 96kHz
        // and the output is 48kHz.
        let virtual_input_rate = (self.sample_rate as f64 * pitch_ratio) as usize;

        // 4. Initialize the Resampler with new pitch
        // @TODO: Cache if note doesn't change
        let channels = 2;
        let chunk_size = 1024; // Smaller = lower latency, but worse quality/aliasing

        let mut resampler = Fft::<f64>::new_custom(
            virtual_input_rate,
            self.sample_rate as usize,
            chunk_size,
            1,
            channels,
            WindowFunction::BlackmanHarris,
            FixedSync::Both,
        )?;

        // 5. Perform the resampling
        let input_frames = input_buffer.len() / channels;

        let f64_buffer: Vec<f64> = input_buffer.iter().map(|&sample| sample as f64).collect();
        // Wrap the raw slice in an adapter so rubato knows how to read it.
        let input_adapter = InterleavedSlice::new(&f64_buffer, channels, input_frames)?;

        // Resample audio using rubato resampler
        let resampled_buffer = resampler.process_all(&input_adapter, input_frames, None)?;

        let output: Vec<f32> = resampled_buffer
            .take_data()
            .iter()
            .map(|&sample| sample as f32)
            .collect();

        Ok(output)
    }
}

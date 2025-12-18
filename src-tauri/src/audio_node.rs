use dasp_signal::{self as signal, ConstHz, Signal, Sine};

pub trait AudioNode {
    fn get_sample(&mut self) -> Option<f32>;
}

pub struct SampleNode {
    data: Vec<f32>,
    position: usize,
    pub finished: bool,
}

impl SampleNode {
    pub fn new(data: Vec<f32>) -> Self {
        let position = 0usize;
        let finished = false;

        Self {
            data,
            position,
            finished,
        }
    }
}

impl AudioNode for SampleNode {
    fn get_sample(&mut self) -> Option<f32> {
        // Finished? Return no noise
        if self.finished {
            return None;
        }

        // Make a copy in case it changes somehow - might be unnecessary
        let index = self.position.clone();
        let next_index = index + 1;

        // Check if we're done - if not, keep incrementing
        if next_index >= self.data.len() {
            self.finished = true;
        } else {
            // Increment position for next sample
            self.position += 1;
        }

        // Return current sample
        Some(self.data[index])
    }
}

struct SynthNode {
    synth: Sine<ConstHz>,
    pub finished: bool,
}

impl SynthNode {
    pub fn new() -> Self {
        let synth = signal::rate(44100.0).const_hz(440.0).sine();

        Self {
            synth,
            finished: false,
        }
    }
}

impl AudioNode for SynthNode {
    fn get_sample(&mut self) -> Option<f32> {
        let sample = self.synth.next();

        Some(sample as f32)
    }
}

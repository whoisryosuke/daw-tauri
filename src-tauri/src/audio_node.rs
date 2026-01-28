use dasp_signal::{self as signal, ConstHz, Signal, Sine};

pub trait AudioNode {
    fn process(&mut self, input: &[f32], output: &mut [f32], params: f32);
}

// pub struct AudioNodeMetadata {
//     id: usize,
// }

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

    fn process(&mut self, input: &[f32], output: &mut [f32], params: f32) {
        for (i, &sample) in input.iter().enumerate() {
            // Make a copy in case it changes somehow - might be unnecessary
            let index = self.position;
            let next_index = index + 1;

            // Check if we're done - if not, keep incrementing
            if next_index >= self.data.len() {
                self.finished = true;
            } else {
                // Increment position for next sample
                self.position += 1;
                // Return current sample
                output[i] = self.data[index];
            }
        }
    }
}

pub struct SynthNode {
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

    fn process(&mut self, input: &[f32], output: &mut [f32], params: f32) {
        for (i, &sample) in input.iter().enumerate() {
            output[i] = self.synth.next() as f32;
        }
    }
}

pub struct GainNode {
    gain: f32,
    // pub disabled: bool,
}

impl GainNode {
    pub fn new(gain: f32) -> Self {
        Self {
            gain,
        }
    }
}

impl AudioNode for GainNode {
    fn process(&mut self, input: &[f32], output: &mut [f32], params: f32) {
        for (i, &sample) in input.iter().enumerate() {
            output[i] = sample * self.gain;
        }
    }
}

pub enum AudioNodeTypes {
    Silence,
    StaticBuffer(SampleNode),
    Streaming(SampleNode),
    Synthesizer(SynthNode),
    Gain(GainNode),
}

impl AudioNodeTypes {
    
    pub fn process(&mut self, input: &[f32], output: &mut [f32], params: f32) {
        match self {
            AudioNodeTypes::Silence => {},
            AudioNodeTypes::StaticBuffer(node) => node.process(input, output, params),
            AudioNodeTypes::Streaming(node) => node.process(input, output, params),
            AudioNodeTypes::Synthesizer(node) => node.process(input, output, params),
            AudioNodeTypes::Gain(node) => node.process(input, output, params),
        }
    }
}
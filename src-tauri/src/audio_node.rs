use std::sync::Arc;

use dasp_signal::{self as signal, ConstHz, Signal, Sine};
// use std::fmt;

/// Audio node that transmits sample data (e.g. static buffers, virtual synths, etc)
pub trait AudioNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64);
}

pub struct SampleNode {
    pub start_frame: usize,
    data: Arc<Vec<f32>>,
    position: usize,
    pub finished: bool,
}

impl SampleNode {
    pub fn new(data: Arc<Vec<f32>>, start_frame: usize) -> Self {
        let position = 0usize;
        let finished = false;

        Self {
            start_frame,
            data,
            position,
            finished,
        }
    }
}

impl AudioNode for SampleNode {

    fn process(&mut self, output: &mut [f32], current_frame: u64) {
        // Check if node is scheduled to start, if not, do nothing
        if self.start_frame > current_frame.try_into().unwrap_or(0) {
            return;
        }

        for sample in output.iter_mut() {
            // Make a copy in case it changes somehow - might be unnecessary
            let index = self.position;

            // Check if we're done - if not, keep incrementing
            if index >= self.data.len() {
                self.finished = true;
            } else {
                // Increment position for next sample
                self.position += 1;
                // Return current sample
                *sample += self.data[index];
            }
        }
    }
}

pub struct SynthNode {
    synth: Sine<ConstHz>,
    pub finished: bool,
}

impl SynthNode {
    pub fn new(sample_rate: u32) -> Self {
        let synth = signal::rate(sample_rate as f64).const_hz(440.0).sine();

        Self {
            synth,
            finished: false,
        }
    }
}

impl AudioNode for SynthNode {

    fn process(&mut self, output: &mut [f32], current_frame: u64) {
        for sample in output.iter_mut() {
            *sample += self.synth.next() as f32;
        }
    }
}

// impl fmt::Debug for SynthNode {
//     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
//         f.debug_struct("SynthNode")
//             .field("finished", &self.finished) 
//             .finish()
//     }
// }

pub enum AudioNodeTypes {
    Silence,
    StaticBuffer(SampleNode),
    Streaming(SampleNode),
    Synthesizer(SynthNode),
}

impl AudioNodeTypes {
    
    pub fn process(&mut self, output: &mut [f32], params: u64) {
        match self {
            AudioNodeTypes::Silence => {},
            AudioNodeTypes::StaticBuffer(node) => node.process(output, params),
            AudioNodeTypes::Streaming(node) => node.process(output, params),
            AudioNodeTypes::Synthesizer(node) => node.process(output, params)
        }
    }
}


/// Effect node that takes input data, processes it, and overrides the output
pub trait EffectNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64);
}

#[derive(Debug, Clone)]
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

impl EffectNode for GainNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64) {
        for (i, sample) in output.iter_mut().enumerate() {
            *sample = *sample * self.gain;
        }
    }
}

pub enum EffectNodeTypes {
    Gain(GainNode),
}

impl EffectNodeTypes {
    pub fn process(&mut self, output: &mut [f32], current_frame: u64) {
        match self {
            EffectNodeTypes::Gain(node) => node.process(output, current_frame),
        }
    }
}
use std::sync::Arc;

use dasp_signal::{self as signal, ConstHz, Signal, Sine};
use serde::{Deserialize, Serialize};

use crate::effects::shared::asdr::Adsr;
// use std::fmt;

/// Audio node that transmits sample data (e.g. static buffers, virtual synths, etc)
/// The `output` represents the audio data the node will write to
/// The `current_frame` is the playback time in frames.
pub trait AudioNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64);
}

pub type SampleNodeRange = Option<(usize, usize)>;

pub struct SampleNode {
    pub start_frame: u64,
    data: Arc<Vec<f32>>,
    position: usize,
    pub finished: bool,
    pub range: (usize, usize),
}

impl SampleNode {
    pub fn new(data: Arc<Vec<f32>>, start_frame: u64, node_range: SampleNodeRange) -> Self {
        let position = node_range.map_or(0, |(start, _)| start);
        let finished = false;

        let range = node_range.unwrap_or((0, data.len()));

        Self {
            start_frame,
            data,
            position,
            finished,
            range,
        }
    }
}

impl AudioNode for SampleNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64) {
        // Check if node is scheduled to start, if not, do nothing
        if self.start_frame > current_frame {
            return;
        }

        for sample in output.iter_mut() {
            // Make a copy in case it changes somehow - might be unnecessary
            let index = self.position;

            // Check if we're done - if not, keep incrementing
            if index >= self.range.1 {
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
            AudioNodeTypes::Silence => {}
            AudioNodeTypes::StaticBuffer(node) => node.process(output, params),
            AudioNodeTypes::Streaming(node) => node.process(output, params),
            AudioNodeTypes::Synthesizer(node) => node.process(output, params),
        }
    }
}

// This is a special node that we use for immediate playback.
// It has a built-in ADSR so we can fade out a clip gracefully if stopped.
pub struct PlaybackNode {
    adsr: Adsr,
    node: SampleNode,
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
        Self { gain }
    }
    pub fn set_gain(&mut self, gain: f32) {
        self.gain = gain;
    }
}

impl EffectNode for GainNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64) {
        for (i, sample) in output.iter_mut().enumerate() {
            *sample = *sample * self.gain;
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EffectNodePayload {
    Gain { gain: f32 },
    // Reverb { decay: f32, mix: f32 },
    // Delay { delay_time: f32, feedback: f32 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateEffectNodeRequest {
    pub node_type: EffectNodePayload,
}

#[derive(Clone)]
pub enum EffectNodeTypes {
    Gain(GainNode),
}

impl EffectNodeTypes {
    pub fn process(&mut self, output: &mut [f32], current_frame: u64) {
        match self {
            EffectNodeTypes::Gain(node) => node.process(output, current_frame),
        }
    }

    pub fn from_payload(payload: EffectNodePayload) -> Self {
        match payload {
            EffectNodePayload::Gain { gain } => EffectNodeTypes::Gain(GainNode::new(gain)),
        }
    }
}

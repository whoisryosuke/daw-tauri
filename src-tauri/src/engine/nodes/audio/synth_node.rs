use dasp_signal::{self as signal, ConstHz, Signal, Sine};

use crate::engine::nodes::audio_node::AudioNode;

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

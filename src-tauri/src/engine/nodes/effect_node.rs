use serde::{Deserialize, Serialize};

use crate::engine::nodes::effects::gain_node::GainNode;

/// Effect node that takes input data, processes it, and overrides the output
pub trait EffectNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64);
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

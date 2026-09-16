use serde::{Deserialize, Serialize};
use std::{path::Path, sync::Arc};

use crate::{
    effects::shared::asdr::Adsr,
    engine::nodes::audio::{sample_node::SampleNode, synth_node::SynthNode, vst_node::VstNode},
};
// use std::fmt;

/// Audio node that transmits sample data (e.g. static buffers, virtual synths, etc)
/// The `output` represents the audio data the node will write to
/// The `current_frame` is the playback time in frames.
pub trait AudioNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64);
}

/// The Audio Node "type".
/// This represents all types of audio nodes (sample, synth, etc).
/// Each enum option contains a `AudioNode` (the trait) where we run `process()` on signal.
pub enum AudioNodeTypes {
    Silence,
    StaticBuffer(SampleNode),
    Streaming(SampleNode),
    Synthesizer(SynthNode),
    Vst(VstNode),
}

impl AudioNodeTypes {
    pub fn process(&mut self, output: &mut [f32], params: u64) {
        match self {
            AudioNodeTypes::Silence => {}
            AudioNodeTypes::StaticBuffer(node) => node.process(output, params),
            AudioNodeTypes::Streaming(node) => node.process(output, params),
            AudioNodeTypes::Synthesizer(node) => node.process(output, params),
            AudioNodeTypes::Vst(node) => node.process(output, params),
        }
    }
}

// This is a special node that we use for immediate playback.
// It has a built-in ADSR so we can fade out a clip gracefully if stopped.
pub struct PlaybackNode {
    adsr: Adsr,
    node: SampleNode,
}

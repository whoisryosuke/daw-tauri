use crate::{audio_engine::AudioBuffer, audio_node::{SampleNode, SynthNode}};

struct AudioGraph {
    nodes: Vec<AudioGraphNode>
}

struct AudioGraphNode {
    source: AudioSource,
    effects: Vec<Box<dyn AudioEffect>>,
    track_number: usize,
}

enum AudioSource{
    Sample(SampleNode),
    Synth(SynthNode),    
}

pub trait AudioEffect {
    fn process(&mut self, sample: f32) -> Option<f32>;
}

struct DelayEffect {
    delay_buffer: Vec<f32>,
}

impl DelayEffect {
    pub fn new() -> Self {
        Self {
            delay_buffer: Vec::new(),
        }
    }
}

impl AudioEffect for DelayEffect {
    fn process(&mut self, sample: f32) -> Option<f32> {
        // Save sample to cache
        self.delay_buffer.push(sample);

        Some(sample)
    }
}
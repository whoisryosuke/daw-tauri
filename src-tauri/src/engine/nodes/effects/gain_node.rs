use crate::engine::nodes::effect_node::EffectNode;

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
    fn process(&mut self, output: &mut [f32], _current_frame: u64) {
        for (_i, sample) in output.iter_mut().enumerate() {
            *sample = *sample * self.gain;
        }
    }
}

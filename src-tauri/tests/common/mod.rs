use std::{f32::consts::PI, sync::Arc};

use daw_tauri_lib::engine::nodes::{audio::sample_node::SampleNode, audio_node::AudioNodeTypes};

pub fn create_sample_node_from_samples(samples: Arc<Vec<f32>>) -> AudioNodeTypes {
    let node = AudioNodeTypes::StaticBuffer(SampleNode::new(samples, 0, None));

    node
}

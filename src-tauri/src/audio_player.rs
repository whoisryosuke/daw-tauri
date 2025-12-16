use crate::audio_node::AudioNode;

pub struct AudioPlayer {
    nodes: Vec<AudioNode>,
    pub finished: bool,
}

impl AudioPlayer {
    pub fn new() -> Self {
        Self { 
            nodes: Vec::new(),
            finished: false,
        }
    }

    pub fn add_node(&mut self, node: AudioNode) {
        self.nodes.push(node);
        self.finished = false;
    }

    pub fn get_sample(&mut self) -> f32 {
        // Remove any finished nodes
        self.nodes.retain(|node| !node.finished);

        if self.nodes.len() == 0 {
            self.finished = true;
        }

        // Get latest sample by combining all audio nodes
        let mut sum: f32 = 0.0;
        // let length = self.nodes.len() as f32;
        for node in self.nodes.iter_mut() {
            let sample = node.get_sample();
            
            // Since we're adding all samples together, we reduce volume a bit
            // I do it by a set 50% here, but may need to scale based on num of nodes
            sum += sample / 0.5;
        }
        return sum;
    }
}
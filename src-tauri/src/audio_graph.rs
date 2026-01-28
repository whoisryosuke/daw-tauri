use std::collections::HashMap;

use crate::audio_node::AudioNodeTypes;

struct TrackClip {
    // Reference to asset store - loads it into audio cache if needed
    sample: String,
    start_time: f32,
    muted: bool,
}

struct Track {
    muted: bool,
    clips: Vec<TrackClip>,
}

pub struct AudioGraph {
    nodes: Vec<AudioNodeTypes>,
    // Source Node -> Target Node
    connections: Vec<(usize, usize)>,
}

impl AudioGraph {
    pub fn new() -> Self {
        Self {
            nodes: Vec::new(),
            connections: Vec::new(),
        }
    }

    pub fn add_node(&mut self, new_node: AudioNodeTypes) -> usize {
        self.nodes.push(new_node);
        self.nodes.len() - 1
    }

    pub fn connect(&mut self, from: usize, to: usize) {
        self.connections.push((from, to));
    }

    fn get_evaluation_order(&self) {
        let graph: HashMap<usize, Vec<usize>> = HashMap::with_capacity(self.nodes.len());
        let incoming_connections: HashMap<usize, usize> = HashMap::with_capacity(self.nodes.len());


    }

    pub fn process(&mut self, input: &[f32], output: &mut [f32], params: f32) {
        // Get node order
        let nodes = self.get_evaluation_order();
    }
}


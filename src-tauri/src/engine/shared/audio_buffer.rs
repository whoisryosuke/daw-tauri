use std::sync::Arc;

pub struct AudioBuffer {
    pub samples: Arc<Vec<f32>>,
    pub sample_rate: u32,
    pub channel_count: usize,
}

impl AudioBuffer {
    pub fn new(samples: Vec<f32>, sample_rate: u32, channel_count: usize) -> Self {
        Self {
            samples: Arc::new(samples),
            sample_rate,
            channel_count,
        }
    }
}

use std::sync::Arc;


pub struct AudioBuffer {
    pub samples: Arc<Vec<f32>>,
    pub sample_rate: i32,
}

impl AudioBuffer {
    pub fn new(samples: Vec<f32>, sample_rate: i32) -> Self {
        Self {
            samples: Arc::new(samples),
            sample_rate,
        }
    }
}
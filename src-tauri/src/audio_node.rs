
pub struct AudioNode {
    data: Vec<f32>,
    position: usize,
    pub finished: bool,
}

impl AudioNode {
    pub fn new(data: Vec<f32>) -> Self {

        let position = 0usize;
        let finished = false;
        
        Self {
            data,
            position,
            finished
        }
    }
    pub fn get_sample(&mut self) -> Option<f32> {
        // Finished? Return no noise
        if self.finished {
            return None
        }

        // Make a copy in case it changes somehow - might be unnecessary
        let index = self.position.clone();
        let next_index = index + 1;
        
        // Check if we're done - if not, keep incrementing 
        if next_index >= self.data.len() {
            self.finished = true;
        } else {
            // Increment position for next sample
            self.position += 1;
        }
        
        // Return current sample
        Some(self.data[index])
    }
}
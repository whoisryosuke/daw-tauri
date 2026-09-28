use std::sync::Arc;

use crate::engine::nodes::{
    audio::shared::{AudioNodeRange, AudioNodeRangeParam},
    audio_node::AudioNode,
};

pub struct SampleNode {
    pub start_frame: u64,
    data: Arc<Vec<f32>>,
    position: usize,
    pub finished: bool,
    pub range: AudioNodeRange,
}

impl SampleNode {
    pub fn new(data: Arc<Vec<f32>>, start_frame: u64, node_range: AudioNodeRangeParam) -> Self {
        let position = node_range.map_or(0, |(start, _)| start);
        let finished = false;

        let range = node_range.unwrap_or((0, data.len()));

        Self {
            start_frame,
            data,
            position,
            finished,
            range,
        }
    }

    pub fn seek(&mut self, current_frame: u64) {
        // Where are we on timeline? If we started at a later time, update internal position.
        // This ensures if user skips forward or backwards, audio node plays from current time (not node start).
        let start_frame_index = self.start_frame as usize;
        let current_position_frame = start_frame_index + self.position;
        if current_position_frame < (current_frame as usize) {
            self.position = (current_frame - self.start_frame) as usize;
        }

        // Is current time after the internal sample index? (aka `self.position`)
        let current_frame = current_frame as usize;
        let start_frame_index = self.start_frame as usize;
        if current_position_frame < current_frame {
            self.position = (current_frame - start_frame_index).min(self.range.1);
            return;
        }

        // Before current position - but after clip start?
        // This moves internal position index backwards as needed
        if current_position_frame > current_frame && current_frame > start_frame_index {
            let offset = current_position_frame - current_frame;
            self.position = (self.position - offset).max(self.range.0);
        }
    }
}

impl AudioNode for SampleNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64) {
        // Check if node is scheduled to start, if not, do nothing
        if self.start_frame > current_frame {
            return;
        }

        for sample in output.iter_mut() {
            // Make a copy in case it changes somehow - might be unnecessary
            let index = self.position;

            // Check if we're done - if not, keep incrementing
            if index >= self.range.1 {
                self.finished = true;
            } else {
                // Increment position for next sample
                self.position += 1;
                // Return current sample
                *sample += self.data[index];
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_relative_eq;
    use testing_common::{generate_maxed_samples, run_block_processing, DEFAULT_SAMPLE_RATE};

    #[test]
    fn sample_plays() {
        // Generate samples
        let total_frames = (DEFAULT_SAMPLE_RATE as usize) * 2;
        let samples = generate_maxed_samples(total_frames);

        // Create the node
        let mut node = SampleNode::new(Arc::new(samples.clone()), 0, None);

        // Run block processing on node
        let final_output = run_block_processing(total_frames, 512, |output, current_frame| {
            node.process(output, current_frame);
        });

        // Compare original samples to final signal
        assert_relative_eq!(final_output.as_slice(), samples.as_slice(), epsilon = 1e-3);
    }
}

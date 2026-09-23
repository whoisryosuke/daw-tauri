use std::sync::{Arc, Mutex};

use crate::engine::nodes::audio_node::AudioNode;

pub struct VstNode {
    plugin: Arc<Mutex<vst3_host::Plugin>>,

    buffers: vst3_host::AudioBuffers,

    channel_count: usize,
    max_buffer_size: usize,

    started: bool,
    pub finished: bool,
    pub active: bool,
}

impl VstNode {
    pub fn new(plugin: Arc<Mutex<vst3_host::Plugin>>, sample_rate: f64) -> Self {
        let channel_count = 2;
        let max_buffer_size = 512;
        let buffers = vst3_host::AudioBuffers::new(0, channel_count, max_buffer_size, sample_rate);

        Self {
            plugin,
            buffers,
            max_buffer_size,
            channel_count,
            finished: false,
            started: false,
            active: true,
        }
    }
}

impl AudioNode for VstNode {
    fn process(&mut self, output: &mut [f32], _current_frame: u64) {
        // @TODO: AudioNode process trait needs Result for error handling
        let result = self.plugin.try_lock();

        match result {
            Ok(mut plugin) => {
                // Not active? Don't process
                if !self.active {
                    // End processing if needed
                    if self.started {
                        let _ = plugin.stop_processing();
                        self.started = false;
                    }
                    return;
                };

                // Start processor if we need
                if !self.started {
                    let _ = plugin.start_processing();
                    self.started = true;
                }

                // Block size (for single channel - since output is interleaved)
                // Ideally should be using output channels, but since VST matches it, we should be ok
                let block_size = (output.len() / self.channel_count).min(self.max_buffer_size);

                // Resize buffers to block size
                for ch in &mut self.buffers.outputs {
                    ch.resize(block_size, 0.0);
                }
                for ch in &mut self.buffers.inputs {
                    ch.resize(block_size, 0.0);
                }

                // Run the processor and get VST data
                let _ = plugin.process_audio(&mut self.buffers);

                // Override the output with VST output
                let mut sample_index = 0;
                for sample in output.iter_mut() {
                    for ch in 0..self.channel_count {
                        let new_sample = self.buffers.outputs[ch][sample_index];
                        *sample = new_sample;
                    }
                    sample_index = (sample_index + 1).min(block_size - 1);
                }
            }
            Err(_) => {}
        }
    }
}

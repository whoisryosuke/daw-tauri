use std::sync::Arc;

use crate::{
    engine::nodes::{
        audio::shared::{AudioNodeRange, AudioNodeRangeParam},
        audio_node::AudioNode,
    },
    math::hermite_interpolate,
};

/// Audio node for playing MIDI notes using samples.
/// Repitches audio sample in real-time to target MIDI note using Hermite interpolation.
pub struct MidiNode {
    data: Arc<Vec<f32>>,
    pub finished: bool,
    pub range: AudioNodeRange,

    // Resampling specific
    phase: f32,
    phase_increment: f32,
}

impl MidiNode {
    pub fn new(
        data: Arc<Vec<f32>>,
        node_range: AudioNodeRangeParam,
        target_note: u8,
        root_note: u8,
    ) -> Self {
        let phase = node_range.map_or(0, |(start, _)| start) as f32;
        let finished = false;

        let range = node_range.unwrap_or((0, data.len()));

        // Calculate speed ratio. e.g., +12 semitones = 2.0 (double speed)
        let semitone_diff = target_note as f32 - root_note as f32;
        let pitch_ratio = 2.0_f32.powf(semitone_diff / 12.0);

        Self {
            data,
            finished,
            range,

            phase,
            phase_increment: pitch_ratio,
        }
    }
}

impl AudioNode for MidiNode {
    fn process(&mut self, output: &mut [f32], current_frame: u64) {
        // Check if node is scheduled to start, if not, do nothing
        let start_time = self.range.0 as u64;
        if start_time > current_frame {
            return;
        }

        for sample in output.iter_mut() {
            // Split the phase into integer index and fractional part
            let index = self.phase as usize;
            let frac = self.phase - index as f32;

            // Check if we're done - if not, keep incrementing
            if index >= self.range.1 {
                self.finished = true;
                break;
            }

            // Fetch the 4 adjacent samples.
            let y0 = if index == 0 {
                self.data[0]
            } else {
                self.data[index - 1]
            };
            let y1 = self.data[index];
            let y2 = self.data[index + 1];
            let y3 = if index + 2 < self.range.1 {
                self.data[index + 2]
            } else {
                0.0
            };

            // Calculate the interpolated value
            let interpolated = hermite_interpolate(y0, y1, y2, y3, frac);
            *sample += interpolated;

            // Increment position for next sample
            self.phase += self.phase_increment;
        }
    }
}

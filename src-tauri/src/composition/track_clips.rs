use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::composition::track::TrackId;

#[derive(Clone, Serialize, Deserialize)]
pub enum TrackClipType {
    Sample,
    // @TODO: Remove in favor of MIDI
    Synthesizer,
    Midi,
}

/// Start and end times in frames (based on project sample rate)
pub type TrackClipRange = Option<(u64, u64)>;

/// A single "clip" on the track. This associates a `Track` with a `Clip`.
#[derive(Clone, Serialize, Deserialize)]
pub struct TrackClip {
    pub id: String,
    pub track_clip_type: TrackClipType,
    pub clip_id: String,
    /// Time in frames (based on project sample rate)
    pub start_time: u64,
    pub enabled: bool,
    pub range: TrackClipRange,
}

impl TrackClip {
    pub fn new(
        id: String,
        clip_id: String,
        start_time: u64,
        enabled: bool,
        track_clip_type: TrackClipType,
    ) -> Self {
        Self {
            id,
            clip_id,
            start_time,
            enabled,
            track_clip_type,
            range: None,
        }
    }
}

// We associate TrackClips with a Track ID (aka String)
pub type TrackClips = HashMap<TrackId, Vec<TrackClip>>;

use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub enum ClipType {
    Sample,
    Midi,
}

/// Media that's been loaded for use in composition.
/// This associates to the appropriate clip type cache (e.g. sample vs MIDI)
#[derive(Clone, Serialize, Deserialize)]
pub struct Clip {
    pub name: String,
    /// Time in frames (based on project sample rate)
    pub duration: u64,
    // Clips can reference different types of audio data
    pub clip_type: ClipType,
    // This references the ID on the appropriate cache (e.g. sample cache)
    pub clip_id: String,
}

impl Clip {
    pub fn new(name: String, duration: u64, clip_type: ClipType, clip_id: String) -> Self {
        Self {
            name,
            duration,
            clip_type,
            clip_id,
        }
    }
}

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

struct AudioGraph {
    tracks: Vec<Track>,
}
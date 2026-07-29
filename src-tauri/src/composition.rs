use serde::{Serialize, Deserialize};
use tauri::{State};
use std::{collections::HashMap, sync::Mutex};

type TrackId = String;

#[derive(Clone, Serialize, Deserialize)]
pub struct Track {
    name: TrackId,
    muted: bool,
}

impl Track {
    pub fn new(name: TrackId, muted: bool) -> Self {
        Self { name, muted }
    }
}


#[derive(Clone, Serialize, Deserialize)]
pub struct TrackClip {
    id: String,
    clip_id: String,
    start_time: f64,
    enabled: bool,
}

impl TrackClip {
    pub fn new(id: String, clip_id: String, start_time: f64, enabled: bool) -> Self {
        Self { id, clip_id, start_time, enabled }
    }
}

// We associate TrackClips with a Track ID (aka String)
type TrackClips = HashMap<TrackId, Vec<TrackClip>>;


#[derive(Clone, Serialize, Deserialize)]
pub enum ClipType {
    Sample,
    Midi,
}


#[derive(Clone, Serialize, Deserialize)]
pub struct Clip {
    name: String,
    duration: f64,
    // Clips can reference different types of audio data
    clip_type: ClipType,
    // This references the ID on the appropriate cache (e.g. sample cache)
    clip_id: String,
}

impl Clip {
    pub fn new(name: String, duration: f64, clip_type: ClipType, clip_id: String) -> Self {
        Self { name, duration, clip_type, clip_id }
    }
}

pub struct CompositionStore {
    // Start / end time of timeline
    range: (f64, f64),
    tracks: HashMap<String, Track>,
    track_clips: TrackClips,
    clips: HashMap<String, Clip>,
}

impl CompositionStore {
    pub fn new() -> Self {
        let range = (0.0, 1.0);
        let tracks = HashMap::new();
        let track_clips = HashMap::new();
        let clips = HashMap::new();

        Self { range, tracks, track_clips, clips }
    }
}

#[tauri::command()]
pub async fn add_track(
    composition_store: State<'_, Mutex<CompositionStore>>,
    track_id: String,
    track_data: Track,
) -> Result<bool, String> {
    let store_result = composition_store.lock();

    if let Ok(mut store) = store_result {
        store.tracks.insert(track_id, track_data);
        return Ok(true)
    }

    Err("Couldn't lock composition store".to_string())
}

#[tauri::command()]
pub async fn add_track_clip(
    composition_store: State<'_, Mutex<CompositionStore>>,
    track_id: String,
    track_data: TrackClip,
) -> Result<bool, String> {
    let store_result = composition_store.lock();

    if let Ok(mut store) = store_result {
        store.track_clips.entry(track_id).or_insert_with(Vec::new).push(track_data);
        return Ok(true)
    }

    Err("Couldn't lock composition store".to_string())
}

#[tauri::command()]
pub async fn add_clip(
    composition_store: State<'_, Mutex<CompositionStore>>,
    clip_id: String,
    clip_data: Clip,
) -> Result<bool, String> {
    let store_result = composition_store.lock();

    if let Ok(mut store) = store_result {
        store.clips.insert(clip_id, clip_data);
        return Ok(true)
    }

    Err("Couldn't lock composition store".to_string())
}
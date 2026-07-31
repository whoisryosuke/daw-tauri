use serde::{Serialize, Deserialize};
use tauri::{State};
use std::{collections::HashMap, sync::Mutex};

type TrackId = String;

#[derive(Clone, Serialize, Deserialize)]
pub struct Track {
    pub name: TrackId,
    pub muted: bool,
}

impl Track {
    pub fn new(name: TrackId, muted: bool) -> Self {
        Self { name, muted }
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub enum TrackClipType {
    Sample,
    Synthesizer,
}


#[derive(Clone, Serialize, Deserialize)]
pub struct TrackClip {
    pub id: String,
    pub track_clip_type: TrackClipType,
    pub clip_id: String,
    pub start_time: f64,
    pub enabled: bool,
}

impl TrackClip {
    pub fn new(id: String, clip_id: String, start_time: f64, enabled: bool, track_clip_type: TrackClipType) -> Self {
        Self { id, clip_id, start_time, enabled, track_clip_type }
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
    pub name: String,
    pub duration: f64,
    // Clips can reference different types of audio data
    pub clip_type: ClipType,
    // This references the ID on the appropriate cache (e.g. sample cache)
    pub clip_id: String,
}

impl Clip {
    pub fn new(name: String, duration: f64, clip_type: ClipType, clip_id: String) -> Self {
        Self { name, duration, clip_type, clip_id }
    }
}

pub struct CompositionStore {
    // Start / end time of timeline
    pub range: (f64, f64),
    pub tracks: HashMap<String, Track>,
    pub track_clips: TrackClips,
    pub clips: HashMap<String, Clip>,
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
        store.tracks.insert(track_id.clone(), track_data);
        store.track_clips.insert(track_id, Vec::new());
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
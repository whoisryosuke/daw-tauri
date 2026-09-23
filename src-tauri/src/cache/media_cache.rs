use serde::Serialize;
use std::{collections::HashMap, sync::Arc};
use thiserror::Error;

use tauri::async_runtime::Mutex;

use crate::{
    engine::shared::audio_buffer::AudioBuffer,
    midi::{MIDIInputEvent, MIDIInputEventCache},
};

#[derive(Serialize, Error, Debug)]
pub enum MediaCacheError {
    #[error("Couldn't lock asset store buffer")]
    LockError,
    #[error("Couldn't find that media in the cache")]
    MediaNotFound,
}

/// The filename of the media
/// @TODO: Change to a UUID to lower memory cost
pub type MediaAssetId = String;

/// Cache for audio buffers that are loaded to disk and associated with an audio file (aka `MediaAsset`).
pub struct MediaCache<T> {
    cache: HashMap<MediaAssetId, Arc<T>>,
}

impl<T> MediaCache<T> {
    pub fn new() -> Self {
        let cache: HashMap<MediaAssetId, Arc<T>> = HashMap::new();
        Self { cache }
    }
    pub fn insert(&mut self, id: MediaAssetId, media: T) {
        self.cache.insert(id, Arc::new(media));
    }
    pub fn get_buffer_by_id(&self, id: &MediaAssetId) -> Option<Arc<T>> {
        self.cache.get(id).cloned()
    }
}

pub type AudioCache = MediaCache<AudioBuffer>;
pub type MidiCache = MediaCache<MIDIInputEventCache>;

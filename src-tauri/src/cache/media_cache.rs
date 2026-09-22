use std::{collections::HashMap, sync::Arc};
use thiserror::Error;

use tauri::async_runtime::Mutex;

use crate::{engine::shared::audio_buffer::AudioBuffer, midi::MIDIInputEvent};

#[derive(Error, Debug)]
pub enum MediaCacheError {
    #[error("Couldn't lock asset store buffer")]
    LockError,
}

/// The filename of the media
/// @TODO: Change to a UUID to lower memory cost
pub type MediaAssetId = String;

/// Cache for audio buffers that are loaded to disk and associated with an audio file (aka `MediaAsset`).
pub struct MediaCache<T> {
    cache: Mutex<HashMap<MediaAssetId, Arc<T>>>,
}

impl<T> MediaCache<T> {
    pub fn new() -> Self {
        let cache: Mutex<HashMap<MediaAssetId, Arc<T>>> = Mutex::new(HashMap::new());
        Self { cache }
    }
    pub fn insert(&mut self, id: MediaAssetId, media: T) -> Result<(), MediaCacheError> {
        let mut cache = self
            .cache
            .try_lock()
            .map_err(|_| MediaCacheError::LockError)?;

        cache.insert(id, Arc::new(media));
        Ok(())
    }
    pub fn get_buffer_by_id(&self, id: &MediaAssetId) -> Result<Option<Arc<T>>, MediaCacheError> {
        let buffer = {
            let asset_store = self
                .cache
                .try_lock()
                .map_err(|_| MediaCacheError::LockError)?;
            asset_store.get(id).cloned()
        };
        Ok(buffer)
    }
}

pub type AudioCache = MediaCache<AudioBuffer>;
pub type MidiCache = MediaCache<MIDIInputEvent>;

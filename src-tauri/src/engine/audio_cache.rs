use std::{collections::HashMap, sync::Arc};
use tauri::async_runtime::Mutex;


use crate::engine::shared::audio_buffer::AudioBuffer;

/// The filename of the audio sample
type AssetId = String;

/// Cache for audio buffers that are loaded to disk and associated with an audio file (aka `MediaAsset`).
pub struct AudioCache {
    buffers: Mutex<HashMap<AssetId, Arc<AudioBuffer>>>,
}

impl AudioCache {
    pub fn new(buffers: Mutex<HashMap<AssetId, Arc<AudioBuffer>>>) -> Self {
        Self { buffers }
    }
    pub fn insert(&mut self, id: AssetId, buffer: AudioBuffer) {
        let buffer_lock = self.buffers.try_lock();
        match buffer_lock {
            Ok(mut buffers) => {
                buffers.insert(id, Arc::new(buffer));
            }
            Err(error) => {
                eprintln!("{}", error);
            }
        }
    }
    pub fn get_buffer_by_id(&self, id: &AssetId) -> Option<Arc<AudioBuffer>> {
        let buffer = {
            let asset_store = self
                .buffers
                .try_lock()
                .expect("Couldn't lock asset store buffer");
            asset_store.get(id).cloned()
        };
        buffer
    }
}

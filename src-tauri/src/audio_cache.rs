use std::{collections::HashMap, sync::{Arc, Mutex}};

use tauri::{AppHandle, Builder, Emitter, Manager, State};
use serde::Serialize;

use crate::{audio_buffer::AudioBuffer, math::map_range};


#[tauri::command(async)]
pub async fn get_sample_waveform(
    audio_cache: State<'_, AudioCache>,
    path: String,
    size: usize,
) -> Result<Vec<f32>, String> {
    let buffer_option = audio_cache.get_buffer_by_id(&path);
    let mut waveform = Vec::with_capacity(size);

    // Reduce to necessary size
    if let Some(buffer) = buffer_option {
        let original_length = buffer.samples.len();
        
        for index in (0..size) {
            let buffer_index_raw = map_range(index as f64, 0.0, size as f64, 0.0, original_length as f64);
            let buffer_index = buffer_index_raw.floor() as usize;
            let waveform_value = buffer.samples[buffer_index];
            waveform.push(waveform_value);
        }
    }

    Ok(waveform)
}

/// The filename of the audio sample
type AssetId = String;

pub struct AudioCache {
    buffers: Mutex<HashMap<AssetId, Arc<AudioBuffer>>>,
}

impl AudioCache {
    pub fn new(buffers: Mutex<HashMap<AssetId, Arc<AudioBuffer>>>) -> Self {
        Self { buffers }
    }
    pub fn insert(&mut self, id: AssetId, buffer: AudioBuffer) {
        let buffer_lock = self.buffers.lock();
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
                .lock()
                .expect("Couldn't lock asset store buffer");
            asset_store.get(id).cloned()
        };
        buffer
    }
}

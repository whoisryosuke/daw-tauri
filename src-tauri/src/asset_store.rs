use std::{collections::HashMap, sync::Arc};
use tauri::async_runtime::Mutex;

use serde::Serialize;
use tauri::{Manager, State};


#[derive(Clone, Serialize)]
pub enum MediaAssetType {
    Audio,
    Midi,
}

#[tauri::command(async)]
pub async fn get_assets(
    asset_store: State<'_, Mutex<AssetStore>>,
) -> Result<Vec<MediaAsset>, String> {
    let asset_store = asset_store
        .try_lock()
        .map_err(|_| "Can't lock asset store".to_string())?;
    println!("Getting assets from store");
    Ok(asset_store
        .get_assets()
        .into_iter()
        .map(|arc_asset| (*arc_asset).clone())
        .collect())
}

/// Media that's been loaded from disk.
/// For example, audio files get stored as a `MediaAsset` and buffer data in `AudioCache`.
/// This allows us to have other types of "media", like MIDI
#[derive(Clone, Serialize)]
pub struct MediaAsset {
    name: String,
    path: String,
    duration: f64,
    asset_type: MediaAssetType,
}

impl MediaAsset {
    pub fn new(name: String, path: String, duration: f64, asset_type: MediaAssetType) -> Self {
        Self {
            name,
            path,
            duration,
            asset_type,
        }
    }
}

/// Store for media loaded from disk (like audio files, MIDI, etc).
/// This only contains the file path for reference (to load into a specific store like `AudioCache`)
/// and other metadata that can be shared between all media types.
pub struct AssetStore {
    assets: HashMap<String, Arc<MediaAsset>>,
}

impl AssetStore {
    pub fn new() -> Self {
        let assets: HashMap<String, Arc<MediaAsset>> = HashMap::new();

        Self { assets }
    }

    pub fn create_asset(
        name: String,
        path: String,
        duration: f64,
        asset_type: MediaAssetType,
    ) -> MediaAsset {
        MediaAsset {
            name,
            path,
            duration,
            asset_type,
        }
    }

    pub fn insert(&mut self, id: String, asset: MediaAsset) {
        self.assets.insert(id, Arc::new(asset));
    }
    pub fn get_buffer_by_id(&self, id: String) -> Option<Arc<MediaAsset>> {
        let buffer = self.assets.get(&id).cloned();

        buffer
    }
    pub fn get_assets(&self) -> Vec<Arc<MediaAsset>> {
        self.assets.values().cloned().collect()
    }
}

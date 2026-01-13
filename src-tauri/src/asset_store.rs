use std::{collections::HashMap, sync::{Arc, Mutex}};

use tauri::{AppHandle, Builder, Emitter, Manager, State};
use serde::Serialize;

#[tauri::command(async)]
pub async fn get_assets(
    asset_store: State<'_, AssetStore>,
) -> Result<Vec<MediaAsset>, String> {
    println!("Getting assets from store");
    Ok(asset_store.get_assets()
        .into_iter()
        .map(|arc_asset| (*arc_asset).clone())
        .collect())
}

#[derive(Clone, Serialize)]
pub struct MediaAsset {
    name: String,
    path: String,
    duration: f64,
}

impl MediaAsset {
    pub fn new(name: String, path: String, duration: f64) -> Self{
        Self {
            name, path, duration
        }
    }
}

pub struct AssetStore {
    assets: Mutex<HashMap<String, Arc<MediaAsset>>>,
}

impl AssetStore {
    pub fn new(assets: Mutex<HashMap<String, Arc<MediaAsset>>>,) -> Self {
        Self {
            assets
        }
    }
    pub fn insert(&mut self, id: String, asset: MediaAsset) {
        let buffer_lock = self.assets.lock();
        match buffer_lock {
            Ok(mut assets) => {
                assets.insert(id, Arc::new(asset));
            }
            Err(error) => {
                eprintln!("{}", error);
            }
        }
    }
    pub fn get_buffer_by_id(&self, id: String) -> Option<Arc<MediaAsset>> {
        let buffer = {
            let asset_store = self
                .assets
                .lock()
                .expect("Couldn't lock asset store buffer");
            asset_store.get(&id).cloned()
        };
        buffer
    }
    pub fn get_assets(&self) -> Vec<Arc<MediaAsset>> {
        let asset_store = self
            .assets
            .lock()
            .expect("Couldn't lock asset store buffer");
        asset_store.values().cloned().collect()
    }
}
use std::{
    collections::HashMap,
    path::Path,
    sync::{Arc, Mutex},
};

use vst3_host::{PluginInfo, Vst3Host};

pub type VstPluginInstance = Arc<Mutex<vst3_host::Plugin>>;

pub struct VstPlugin {
    pub plugin: Option<VstPluginInstance>,

    // Metadata
    pub metadata: vst3_host::PluginInfo,
}

pub struct VstCache {
    pub plugins: HashMap<String, VstPlugin>,
}

impl VstCache {
    pub fn new() -> Self {
        let plugins = HashMap::new();
        Self { plugins }
    }

    pub fn discover_vst_plugins(&mut self) -> Result<Vec<PluginInfo>, String> {
        // A host configured for 48 kHz / 512-sample blocks.
        let mut host = Vst3Host::builder()
            .sample_rate(44100.0)
            .block_size(512)
            .scan_default_paths()
            .build()
            .map_err(|e| e.to_string())?;

        let plugins = host.discover_plugins().map_err(|e| e.to_string())?;

        for plugin in &plugins {
            let plugin_info = plugin.clone();
            let id = plugin_info.uid.clone();
            let plugin_instance = VstPlugin {
                plugin: None,
                metadata: plugin_info,
            };

            self.plugins.insert(id, plugin_instance);
        }

        Ok(plugins)
    }

    pub fn load_plugin<P: AsRef<Path>>(
        &mut self,
        id: String,
        path: P,
    ) -> Result<VstPluginInstance, String> {
        let plugin =
            vst3_host::simple::load_plugin("C:/Program Files/Common Files/VST3/Analog Lab V.vst3")
                .map_err(|e| e.to_string())?;
        let metadata = plugin.info().clone();
        // We specifically use `std::sync::Mutex` because it's required by VST3 crate.
        let plugin = Arc::new(Mutex::new(plugin));

        let plugin_data = VstPlugin {
            plugin: Some(plugin.clone()),
            metadata,
        };

        self.plugins.insert(id, plugin_data);

        Ok(plugin.clone())
    }

    pub fn get_plugin(&self, id: &String) -> Result<Arc<Mutex<vst3_host::Plugin>>, String> {
        match self.plugins.get(id) {
            Some(plugin_data) => {
                let plugin = plugin_data
                    .plugin
                    .clone()
                    .ok_or("Plugin isn't loaded".to_string())?;

                Ok(plugin)
            }
            None => Err("Couldn't find that plugin".to_string()),
        }
    }

    pub fn send_midi(&self, id: &String, event: vst3_host::MidiEvent) -> Result<(), String> {
        let plugin = self.get_plugin(id)?;

        // Lock plugin to send MIDI signals
        let mut plugin = plugin.try_lock().map_err(|e| e.to_string())?;

        // Send MIDI event
        plugin.send_midi_event(event).map_err(|e| e.to_string())
    }
}

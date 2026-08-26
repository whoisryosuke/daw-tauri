use std::{
    collections::HashMap,
    path::Path,
    sync::{Arc, Mutex},
};

pub type VstPluginInstance = Arc<Mutex<vst3_host::Plugin>>;

pub struct VstPlugin {
    pub plugin: VstPluginInstance,
}

pub struct VstCache {
    pub plugins: HashMap<String, VstPlugin>,
}

impl VstCache {
    pub fn new() -> Self {
        let plugins = HashMap::new();
        Self { plugins }
    }

    pub fn load_plugin<P: AsRef<Path>>(
        &mut self,
        id: String,
        path: P,
    ) -> Result<VstPluginInstance, String> {
        let plugin =
            vst3_host::simple::load_plugin("C:/Program Files/Common Files/VST3/Analog Lab V.vst3")
                .map_err(|e| e.to_string())?;
        let plugin = Arc::new(std::sync::Mutex::new(plugin));

        let plugin_data = VstPlugin {
            plugin: plugin.clone(),
        };

        self.plugins.insert(id, plugin_data);

        Ok(plugin.clone())
    }

    pub fn send_midi(&self, id: &String, event: vst3_host::MidiEvent) -> Result<(), String> {
        match self.plugins.get(id) {
            Some(plugin_data) => {
                let mut plugin = plugin_data.plugin.try_lock().map_err(|e| e.to_string())?;

                plugin.send_midi_event(event).map_err(|e| e.to_string())
            }
            None => Err("Couldn't find that plugin".to_string()),
        }
    }
}

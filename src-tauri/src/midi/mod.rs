use std::sync::Mutex;

use midir::{Ignore, MidiInput, MidiInputConnection, MidiInputPort};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Clone, Serialize, Deserialize)]
pub struct InputDeviceSelection {
    name: String,
    id: String,
}
pub type InputDeviceSelectionResult = Vec<InputDeviceSelection>;

pub struct MIDIStore {
    input_connection: Option<MidiInputConnection<()>>,
    selected_input_device: String,
}

impl MIDIStore {
    pub fn new() -> Self {
        Self {
            input_connection: None,
            selected_input_device: "".into(),
        }
    }

    /// Get a list of input devices
    pub fn get_input_devices(&mut self) -> Result<InputDeviceSelectionResult, String> {
        let connection = self.init_input_connection()?;

        let in_ports = connection.ports();

        let mut input_devices: InputDeviceSelectionResult = Vec::new();
        for port in in_ports {
            let id = port.id();
            let name = connection
                .port_name(&port)
                .unwrap_or("Unnamed Device".to_string());

            let input_device = InputDeviceSelection { name, id };

            input_devices.push(input_device);
        }

        return Ok(input_devices);
    }

    /// Get input device by ID
    pub fn get_input_device_port(&mut self, id: String) -> Result<MidiInputPort, String> {
        let connection = self.init_input_connection()?;

        let in_ports = connection.ports();

        let input_device_port = in_ports.iter().find(|port| port.id() == id).ok_or(format!(
            "Couldn't find the port for that input device: {}",
            id
        ))?;

        return Ok(input_device_port.clone());
    }

    /// Initialize the MIDI input library. Used for getting devices or connecting and receiving input.
    fn init_input_connection(&mut self) -> Result<MidiInput, String> {
        let mut midi_in =
            MidiInput::new("midir reading input").map_err(|op| "Couldn't init MIDI input")?;
        midi_in.ignore(Ignore::None);

        Ok(midi_in)
    }

    /// Create an input connection using default device, or designated "port" (aka input device)
    pub fn create_input_connection(&mut self, port: Option<MidiInputPort>) -> Result<(), String> {
        // Stop previous connections
        if let Some(old_connection) = self.input_connection.take() {
            old_connection.close();
        }

        // Initialize the MIDI input library
        let midi_in = self.init_input_connection()?;

        // Determine port: user selected or default + error handling
        let in_port = match port {
            Some(user_port) => user_port,
            None => {
                // Get a default input port
                let in_ports = midi_in.ports();
                let in_port = match in_ports.len() {
                    0 => return Err("no input port found".into()),
                    _ => {
                        println!(
                            "Choosing the only available input port: {}",
                            midi_in.port_name(&in_ports[0]).unwrap()
                        );
                        &in_ports[0]
                    }
                };
                in_port.clone()
            }
        };

        // Store the selected device for reference later
        self.selected_input_device = in_port.id();

        println!("\nOpening connection");
        let in_port_name = midi_in
            .port_name(&in_port)
            .map_err(|op| "Couldn't get port name")?;

        // Establish MIDI input connection
        // This is where input actually comes in and gets stored
        let _conn_in = midi_in
            .connect(
                &in_port,
                "midir-read-input",
                move |stamp, message, _| {
                    println!("{}: {:?} (len = {})", stamp, message, message.len());
                },
                (),
            )
            .map_err(|op| "MIDI connection error")?;

        // Store the connection for use later + persistence
        self.input_connection = Some(_conn_in);

        println!(
            "Connection open, reading input from '{}' (press enter to exit) ...",
            in_port_name
        );

        Ok(())
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct GetInputDevicesPayload {
    devices: InputDeviceSelectionResult,
    selected: String,
}

/// Starts the MIDI connection using the default device
#[tauri::command()]
pub async fn get_midi_input_devices(
    midi_store: State<'_, Mutex<MIDIStore>>,
) -> Result<GetInputDevicesPayload, String> {
    let mut store = midi_store.lock().map_err(|_| "Couldn't lock MIDI store")?;

    let devices = store.get_input_devices()?;

    Ok(GetInputDevicesPayload {
        devices,
        selected: store.selected_input_device.clone(),
    })
}

/// Starts the MIDI connection using the default device
#[tauri::command()]
pub async fn start_midi_connection(midi_store: State<'_, Mutex<MIDIStore>>) -> Result<(), String> {
    let mut store = midi_store.lock().map_err(|_| "Couldn't lock MIDI store")?;

    store.create_input_connection(None)?;

    Ok(())
}

/// Connects to a specific input device based on the port ID (from the MidiInputPort `id()` method)
#[tauri::command()]
pub async fn connect_to_midi_input_device(
    midi_store: State<'_, Mutex<MIDIStore>>,
    device: String,
) -> Result<(), String> {
    let mut store = midi_store.lock().map_err(|_| "Couldn't lock MIDI store")?;

    let device_port = store.get_input_device_port(device)?;
    store.create_input_connection(Some(device_port))?;

    Ok(())
}

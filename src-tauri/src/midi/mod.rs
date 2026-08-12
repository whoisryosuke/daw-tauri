use crossbeam::channel::{Receiver, Sender};
use midir::{Ignore, MidiInput, MidiInputConnection, MidiInputPort};
use serde::{Deserialize, Serialize};
use std::{sync::Mutex, thread, time::Duration};
use tauri::{AppHandle, Emitter, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MidiCommand {
    NoteOn,
    NoteOff,
    Unknown,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct MIDIInputEvent {
    pub command: MidiCommand,
    pub channel: u8,
    pub note: u8,
    pub velocity: u8,
}

impl MIDIInputEvent {
    /// Parse a raw MIDI byte slice into a MIDIInputEvent
    /// midir returns array of 3 nums: note on/off, MIDI note index, and velocity
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        // Note On and Note Off messages are 3 bytes long
        if bytes.len() < 3 {
            return None;
        }

        let status_byte = bytes[0];

        // The high nibble (top 4 bits) is the command type
        // 0x90 is Note On, 0x80 is Note Off
        // @see: midir test_play example for reference
        let command = match status_byte & 0xF0 {
            0x90 => MidiCommand::NoteOn,
            0x80 => MidiCommand::NoteOff,
            _ => MidiCommand::Unknown,
        };

        // The low nibble (bottom 4 bits) is the MIDI channel (0-15)
        let channel = status_byte & 0x0F;

        // The note and velocity are just numbers in array slots 2 and 3
        let note = bytes[1];
        let velocity = bytes[2];

        Some(MIDIInputEvent {
            command,
            channel,
            note,
            velocity,
        })
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct InputDeviceSelection {
    name: String,
    id: String,
}
pub type InputDeviceSelectionResult = Vec<InputDeviceSelection>;

pub struct MIDIStore {
    input_connection: Option<MidiInputConnection<()>>,
    selected_input_device: String,
    input_producer: Sender<MIDIInputEvent>,
}

impl MIDIStore {
    pub fn new(app: AppHandle) -> Self {
        let (input_producer, input_receiver) = crossbeam::channel::bounded::<MIDIInputEvent>(128);

        Self::spawn_sync_thread(app, input_receiver);

        let store = Self {
            input_connection: None,
            selected_input_device: "".into(),
            input_producer,
        };

        store
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
        let input_producer = self.input_producer.clone();
        let _conn_in = midi_in
            .connect(
                &in_port,
                "midir-read-input",
                move |stamp, message, _| {
                    println!("{}: {:?} (len = {})", stamp, message, message.len());
                    if let Some(event) = MIDIInputEvent::from_bytes(message) {
                        input_producer.send(event);
                    }
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

    fn spawn_sync_thread(app: AppHandle, receiver: Receiver<MIDIInputEvent>) {
        thread::spawn(move || {
            loop {
                // Handle commands
                while let Ok(input_data) = receiver.try_recv() {
                    let _ = app.emit("midi-input", input_data.clone());
                }

                thread::sleep(Duration::from_millis(16)); // ~60 FPS
            }
        });
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

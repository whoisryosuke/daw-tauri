use midir::{Ignore, MidiInput, MidiInputPort};

struct InputDeviceSelection {
    name: String,
    id: String,
}
type InputDeviceSelectionResult = Vec<InputDeviceSelection>;

pub struct MIDIStore {}

impl MIDIStore {
    pub fn new() -> Self {
        Self {}
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

    /// Create an input connection
    pub fn create_input_connection(&mut self, port: Option<MidiInputPort>) -> Result<(), String> {
        let midi_in = self.init_input_connection()?;

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

        println!("\nOpening connection");
        let in_port_name = midi_in
            .port_name(&in_port)
            .map_err(|op| "Couldn't get port name")?;

        // _conn_in needs to be a named parameter, because it needs to be kept alive until the end of the scope
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

        println!(
            "Connection open, reading input from '{}' (press enter to exit) ...",
            in_port_name
        );

        Ok(())
    }
}

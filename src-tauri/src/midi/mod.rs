pub mod midi_exporter;

use crossbeam::channel::{Receiver, Sender};
use midir::{Ignore, MidiInput, MidiInputConnection, MidiInputPort};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::asset_store::{AssetStore, MediaAssetType};
use crate::cache::media_cache::{AudioCache, MidiCache};
use crate::composition::clip::ClipType;
use crate::composition::composition::CompositionStore;
use crate::composition::track_clips::TrackClipType;
use crate::engine::audio_commands::{play_audio, stop_audio};
use crate::engine::audio_engine::AudioEngine;
use crate::engine::audio_engine_messaging::AudioEngineMessaging;
use crate::math::frames_to_seconds;
use crate::utils::uuid::generate_uuid;

pub struct MIDIRecordingState {
    /// Start time in "samples" (not seconds)
    pub start_time: u64,
    pub track_id: Option<String>,
}

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
    pub time: u64,
}

pub type MIDIInputEventCache = Vec<MIDIInputEvent>;

impl MIDIInputEvent {
    /// Parse a raw MIDI byte slice into a MIDIInputEvent
    /// midir returns array of 3 nums: note on/off, MIDI note index, and velocity
    pub fn from_bytes(bytes: &[u8], time: u64) -> Option<Self> {
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
            time,
        })
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct InputDeviceSelection {
    name: String,
    id: String,
}
pub type InputDeviceSelectionResult = Vec<InputDeviceSelection>;

/// The primary MIDI input module.
/// Connects to MIDI devices to get MIDI events. Syncs MIDI to UI. And handles recording MIDI to `Clip`.
pub struct MIDIStore {
    /// The actual MIDI connection
    /// @TODO: Make HashMap to allow multiple connections
    input_connection: Option<MidiInputConnection<()>>,

    /// The currenct MIDI device name (for convenience)
    selected_input_device: String,

    /// MPSC producer used to send MIDI events to consumers
    /// (like the separate thread we use to `emit()` MIDI events to frontend)
    input_producer: Sender<MIDIInputEvent>,

    /// Tauri AppHandle used for emitting events to UI
    app: AppHandle,

    /// The current playback time shared with AudioEngine.
    /// Used to get frame-accurate timing for MIDI events.
    playback_time: Arc<AtomicU64>,

    /// Is MIDI recording enabled?
    /// Enables/disables saving MIDI events to cache.
    recording: Arc<AtomicBool>,

    /// Properties used for recording (like "start time")
    pub recording_state: MIDIRecordingState,

    /// Cache for MIDI events used for saving into a timeline `Clip` later.
    playback_cache: Arc<Mutex<Vec<MIDIInputEvent>>>,
}

impl MIDIStore {
    pub fn new(app: AppHandle, playback_time: Arc<AtomicU64>) -> Self {
        let (input_producer, input_receiver) = crossbeam::channel::bounded::<MIDIInputEvent>(128);

        let playback_cache: Arc<Mutex<Vec<MIDIInputEvent>>> = Arc::new(Mutex::new(Vec::new()));
        let recording = Arc::new(AtomicBool::new(false));

        let recording_state = MIDIRecordingState {
            start_time: 0,
            track_id: None,
        };

        Self::spawn_sync_thread(
            app.clone(),
            input_receiver,
            recording.clone(),
            playback_cache.clone(),
        );

        let store = Self {
            app: app.clone(),
            input_connection: None,
            selected_input_device: "".into(),
            input_producer,
            playback_time: playback_time.clone(),
            recording,
            recording_state,
            playback_cache,
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
            MidiInput::new("midir reading input").map_err(|_op| "Couldn't init MIDI input")?;
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
            .map_err(|_op| "Couldn't get port name")?;

        // Establish MIDI input connection
        // This is where input actually comes in and gets stored
        let input_producer = self.input_producer.clone();
        let app = self.app.clone();
        let playback_time = self.playback_time.clone();
        let _conn_in = midi_in
            .connect(
                &in_port,
                "midir-read-input",
                move |stamp, message, _| {
                    // Get current time
                    let current_time = playback_time.load(Ordering::Relaxed);

                    println!("{}: {:?} (len = {})", stamp, message, message.len());
                    if let Some(event) = MIDIInputEvent::from_bytes(message, current_time) {
                        let command = event.command.clone();
                        let note = event.note.clone();
                        input_producer.send(event);
                        let messaging = app.state::<AudioEngineMessaging>();
                        match command {
                            MidiCommand::NoteOn => messaging.play_midi_input(note),
                            MidiCommand::NoteOff => messaging.stop_midi_input(note),
                            MidiCommand::Unknown => {}
                        };
                    }
                },
                (),
            )
            .map_err(|_op| "MIDI connection error")?;

        // Store the connection for use later + persistence
        self.input_connection = Some(_conn_in);

        println!(
            "Connection open, reading input from '{}' (press enter to exit) ...",
            in_port_name
        );

        Ok(())
    }

    async fn start_recording(&mut self, track_id: String) {
        // Empty cache
        let mut playback_cache = self.playback_cache.lock().await;
        playback_cache.clear();

        self.recording.store(true, Ordering::SeqCst);

        // Save current time as start of recording
        let time = self.get_current_time();
        self.recording_state.start_time = time;
        self.recording_state.track_id = Some(track_id);
    }

    async fn stop_recording(&mut self) -> Vec<MIDIInputEvent> {
        self.recording.store(false, Ordering::SeqCst);

        // Return cache
        let playback_cache = self.playback_cache.lock().await;
        playback_cache.clone()
    }

    fn get_current_time(&self) -> u64 {
        self.playback_time.load(Ordering::Relaxed)
    }

    fn spawn_sync_thread(
        app: AppHandle,
        receiver: Receiver<MIDIInputEvent>,
        recording: Arc<AtomicBool>,
        playback_cache: Arc<Mutex<Vec<MIDIInputEvent>>>,
    ) {
        thread::spawn(move || {
            loop {
                // Handle commands
                while let Ok(input_data) = receiver.try_recv() {
                    let _ = app.emit("midi-input", input_data.clone());

                    let is_recording = recording.load(Ordering::Relaxed);
                    if is_recording {
                        if let Ok(mut cache) = playback_cache.try_lock() {
                            cache.push(input_data);
                        }
                    }
                }
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
    let mut store = midi_store
        .try_lock()
        .map_err(|_| "Couldn't lock MIDI store")?;

    let devices = store.get_input_devices()?;

    Ok(GetInputDevicesPayload {
        devices,
        selected: store.selected_input_device.clone(),
    })
}

/// Starts the MIDI connection using the default device
#[tauri::command()]
pub async fn start_midi_connection(midi_store: State<'_, Mutex<MIDIStore>>) -> Result<(), String> {
    let mut store = midi_store
        .try_lock()
        .map_err(|_| "Couldn't lock MIDI store")?;

    store.create_input_connection(None)?;

    Ok(())
}

/// Connects to a specific input device based on the port ID (from the MidiInputPort `id()` method)
#[tauri::command()]
pub async fn connect_to_midi_input_device(
    midi_store: State<'_, Mutex<MIDIStore>>,
    device: String,
) -> Result<(), String> {
    let mut store = midi_store
        .try_lock()
        .map_err(|_| "Couldn't lock MIDI store")?;

    let device_port = store.get_input_device_port(device)?;
    store.create_input_connection(Some(device_port))?;

    Ok(())
}

/// Simulates MIDI playback from frontend
#[tauri::command()]
pub async fn play_midi_key(
    messaging: State<'_, AudioEngineMessaging>,
    midi: u8,
) -> Result<(), String> {
    messaging.play_midi_input(midi);

    Ok(())
}

/// Starts MIDI recording
#[tauri::command()]
pub async fn start_midi_recording(
    midi_store: State<'_, Mutex<MIDIStore>>,
    messaging: State<'_, AudioEngineMessaging>,
    asset_store: State<'_, Mutex<AudioCache>>,
    composition: State<'_, Mutex<CompositionStore>>,
    engine: State<'_, Mutex<AudioEngine>>,
) -> Result<(), String> {
    // Start MIDI recording in the MIDI store
    let mut store = midi_store
        .try_lock()
        .map_err(|_| "Couldn't lock MIDI store")?;

    // We do this in a block because we require composition again later
    {
        let composition_store = composition
            .try_lock()
            .map_err(|_| "Couldn't lock MIDI store")?;

        // Clone the track ID to appease our Mutex overlords
        let play_midi_track = composition_store.play_midi_track.clone();
        match play_midi_track {
            Some(track_id) => {
                // Finally start recording on selected track
                store.start_recording(track_id).await;
            }
            None => {
                // Ideally UI won't allow user to record without a selected track
                return Err("Select a MIDI track first".to_string());
            }
        }
    }

    // Start playback (to progress `playback_time` and let user preview audio while recording)
    play_audio(messaging, asset_store, composition, engine).await?;

    Ok(())
}

/// Stop MIDI recording and save MIDI data to Composition as TrackClip
#[tauri::command()]
pub async fn stop_midi_recording(
    midi_store: State<'_, Mutex<MIDIStore>>,
    messaging: State<'_, AudioEngineMessaging>,
    asset_store: State<'_, Mutex<AssetStore>>,
    midi_cache: State<'_, Mutex<MidiCache>>,
    composition: State<'_, Mutex<CompositionStore>>,
    engine: State<'_, Mutex<AudioEngine>>,
) -> Result<MIDIInputEventCache, String> {
    let mut store = midi_store
        .try_lock()
        .map_err(|_| "Couldn't lock MIDI store")?;

    // Stop recording and get MIDI data to store
    let midi_input_data = store.stop_recording().await;

    let track_id = store
        .recording_state
        .track_id
        .clone()
        .ok_or("No MIDI track selected".to_string())?;

    // Get sample rate from engine
    let engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;
    let sample_rate = engine.config.sample_rate();

    // Get current time
    let current_time = store.get_current_time();
    let start_time = store.recording_state.start_time;
    let start_time_seconds = frames_to_seconds(start_time, sample_rate)?;
    let duration_frames = current_time - start_time;

    // Calculate duration
    let duration = frames_to_seconds(duration_frames, sample_rate)?;

    // Create asset in AssetStore
    let mut asset_store = asset_store
        .try_lock()
        .map_err(|_| "Couldn't lock asset store")?;
    let id = generate_uuid();
    let name = "New Recording".to_string();
    let path = "".to_string();
    let asset = AssetStore::create_asset(name.clone(), path, duration, MediaAssetType::Midi);
    asset_store.insert(id.clone(), asset);

    // Store actual MIDI data in MidiCache
    let mut midi_cache = midi_cache
        .try_lock()
        .map_err(|_| "Couldn't lock MIDI cache")?;
    midi_cache.insert(id.clone(), midi_input_data.clone());

    // Create MIDI clip in timeline
    let mut composition = composition
        .try_lock()
        .map_err(|_| "Couldn't lock composition")?;
    composition.insert_clip(
        id.clone(),
        name.clone(),
        duration,
        ClipType::Midi,
        id.clone(),
    );
    composition.insert_track_clip(
        track_id,
        id.clone(),
        start_time_seconds,
        true,
        TrackClipType::Midi,
    );

    // Stop playback
    stop_audio(messaging).await;

    Ok(midi_input_data)
}

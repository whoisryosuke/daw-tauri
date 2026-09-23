use crate::midi::{MIDIInputEventCache, MidiCommand};

pub fn save_to_midi(events: &MIDIInputEventCache, file_path: &str) -> Result<(), String> {
    // Sort MIDI events by time
    let mut sorted_events = events.clone();
    sorted_events.sort_by_key(|e| e.time);

    // Construct the MIDI file's "Header"
    // @TODO: Format: single track - we can switch here for multi-track later.
    // Division: Ticks per quarter note (e.g., 480 is standard)
    let header = midly::Header {
        format: midly::Format::SingleTrack,
        timing: midly::Timing::Metrical(480.into()),
    };

    // Initialize the file (this is where we'll put tracks)
    let mut midi_file = midly::Smf::new(header);

    // Create a MIDI track
    let mut track = midly::Track::new();

    // MIDI timing is delta based (how many "ticks" since last note)
    let mut last_event_time: u64 = 0;

    // Convert our internal MIDI events to midly compatible types
    for event in sorted_events {
        // Calculate delta time
        let delta_time = event.time - last_event_time;
        last_event_time = event.time;

        let midi_msg = match event.command {
            MidiCommand::NoteOn => midly::MidiMessage::NoteOn {
                key: event.note.into(),
                vel: event.velocity.into(),
            },
            MidiCommand::NoteOff => midly::MidiMessage::NoteOff {
                key: event.note.into(),
                vel: event.velocity.into(),
            },
            MidiCommand::Unknown => continue, // Skip unknown commands
        };

        // Create the track event with MIDI data
        // @TODO: Convert timing from u64 to u32?
        let track_event = midly::TrackEvent {
            delta: (delta_time as u32).into(),
            kind: midly::TrackEventKind::Midi {
                channel: (event.channel - 1).into(),
                message: midi_msg,
            },
        };

        track.push(track_event);
    }

    // Add the track to the file
    midi_file.tracks.push(track);

    // Write to disk using midly `Smf` struct
    midi_file
        .save(file_path)
        .map_err(|_| "Couldn't create file".to_string())?;

    Ok(())
}

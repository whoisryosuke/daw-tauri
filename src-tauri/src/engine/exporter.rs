use std::{
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc,
    },
    thread,
    time::Duration,
};
use tauri::async_runtime::Mutex;

use tauri::{AppHandle, Emitter, State};

use crate::{
    cache::media_cache::AudioCache,
    composition::{
        composition::CompositionStore,
        track_clips::{TrackClip, TrackClipType},
    },
    engine::{
        audio_engine::AudioEngine,
        mixer::Mixer,
        nodes::{audio::sample_node::SampleNode, audio_node::AudioNodeTypes},
    },
    math::seconds_to_frames,
};

pub struct AudioExporter {
    buffer_size: usize,
    mixer: Mixer,
    playback_time: Arc<AtomicU64>,
    total_frames: Arc<AtomicU64>,
    exporting: Arc<AtomicBool>,
}

impl AudioExporter {
    pub fn new() -> Self {
        // Create the Mixer
        let buffer_size = 512;
        let mixer = Mixer::new(buffer_size);
        let playback_time = Arc::new(AtomicU64::new(0));
        let total_frames = Arc::new(AtomicU64::new(0));
        let exporting = Arc::new(AtomicBool::new(false));

        Self {
            mixer,
            buffer_size,
            playback_time,
            total_frames,
            exporting,
        }
    }
    pub fn export_audio_file(
        &mut self,
        app: AppHandle,
        composition: &CompositionStore,
        audio_cache: &AudioCache,
        sample_rate: u32,
        duration: u64,
        save_path: std::path::PathBuf,
    ) -> Result<(), String> {
        // Get all track clips and effects
        let (track_clips, effects) = composition.play();

        for (pool_index, track_clip, _) in track_clips {
            match track_clip.track_clip_type {
                TrackClipType::Sample => {
                    self.queue_sample(pool_index, track_clip, composition, audio_cache)
                }
                TrackClipType::Synthesizer => self.add_synth(pool_index, sample_rate),
                TrackClipType::Midi => {
                    // @TODO: Export MIDI track
                }
            }
        }

        for (pool_index, item) in effects {
            self.mixer.add_fx_node(pool_index, item.effect.clone());
        }

        // Mixer setup
        let channels = 2;
        let (mut waveform_producer, _) = crossbeam::channel::bounded::<f32>(128);

        // Calculate time to frames
        let total_frames = (duration as usize) * channels;
        let segments = total_frames / self.buffer_size;

        self.total_frames.store(duration, Ordering::SeqCst);

        // Enable exporting flag
        self.exporting.store(true, Ordering::SeqCst);

        // Spawn thread to sync export time with frontend
        Self::spawn_sync_thread(
            app,
            self.playback_time.clone(),
            self.total_frames.clone(),
            self.exporting.clone(),
        );

        // Set Mixer to play
        self.mixer.play();

        // Create file encoder
        let spec = hound::WavSpec {
            channels: channels as u16,
            sample_rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let mut writer = hound::WavWriter::create(save_path, spec).map_err(|e| e.to_string())?;

        // Process audio on Mixer in blocks based on buffer size
        let mut output: Vec<f32> = vec![0.0; self.buffer_size];

        for _ in 0..segments {
            output.fill(0.0);

            self.mixer.process(
                &mut output,
                channels,
                sample_rate,
                &mut waveform_producer,
                self.playback_time.clone(),
            );

            // Write this block to disk
            for &sample in &output {
                let clamped = sample.clamp(-1.0, 1.0);
                let sample_i16 = (clamped * i16::MAX as f32) as i16;
                writer.write_sample(sample_i16).map_err(|e| e.to_string())?;
            }
        }

        // Done!
        // Clear flag (which ends sync thread)
        self.exporting.store(false, Ordering::SeqCst);

        Ok(())
    }

    fn add_synth(&mut self, track_index: usize, sample_rate: u32) {
        self.mixer.add_synth_node(track_index, sample_rate);
    }

    /// Create audio node from track clip using asset store data,
    /// then add node to appropriate mixer track via audio command.
    fn queue_sample(
        &mut self,
        pool_index: usize,
        track_clip: &TrackClip,
        composition: &CompositionStore,
        audio_cache: &AudioCache,
    ) {
        let Some(clip) = composition.clips.get(&track_clip.clip_id) else {
            println!("Couldn't get the clip {}", track_clip.clip_id);
            return;
        };

        let Some(clip_data) = audio_cache.get_buffer_by_id(&clip.clip_id) else {
            println!("Couldn't get clip's asset from cache {}", clip.clip_id);
            return;
        };

        let start_time = track_clip.start_time;

        // Handle clip start/end time
        let frame_range = track_clip.range.map(|(start, end)| {
            // Convert u64 to usize (for easier indexing)
            return (start as usize, end as usize);
        });

        println!("Creating audio node {}", clip.name);

        self.create_sample_node(
            clip_data.samples.clone(),
            start_time,
            pool_index,
            frame_range,
        );
    }

    /// Creates a sample node and send to mixer
    fn create_sample_node(
        &mut self,
        samples: Arc<Vec<f32>>,
        start_time: u64,
        track_index: usize,
        track_clip_range: Option<(usize, usize)>,
    ) {
        let node = AudioNodeTypes::StaticBuffer(SampleNode::new(
            samples.clone(),
            start_time,
            track_clip_range,
        ));

        self.mixer.add_audio_node(track_index, node);
    }

    fn spawn_sync_thread(
        app: AppHandle,
        playback_time: Arc<AtomicU64>,
        total_frames: Arc<AtomicU64>,
        exporting: Arc<AtomicBool>,
    ) {
        thread::spawn(move || {
            // Keep thread alive as long as exporting flag is active
            while exporting.load(Ordering::SeqCst) {
                let total_frames = total_frames.load(Ordering::SeqCst) as f32;
                let playback_time = playback_time.load(Ordering::SeqCst) as f32;

                let _ = app.emit("export_time", playback_time / total_frames);

                thread::sleep(Duration::from_millis(16)); // ~60 FPS
            }
        });
    }
}

#[tauri::command()]
pub async fn export_file(
    app: AppHandle,
    composition_store: State<'_, Mutex<CompositionStore>>,
    asset_store: State<'_, Mutex<AudioCache>>,
    _track_id: Option<String>,
    engine: State<'_, Mutex<AudioEngine>>,
    save_path: std::path::PathBuf,
) -> Result<(), String> {
    println!("Exporting file: {}", save_path.display());

    // Get sample rate
    let engine = engine.try_lock().map_err(|_| "Couldn't lock engine")?;
    let sample_rate = engine.config.sample_rate();

    // Grab composition
    let store = composition_store
        .try_lock()
        .map_err(|_| "Couldn't lock composition store")?;
    let duration = store.get_composition_duration()?;

    let asset_store = asset_store
        .try_lock()
        .map_err(|_| "Couldn't lock asset store")?;

    // Initialize the exporter
    let mut exporter = AudioExporter::new();
    exporter.export_audio_file(app, &store, &asset_store, sample_rate, duration, save_path)?;

    Ok(())
}

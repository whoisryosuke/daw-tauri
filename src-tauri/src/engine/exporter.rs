use std::{
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

use tauri::{AppHandle, Emitter, State};

use crate::{
    asset_store::AssetStore,
    audio_cache::AudioCache,
    audio_engine::{AudioEngine, Mixer},
    audio_node::{AudioNodeTypes, SampleNode},
    composition::{CompositionStore, TrackClip, TrackClipType},
    math::seconds_to_frames,
};

pub struct Exporter {
    buffer_size: usize,
    mixer: Mixer,
    playback_time: Arc<AtomicU64>,
    total_frames: Arc<AtomicU64>,
    exporting: Arc<AtomicBool>,
}

impl Exporter {
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
        duration: f64,
        save_path: std::path::PathBuf,
    ) -> Result<(), String> {
        // Get all track clips and effects
        let (track_clips, effects) = composition.play();

        for (pool_index, track_clip) in track_clips {
            match track_clip.track_clip_type {
                TrackClipType::Sample => self.queue_sample(
                    pool_index,
                    track_clip,
                    composition,
                    audio_cache,
                    sample_rate,
                ),
                TrackClipType::Synthesizer => self.add_synth(pool_index, sample_rate),
            }
        }

        for (pool_index, item) in effects {
            self.mixer.add_fx_node(pool_index, item.effect.clone());
        }

        // Mixer setup
        let channels = 2;
        let (mut waveform_producer, _) = crossbeam::channel::bounded::<f32>(128);

        // Calculate time to frames
        let frames_per_channel = seconds_to_frames(duration, sample_rate)?;
        let total_frames = (frames_per_channel as usize) * channels;
        let segments = total_frames / self.buffer_size;

        self.total_frames
            .store(frames_per_channel as u64, Ordering::SeqCst);

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
        sample_rate: u32,
    ) {
        let Some(clip) = composition.clips.get(&track_clip.clip_id) else {
            println!("Couldn't get the clip {}", track_clip.clip_id);
            return;
        };
        let Some(clip_data) = audio_cache.get_buffer_by_id(&clip.clip_id) else {
            println!("Couldn't get clip's asset from cache {}", clip.clip_id);
            return;
        };

        let start_time = seconds_to_frames(track_clip.start_time, sample_rate).unwrap_or(0);

        // Handle clip start/end time
        let frame_range = track_clip.range.map(|(start, end)| {
            // Convert seconds to frames
            // This assumes audio buffer from clip matches sample rate of app
            let start_frame = seconds_to_frames(start, sample_rate).unwrap_or(0);
            let end_frame = seconds_to_frames(end, sample_rate).unwrap_or(0);

            return (start_frame as usize, end_frame as usize);
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
    asset_store: State<'_, AudioCache>,
    track_id: Option<String>,
    engine: State<'_, Mutex<AudioEngine>>,
    save_path: std::path::PathBuf,
) -> Result<(), String> {
    println!("Exporting file: {}", save_path.display());

    // Get sample rate
    let engine = engine.lock().map_err(|_| "Couldn't lock engine")?;
    let sample_rate = engine.config.sample_rate();

    // Grab composition
    let mut store = composition_store
        .lock()
        .map_err(|_| "Couldn't lock composition store")?;
    let duration = store.get_composition_duration()?;

    // Initialize the exporter
    let mut exporter = Exporter::new();
    exporter.export_audio_file(app, &store, &asset_store, sample_rate, duration, save_path)?;

    Ok(())
}

use std::sync::{atomic::AtomicU64, Arc};

use crate::{
    asset_store::AssetStore,
    audio_cache::AudioCache,
    audio_engine::Mixer,
    audio_node::{AudioNodeTypes, SampleNode},
    composition::{CompositionStore, TrackClip, TrackClipType},
    math::seconds_to_frames,
};

pub struct Exporter {
    buffer_size: usize,
    mixer: Mixer,
    playback_time: Arc<AtomicU64>,
}

impl Exporter {
    pub fn new() -> Self {
        // Create the Mixer
        let buffer_size = 512;
        let mixer = Mixer::new(buffer_size);
        let playback_time = Arc::new(AtomicU64::new(0));

        Self {
            mixer,
            buffer_size,
            playback_time,
        }
    }
    pub fn export_audio_file(
        &mut self,
        composition: &CompositionStore,
        audio_cache: &AudioCache,
        sample_rate: u32,
        duration: f64,
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
            // self.send_command(AudioCommand::AddEffect(pool_index, item.effect.clone()));
        }

        // Mixer setup
        let channels = 2;
        let (mut waveform_producer, waveform_consumer) = crossbeam::channel::bounded::<f32>(128);

        // Calculate time to frames
        let total_frames = seconds_to_frames(duration, sample_rate)?;
        let segments = (total_frames as usize) / self.buffer_size;

        // Set Mixer to play
        self.mixer.play();

        // Process audio on Mixer in blocks based on buffer size
        let mut output = Vec::with_capacity(self.buffer_size);
        for i in 0..segments {
            self.mixer.process(
                &mut output,
                channels,
                sample_rate,
                &mut waveform_producer,
                self.playback_time.clone(),
            );
        }

        Ok(())
    }

    pub fn add_synth(&mut self, track_index: usize, sample_rate: u32) {
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
}

use std::sync::{atomic::AtomicU64, Arc};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use crossbeam::channel::{Receiver, Sender};
use tauri::{AppHandle, Manager};

use crate::{
    engine::{
        audio_engine_messaging::{AudioCommand, AudioEngineMessaging},
        mixer::Mixer,
    },
    utils::notification_system::{send_notification, NotificationType},
};

const MAX_CALLBACK_FRAMES: usize = 8192;

pub struct AudioEngine {
    app: AppHandle,
    /**
     * The audio stream. This has to stay alive to ensure sound continues playing.
     */
    stream: Option<cpal::Stream>,

    pub config: cpal::SupportedStreamConfig,

    pub selected_device: String,

    consumer: Receiver<AudioCommand>,
    pub playback_time: Arc<AtomicU64>,
    waveform_producer: Sender<f32>,
}

impl AudioEngine {
    pub fn new(app: AppHandle) -> Self {
        // Allocate a ring buffer to hold commands for the audio stream
        let (producer, consumer) = crossbeam::channel::bounded::<AudioCommand>(128);
        let (waveform_producer, waveform_consumer) = crossbeam::channel::bounded::<f32>(128);

        // Allocate atomic memory for some shared state (like playback time)
        let playback_time = Arc::new(AtomicU64::new(0));

        // Set up CPAL.
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("no output device available");

        let selected_device = device
            .description()
            .map_or("Default Device".to_string(), |m| m.name().to_string());

        let config = device
            .default_output_config()
            .expect("Couldn't load config");

        let sample_rate = config.sample_rate();

        // Create the messaging layer between UI and AudioEngine
        let messaging = AudioEngineMessaging::new(
            app.app_handle().clone(),
            producer,
            waveform_consumer,
            playback_time.clone(),
            sample_rate,
        );
        app.manage(messaging);

        let mut engine = Self {
            app: app.app_handle().clone(),
            config,
            stream: None,
            selected_device,
            consumer,
            playback_time,
            waveform_producer,
        };

        engine.create_audio_stream(device);

        engine
    }

    fn create_audio_stream(
        &mut self,
        device: cpal::Device,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Create a new audio config for this specific device
        self.config = device.default_output_config().map_err(|e| e.to_string())?;

        // Figure out output buffer size
        // We use this to allocate memory for "scratch" buffers (like one for each track)
        let buffer_size_result = self.config.buffer_size();
        let buffer_size =
            if let cpal::SupportedBufferSize::Range { min: _, max } = buffer_size_result {
                (*max as usize).min(MAX_CALLBACK_FRAMES)
            } else {
                MAX_CALLBACK_FRAMES
            };

        // Create a mixer
        let mut mixer = Mixer::new(buffer_size);

        let sample_rate = self.config.sample_rate();

        let channels = self.config.channels() as usize;
        let mut cloned_consumer = self.consumer.clone();
        let mut waveform_producer = self.waveform_producer.clone();
        let playback_time_clone = self.playback_time.clone();
        let local_config = &self.config.clone();

        let app_handle = self.app.clone();

        let stream = match self.config.sample_format() {
            cpal::SampleFormat::F32 => device
                .build_output_stream(
                    local_config.config(),
                    move |output: &mut [f32], _| {
                        let playback_time_local_clone = playback_time_clone.clone();
                        // Run the mixer which runs any commands and
                        // combines samples into one signal,
                        // then overrides the output signal with it
                        mixer.run_commands(&mut cloned_consumer);
                        mixer.process(
                            output,
                            channels,
                            sample_rate,
                            &mut waveform_producer,
                            playback_time_local_clone,
                        );
                    },
                    move |err| {
                        eprintln!("couldn't build audio stream: {err}");
                        send_notification(
                            app_handle.clone(),
                            "Couldn't build audio stream".to_string(),
                            err.to_string(),
                            NotificationType::Error,
                        );
                    },
                    None,
                )
                .expect("couldn't build audio stream"),
            cpal::SampleFormat::I16 => todo!(),
            cpal::SampleFormat::U16 => todo!(),
            cpal::SampleFormat::I8 => todo!(),
            cpal::SampleFormat::I24 => todo!(),
            cpal::SampleFormat::I32 => todo!(),
            cpal::SampleFormat::I64 => todo!(),
            cpal::SampleFormat::U8 => todo!(),
            cpal::SampleFormat::U32 => todo!(),
            cpal::SampleFormat::U64 => todo!(),
            cpal::SampleFormat::F64 => todo!(),
            _ => todo!(),
        };

        stream.play().expect("Couldn't play");

        self.stream = Some(stream);

        Ok(())
    }

    pub fn create_stream_for_device_name(
        &mut self,
        device_name: String,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let host = cpal::default_host();

        // Find the device by name...
        let device = host
            .output_devices()
            .map_err(|e| e.to_string())?
            .find(|d| {
                d.description()
                    .map_or("".to_string(), |m| m.name().to_string())
                    == device_name
            })
            .ok_or("Device not found")?;

        // Recreate the stream using the engine's existing context
        self.create_audio_stream(device)
            .map_err(|e| e.to_string())?;

        self.selected_device = device_name;

        println!("Changed audio device to {}", self.selected_device);

        Ok(())
    }
}

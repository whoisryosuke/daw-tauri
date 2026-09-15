use std::{
    collections::HashMap,
    println,
    sync::{
        atomic::{
            AtomicBool, AtomicU64, AtomicUsize,
            Ordering::{self, Relaxed},
        },
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    Device, SampleRate, SupportedBufferSize, SupportedStreamConfig,
};
use crossbeam::channel::{Receiver, Sender};
use slab::Slab;
use tauri::{window::Effect, AppHandle, Emitter, Manager};

use crate::{
    asset_store::AssetStore,
    audio_buffer::AudioBuffer,
    audio_cache::AudioCache,
    audio_node::{AudioNode, AudioNodeTypes, EffectNodeTypes, SampleNode, SynthNode, VstNode},
    composition::{CompositionStore, Track, TrackClip, TrackClipRange, TrackClipType, TrackType},
    math::seconds_to_frames,
    music::sampler::Sampler,
    utils::notification_system::{send_notification, NotificationType},
    vst::vst_cache::VstPluginInstance,
};

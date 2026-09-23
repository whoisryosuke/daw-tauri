use tauri::{async_runtime::Mutex, State};

use crate::cache::media_cache::{AudioCache, MediaCacheError};

/// Gets multi-channel waveform data from a specific sample in `AudioCache`
#[tauri::command(async)]
pub async fn get_sample_waveform(
    audio_cache: State<'_, Mutex<AudioCache>>,
    path: String,
    size: usize,
) -> Result<Vec<Vec<f32>>, MediaCacheError> {
    let audio_cache = audio_cache
        .try_lock()
        .map_err(|_| MediaCacheError::LockError)?;
    let buffer = audio_cache
        .get_buffer_by_id(&path)
        .ok_or(MediaCacheError::MediaNotFound)?;
    let mut result = Vec::new();

    let original_length = buffer.samples.len();
    let single_channel_length = original_length / buffer.channel_count;

    // We use f64 for steps to have higher sampling accuracy
    let step = (single_channel_length as f64) / (size as f64);

    // Loop over each channel and get data
    for channel_index in 0..buffer.channel_count {
        let mut waveform = Vec::with_capacity(size);

        // Reduce to necessary size (aka "sample" the samples)
        for index in (0..size) {
            let float_index =
                (index as f64 * step * buffer.channel_count as f64) + (channel_index as f64);
            let buffer_index = float_index.floor() as usize;

            // Safety check: ensure we don't go out of bounds due to rounding
            if buffer_index < buffer.samples.len() {
                waveform.push(buffer.samples[buffer_index]);
            } else {
                waveform.push(0.0);
            }
        }

        result.push(waveform);
    }

    Ok(result)
}

use std::ops::{Add, Sub, Mul, Div};
use std::cmp::PartialOrd;

pub fn clamp<Number: PartialOrd>(input: Number, min: Number, max: Number) -> Number {
    if input < min {
        min
    } else {
        if  input > max {
            max
        } else {
            input
        }
    }
}

pub fn map_range<Number>(current: Number, in_min: Number, in_max: Number, out_min: Number, out_max: Number) -> Number where
    Number: Copy + PartialOrd + Sub<Output = Number> + Mul<Output = Number> + Div<Output = Number> + Add<Output = Number>,
 {
    let mapped = ((current - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    return clamp(mapped, out_min, out_max);
}

// Audio Math


/// Convert seconds to frames based on sample rate
pub fn seconds_to_frames(seconds: f64, sample_rate: u32, channel_count: usize) -> Result<u64, String> {
    if seconds < 0.0 {
        return Err("Seconds cannot be negative".to_string());
    }
    if sample_rate == 0 {
        return Err("Sample rate cannot be zero".to_string());
    }

    let frame_count = (seconds * sample_rate as f64).round();
    
    Ok((frame_count * channel_count as f64) as u64)
}
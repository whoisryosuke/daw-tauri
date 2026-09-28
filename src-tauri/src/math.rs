use std::cmp::PartialOrd;
use std::ops::{Add, Div, Mul, Sub};

pub fn clamp<Number: PartialOrd>(input: Number, min: Number, max: Number) -> Number {
    if input < min {
        min
    } else {
        if input > max {
            max
        } else {
            input
        }
    }
}

pub fn map_range<Number>(
    current: Number,
    in_min: Number,
    in_max: Number,
    out_min: Number,
    out_max: Number,
) -> Number
where
    Number: Copy
        + PartialOrd
        + Sub<Output = Number>
        + Mul<Output = Number>
        + Div<Output = Number>
        + Add<Output = Number>,
{
    let mapped = ((current - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    return clamp(mapped, out_min, out_max);
}

// Audio Math

/// Convert seconds to frames based on sample rate
pub fn seconds_to_frames(seconds: f64, sample_rate: u32) -> Result<u64, String> {
    if seconds < 0.0 {
        return Err("Seconds cannot be negative".to_string());
    }
    if sample_rate == 0 {
        return Err("Sample rate cannot be zero".to_string());
    }

    let frame_count = (seconds * sample_rate as f64).round() as u64;

    Ok(frame_count)
}

/// Convert frames to seconds based on sample rate
pub fn frames_to_seconds(frames: u64, sample_rate: u32) -> Result<f64, String> {
    if frames < 0 {
        return Err("Seconds cannot be negative".to_string());
    }
    if sample_rate == 0 {
        return Err("Sample rate cannot be zero".to_string());
    }

    let sample_rate = sample_rate as u64;
    let seconds = (frames / sample_rate) as f64;

    Ok(seconds)
}

/// Interpolate audio samples using the Hermite algo
pub fn hermite_interpolate(y0: f32, y1: f32, y2: f32, y3: f32, fractional_part: f32) -> f32 {
    let c0 = y1;
    let c1 = 0.5 * (y2 - y0);
    let c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
    let c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

    // Multiply out using Horner's method for optimal CPU usage
    ((c3 * fractional_part + c2) * fractional_part + c1) * fractional_part + c0
}

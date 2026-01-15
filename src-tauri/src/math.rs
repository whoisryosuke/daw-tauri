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
@vertex
fn vs_main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
    // The input 'position' is generally normalized (0 to 1)
    // We multiply it by the canvas dimensions to map it to screen space
    var out_pos: vec4<f32>;
    out_pos.x = position.x * 2.0 - 1.0; // Map X (0->1) to screen width [-1, 1]
    out_pos.y = position.y; // Map Y (-1->1 range)
    out_pos.z = 0.0;
    out_pos.w = 1.0;
    return out_pos;
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return vec4<f32>(0.0, 0.0, 1.0, 1.0); 
}
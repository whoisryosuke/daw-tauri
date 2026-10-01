struct U {
  viewStart: f32,   // first visible sample
  spp: f32,         // samples per pixel (device px)
  width: f32, height: f32,
  channels: f32, blocksPerCh: f32, blockSize: f32,
  mirror: f32,      // 1 = symmetric around center, 0 = true min/max
  fillColor: vec4f,
};
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> peaks: array<vec2f>;

struct VOut { @builtin(position) pos: vec4f, @location(0) color: vec4f };

@vertex fn vs_main(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VOut {
  var out: VOut;
  out.pos = vec4f(2.0, 2.0, 0.0, 1.0);          // default: offscreen (culled)
  out.color = u.fillColor;
  let w = u32(u.width);
  if (w == 0u) { return out; }
  let col = ii % w;
  let ch = ii / w;
  if (f32(ch) >= u.channels) { return out; }

  // Which samples / peak blocks does this pixel column cover?
  let s0 = u.viewStart + f32(col) * u.spp;
  let s1 = s0 + u.spp;
  let nb = u32(u.blocksPerCh);
  if (nb == 0u) { return out; }
  let b0f = floor(s0 / u.blockSize);
  if (b0f < 0.0 || u32(b0f) >= nb) { return out; }
  let b0 = u32(b0f);
  let b1 = min(nb, max(b0 + 1u, u32(ceil(s1 / u.blockSize))));

  // Reduce blocks -> min/max for this column
  var lo = 1e9; var hi = -1e9;
  let base = ch * nb;
  for (var b = b0; b < b1; b++) {
    let p = peaks[base + b];
    lo = min(lo, p.x); hi = max(hi, p.y);
  }
  if (u.mirror > 0.5) { let a = max(abs(lo), abs(hi)); lo = -a; hi = a; }

  // Lane layout: channels stacked vertically, pixel space
  let laneH = u.height / u.channels;
  let cy = (f32(ch) + 0.5) * laneH;
  let half = laneH * 0.5 * 0.92;
  var top = cy - hi * half;
  var bot = cy - lo * half;
  if (bot - top < 1.0) { let m = (top + bot) * 0.5; top = m - 0.5; bot = m + 0.5; }  // keep silence visible

  // Triangle strip: 0=(L,top) 1=(R,top) 2=(L,bot) 3=(R,bot)
  let x = f32(col) + f32(vi & 1u);
  let y = select(top, bot, vi >= 2u);
  out.pos = vec4f(x / u.width * 2.0 - 1.0, 1.0 - y / u.height * 2.0, 0.0, 1.0);
  return out;
}

@fragment fn fs_main(in: VOut) -> @location(0) vec4f { return in.color; }

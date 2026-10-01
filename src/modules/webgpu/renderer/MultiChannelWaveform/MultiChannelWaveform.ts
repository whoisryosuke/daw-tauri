import WebGPUManager from "../../WebGPUManager";
import shaderCode from "./MultiChannelWaveform.wgsl?raw";

export type RgbaFloat = [number, number, number, number];

// U struct: 8 floats + vec4 fillColor = 48 bytes (fillColor offset 32 is 16-aligned).
const UNIFORM_SIZE = 48;
// Placeholder storage so the bind group is valid before the first setData().
const PLACEHOLDER_PEAK_BYTES = 16;
// Aim for roughly this many peak blocks per channel; keeps the per-column
// shader loop to 1-2 blocks for the typical 512-sample clip preview while
// scaling gracefully if larger buffers arrive later.
const TARGET_BLOCKS_PER_CHANNEL = 512;

export interface MultiChannelWaveformOptions {
  mirror?: boolean;
  fillColor?: RgbaFloat;
}

/**
 * Build one (min, max) pair per BLOCK samples, per channel.
 */
export function buildPeaks(
  channels: Float32Array[],
  blockSize: number,
): { peaks: Float32Array; blocksPerCh: number } {
  const sampleCount = channels[0]?.length ?? 0;
  const blocksPerCh = Math.max(1, Math.ceil(sampleCount / blockSize));
  const peaks = new Float32Array(channels.length * blocksPerCh * 2);
  channels.forEach((data, ch) => {
    for (let b = 0; b < blocksPerCh; b++) {
      let lo = Infinity;
      let hi = -Infinity;
      const end = Math.min(data.length, (b + 1) * blockSize);
      for (let i = b * blockSize; i < end; i++) {
        const v = data[i]!;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      // Empty trailing block (ragged channel lengths) -> silence.
      if (lo === Infinity) {
        lo = 0;
        hi = 0;
      }
      const o = (ch * blocksPerCh + b) * 2;
      peaks[o] = lo;
      peaks[o + 1] = hi;
    }
  });
  return { peaks, blocksPerCh };
}

/**
 * Multi-channel clip waveform renderer.
 * Procedural instanced quads (one per pixel column per channel) driven by a
 * (min, max) peak buffer — no vertex buffer needed.
 */
export default class MultiChannelWaveform {
  manager!: WebGPUManager;
  context!: GPUCanvasContext;
  canvasElement!: HTMLCanvasElement;
  pipeline!: GPURenderPipeline;
  bindGroup!: GPUBindGroup;
  uniformBuffer!: GPUBuffer;
  peakBuffer: GPUBuffer | null = null;
  peakCapacity = 0;

  channelCount = 0;
  sampleCount = 0;
  blocksPerCh = 0;
  blockSize = 1;
  viewStart = 0;
  viewEnd = 0;
  mirror = 1;
  fillColor: RgbaFloat = [0, 0.5647, 1, 1];

  constructor(
    manager: WebGPUManager,
    canvasElement: HTMLCanvasElement,
    opts?: MultiChannelWaveformOptions,
  ) {
    const context = canvasElement.getContext("webgpu");
    if (!context) {
      throw new Error(
        "Couldn't create a context with canvas element. Please check if your browser supports WebGPU.",
      );
    }

    context.configure({
      device: manager.device,
      format: manager.format,
      alphaMode: "premultiplied",
    });

    const pipeline = manager.setupShaderPipeline(
      "MultiChannelWaveform",
      shaderCode,
      { topology: "triangle-strip", vertexBuffers: [] },
    );
    if (!pipeline) {
      throw new Error("Couldn't create shader and/or render pipeline");
    }

    if (opts?.mirror !== undefined) this.mirror = opts.mirror ? 1 : 0;
    if (opts?.fillColor) this.fillColor = opts.fillColor;

    this.manager = manager;
    this.canvasElement = canvasElement;
    this.context = context;
    this.pipeline = pipeline;

    this.uniformBuffer = manager.device.createBuffer({
      size: UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.peakBuffer = manager.device.createBuffer({
      size: PLACEHOLDER_PEAK_BYTES,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.peakCapacity = PLACEHOLDER_PEAK_BYTES;
    this.bindGroup = this.#createBindGroup();
  }

  #createBindGroup(): GPUBindGroup {
    return this.manager.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: this.peakBuffer! } },
      ],
    });
  }

  /**
   * Upload channel data. Accepts number[][] props directly.
   * @param channels - one array of samples (-1..1) per channel
   * @param blockSize - peak resolution; defaults to ~512 blocks/channel
   */
  setData(channels: ArrayLike<number>[], blockSize?: number) {
    const sampleCount = channels[0]?.length ?? 0;
    if (channels.length === 0 || sampleCount === 0) {
      this.channelCount = 0;
      this.sampleCount = 0;
      this.blocksPerCh = 0;
      this.viewStart = 0;
      this.viewEnd = 0;
      return;
    }

    // Convert each array to Float32Array for buffer
    const data = channels.map((ch) =>
      ch instanceof Float32Array ? ch : Float32Array.from(ch),
    );

    // Get peak magnitude based on block size
    // This is basically interpolating data to a more informative waveform.
    const resolvedBlockSize =
      blockSize ??
      Math.max(1, Math.floor(sampleCount / TARGET_BLOCKS_PER_CHANNEL));
    const { peaks, blocksPerCh } = buildPeaks(data, resolvedBlockSize);

    // Round up to 16 bytes for alignment safety.
    const byteLength = Math.max(
      PLACEHOLDER_PEAK_BYTES,
      Math.ceil(peaks.byteLength / 16) * 16,
    );
    if (byteLength > this.peakCapacity) {
      this.peakBuffer?.destroy();
      this.peakBuffer = this.manager.device.createBuffer({
        size: byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      this.peakCapacity = byteLength;
    }

    // Update buffer
    this.manager.device.queue.writeBuffer(this.peakBuffer!, 0, peaks);
    // (Re)create: required after buffer realloc; cheap otherwise.
    this.bindGroup = this.#createBindGroup();

    // Update uniform props
    this.channelCount = data.length;
    this.sampleCount = sampleCount;
    this.blocksPerCh = blocksPerCh;
    this.blockSize = resolvedBlockSize;
    // Default to the full buffer until setRange() narrows it.
    if (this.viewEnd <= this.viewStart) {
      this.viewStart = 0;
      this.viewEnd = sampleCount;
    } else {
      this.viewStart = Math.min(this.viewStart, sampleCount);
      this.viewEnd = Math.min(Math.max(this.viewEnd, 1), sampleCount);
    }
  }

  /**
   * Crop the visible buffer window:
   */
  setRange(range: ArrayLike<number>, duration: number) {
    if (this.sampleCount === 0 || !duration || duration <= 0) {
      this.viewStart = 0;
      this.viewEnd = this.sampleCount;
      return;
    }
    const [start = 0, end = duration] = Array.from(range);
    const a = Math.max(0, Math.min(1, start / duration)) * this.sampleCount;
    const b = Math.max(0, Math.min(1, end / duration)) * this.sampleCount;
    this.viewStart = Math.min(a, b);
    this.viewEnd = Math.max(a, b);
    if (this.viewEnd <= this.viewStart) {
      this.viewEnd = Math.min(this.sampleCount, this.viewStart + 1);
    }
  }

  setFillColor(color: RgbaFloat) {
    this.fillColor = color;
  }

  setMirror(mirror: boolean) {
    this.mirror = mirror ? 1 : 0;
  }

  #clearOnly() {
    const commandEncoder = this.manager.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    passEncoder.end();
    this.manager.device.queue.submit([commandEncoder.finish()]);
  }

  render = () => {
    // Skip zero-size canvases (e.g. wrapper reports 0x0 on first frame).
    // Without this guard Dawn throws ValidateTextureDescriptor / swapchain errors.
    const canvasWidth = this.canvasElement.width;
    const canvasHeight = this.canvasElement.height;
    if (canvasWidth === 0 || canvasHeight === 0) return;

    if (
      this.channelCount === 0 ||
      this.sampleCount === 0 ||
      this.blocksPerCh === 0 ||
      !this.peakBuffer
    ) {
      this.#clearOnly();
      return;
    }

    const visible = Math.max(1, this.viewEnd - this.viewStart);
    const spp = visible / canvasWidth;

    // Sync uniforms
    this.manager.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      new Float32Array([
        this.viewStart,
        spp,
        canvasWidth,
        canvasHeight,
        this.channelCount,
        this.blocksPerCh,
        this.blockSize,
        this.mirror,
        this.fillColor[0],
        this.fillColor[1],
        this.fillColor[2],
        this.fillColor[3],
      ]),
    );

    const commandEncoder = this.manager.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    // 4 verts = 1 "sliver" of waveform, one instance per pixel column per channel.
    passEncoder.draw(4, canvasWidth * this.channelCount, 0, 0);

    passEncoder.end();
    this.manager.device.queue.submit([commandEncoder.finish()]);
  };

  /**
   * Re-configure the context after the canvas size changes.
   */
  resize() {
    this.context.configure({
      device: this.manager.device,
      format: this.manager.format,
      alphaMode: "premultiplied",
    });
  }

  /**
   * Cleanup memory
   */
  destroy() {
    this.context.unconfigure();
    this.uniformBuffer.destroy();
    this.peakBuffer?.destroy();
    this.peakBuffer = null;
  }
}

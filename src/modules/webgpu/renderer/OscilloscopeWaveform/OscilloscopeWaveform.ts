import WebGPUManager from "../../WebGPUManager";
import shaderCode from "./OscilloscopeWaveform.wgsl?raw";

const BYTES_PER_VERTEX = 2 * 4; // float32x2

export default class OscilloscopeWaveform {
  manager!: WebGPUManager;
  context!: GPUCanvasContext;
  canvasElement!: HTMLCanvasElement;
  pipeline!: GPURenderPipeline;
  vertexBuffer!: GPUBuffer;
  // Max vertices the buffer can hold
  vertexCapacity!: number;
  // The actual number of vertices we're rendering (based on flucuating data length)
  vertexCount!: number;
  animated: boolean = false;
  // #animationRef: () => void | null = null;

  constructor(
    manager: WebGPUManager,
    canvasElement: HTMLCanvasElement,
    data: Float32Array,
    animated?: boolean,
    maxSamples = 2048,
  ) {
    // Create the context using the specific canvas
    const context = canvasElement.getContext("webgpu");
    if (!context) {
      throw new Error(
        "Couldn't create a context with canvas element. Please check if your browser supports WebGPU.",
      );
    }

    // Configure the WebGPU context to match the canvas size
    context.configure({
      device: manager.device,
      format: manager.format,
      alphaMode: "premultiplied",
    });

    // Create shader and pipeline
    const pipeline = manager.setupShaderPipeline(
      "OscilloscopeWaveform",
      shaderCode,
      {
        topology: "line-strip",
        vertexBuffers: [
          {
            arrayStride: BYTES_PER_VERTEX,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x2",
              },
            ],
          },
        ],
      },
    );
    if (!pipeline) {
      throw new Error("Couldn't create shader and/or render pipeline");
    }

    this.manager = manager;
    this.canvasElement = canvasElement;
    this.context = context;
    this.pipeline = pipeline;
    this.vertexCapacity = Math.max(data.length / 2, maxSamples);
    if (animated) this.animated = animated;

    // Allocate for max capacity so live `amplitude.length` changes
    // don't require reallocation on every update.
    this.vertexBuffer = manager.device.createBuffer({
      size: this.vertexCapacity * BYTES_PER_VERTEX,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    // Write the initial data into the GPU buffer
    new Float32Array(this.vertexBuffer.getMappedRange()).set(data);
    this.vertexBuffer.unmap();
    this.vertexCount = data.length / 2;
  }

  render = () => {
    // Skip zero-size canvases (e.g. wrapper reports 0x0 on first frame).
    // Without this guard Dawn throws ValidateTextureDescriptor / swapchain errors.
    if (this.canvasElement.width === 0 || this.canvasElement.height === 0) {
      return;
    }

    const commandEncoder = this.manager.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    // Start the drawing pass
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 }, // Black background
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    // Set the pipeline
    passEncoder.setPipeline(this.pipeline);

    // Set the vertex buffer data
    passEncoder.setVertexBuffer(0, this.vertexBuffer);

    // Draw all the points (vertices).
    // With 'line-strip' topology this connects them into a waveform.
    passEncoder.draw(this.vertexCount, 1, 0, 0);

    // End the pass and submit commands
    passEncoder.end();
    this.manager.device.queue.submit([commandEncoder.finish()]);
  };

  // startLoop() {
  //   this.animated = true;
  //   this.#animationRef = this.manager.addAnimation(this.render);
  // }

  // stopLoop() {
  //   this.animated = false;
  //   if (this.#animationRef != null) this.#animationRef();
  // }

  /**
   * Re-configure the context after the canvas size changes.
   */
  resize() {
    this.context.configure({
      device: this.manager.device,
      format: this.manager.format,
    });
  }

  /**
   * Update waveform data
   * @param data - Waveform data in X/Y format (x = time 0->1, y = amplitude -1->1)
   */
  update(data: Float32Array) {
    const count = data.length / 2;
    // Grow the buffer if a larger-than-expected payload arrives.
    if (count > this.vertexCapacity) {
      this.vertexBuffer.destroy();
      this.vertexCapacity = count;
      this.vertexBuffer = this.manager.device.createBuffer({
        size: this.vertexCapacity * BYTES_PER_VERTEX,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
    }
    this.manager.device.queue.writeBuffer(this.vertexBuffer, 0, data);
    this.vertexCount = count;
  }

  /**
   * Cleanup memory
   */
  destroy() {
    // this.stopLoop();
    this.context.unconfigure();
    this.vertexBuffer.destroy();
  }
}

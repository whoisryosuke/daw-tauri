import WebGPUManager from "../../WebGPUManager";
import shaderCode from "./OscilloscopeWaveform.wgsl?raw";

export default class OscilloscopeWaveform {
  manager!: WebGPUManager;
  context!: GPUCanvasContext;
  pipeline!: GPURenderPipeline;
  vertexBuffer!: GPUBuffer;
  vertexCount!: number;
  animated: boolean = false;

  constructor(
    manager: WebGPUManager,
    canvasElement: HTMLCanvasElement,
    data: Float32Array,
    animated?: boolean,
  ) {
    // Create the context using the specific canvas
    const context = canvasElement.getContext("webgpu");
    if (!context) {
      throw new Error(
        "Couldn't create a context with canvas element. Please check if your browser supports WebGPU.",
      );
    }

    // Configure the WebGPU context to match the canvas size
    const config = {
      device: manager.device,
      format: manager.format,
    };
    context.configure(config);

    // Create shader and pipeline
    let pipeline = manager.setupShaderPipeline(
      "OscilloscopeWaveform",
      shaderCode,
      {
        topology: "line-strip",
        vertexBuffers: [
          {
            arrayStride: 2 * 4, // 2 floats * 4 bytes/float
            attributes: [
              {
                shaderLocation: 0, // Input position attribute
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

    const bufferSize = data.length * data.BYTES_PER_ELEMENT;

    // Create vertex buffer
    const vertexBuffer = manager.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    // Write the data into the GPU buffer
    new Float32Array(vertexBuffer.getMappedRange()).set(data);
    vertexBuffer.unmap();

    this.manager = manager;
    this.context = context;
    this.pipeline = pipeline;
    this.vertexBuffer = vertexBuffer;
    this.vertexCount = data.length / 2; // Assuming X/Y coordinates
    if (animated) this.animated = animated;
  }

  render() {
    const commandEncoder = this.manager.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    // Start the drawing pass
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }, // Black background
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
    // We draw N points, and since topology is 'line-list', it connects them.
    passEncoder.draw(this.vertexCount, 1, 0, 0);

    // End the pass and submit commands
    passEncoder.end();
    this.manager.device.queue.submit([commandEncoder.finish()]);

    // Loop request for smooth animation/redrawing
    if (this.animated) requestAnimationFrame(this.render);
  }

  update(data: Float32Array) {
    this.manager.device.queue.writeBuffer(this.vertexBuffer, 0, data);
  }
}

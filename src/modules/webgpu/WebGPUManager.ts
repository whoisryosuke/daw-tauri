import { requestWebGPUDevice } from "./webgpu-utils";

interface RenderPipelineConfig {
  /**
   * Defaults to triangle-strip
   */
  topology?: GPUPrimitiveTopology;
  vertexBuffers?: GPUVertexBufferLayout[];
}

export default class WebGPUManager {
  device!: GPUDevice;
  adapter!: GPUAdapter;
  format = navigator.gpu.getPreferredCanvasFormat();

  // Cache for shaders
  shaderCache: Map<string, GPUShaderModule> = new Map();
  // Cache for render pipelines
  #pipelineCache: Map<string, GPURenderPipeline> = new Map();

  /**
   * Initialize the renderer and required dependencies. Run this first.
   */
  async init() {
    // See if user supports WebGPU and get "device"
    const result = await requestWebGPUDevice();
    if (!result) {
      throw new Error(
        "Couldn't create WebGPU device. See error log for details.",
      );
    }

    // Store the device locally
    this.device = result.device;
    this.adapter = result.adapter;
  }

  setupShaderPipeline(
    name: string,
    shaderCode: string,
    renderPipelineConfig: RenderPipelineConfig,
  ) {
    this.loadShader(name, shaderCode);
    this.createRenderPipeline(name, renderPipelineConfig);

    return this.getRenderPipeline(name);
  }

  loadShader(name: string, shaderCode: string) {
    const shaderModule = this.device.createShaderModule({
      label: name,
      code: shaderCode,
    });
    this.shaderCache.set(name, shaderModule);
  }

  createRenderPipeline(shaderKey: string, config: RenderPipelineConfig) {
    const shaderModule = this.shaderCache.get(shaderKey);
    if (!shaderModule) {
      console.error("Couldn't find that shader");
      return;
    }
    const renderPipeline = this.device.createRenderPipeline({
      label: shaderKey,
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: config.vertexBuffers,
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: config.topology ?? "triangle-strip",
        cullMode: "none",
      },
    });

    this.#pipelineCache.set(shaderKey, renderPipeline);
  }

  getRenderPipeline(key: string) {
    return this.#pipelineCache.get(key);
  }
}

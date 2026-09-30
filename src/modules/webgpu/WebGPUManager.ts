import { requestWebGPUDevice } from "./webgpu-utils";

interface RenderPipelineConfig {
  /**
   * Defaults to triangle-strip
   */
  topology?: GPUPrimitiveTopology;
  vertexBuffers?: GPUVertexBufferLayout[];
}

type RenderCallback = (deltaTime: number, currentTime: number) => void;

export default class WebGPUManager {
  device!: GPUDevice;
  adapter!: GPUAdapter;
  format = navigator.gpu.getPreferredCanvasFormat();

  // Cache for shaders
  shaderCache: Map<string, GPUShaderModule> = new Map();
  // Cache for render pipelines
  #pipelineCache: Map<string, GPURenderPipeline> = new Map();

  // Animation logic
  #callbacks = new Set<RenderCallback>();
  #running = false;
  #lastTime = 0;

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

    // Shader compilation errors are async — log them so WGSL typos are loud
    // instead of failing silently with a blank canvas.
    shaderModule.getCompilationInfo().then((info) => {
      for (const message of info.messages) {
        const formatted = `[WebGPU][${name}][${message.type}] line ${message.lineNum}:${message.linePos} ${message.message}`;
        if (message.type === "error") {
          console.error(formatted);
        } else {
          console.warn(formatted);
        }
      }
    });
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

  /**
   * Registers render callback to run during animation loop. Also starts animation loop.
   * @param fn - Callback (e.g. `const callback = (deltaTime, now) => {}`)
   * @returns
   */
  addAnimation(fn: RenderCallback): () => void {
    this.#callbacks.add(fn);
    this.#start();
    return () => this.#callbacks.delete(fn); // call to unsubscribe
  }

  #start() {
    if (this.#running) return;
    this.#running = true;
    this.#lastTime = performance.now(); // avoids a huge first dt after idling
    requestAnimationFrame(this.#frame);
  }

  #frame = (now: number) => {
    const dt = (now - this.#lastTime) / 1000;
    this.#lastTime = now;

    // Loop through render callbacks and run them
    for (const fn of this.#callbacks) fn(dt, now);

    // Do we have callbacks? Run loop
    if (this.#callbacks.size) requestAnimationFrame(this.#frame);
    else this.#running = false; // stop looping when nothing is registered
  };
}

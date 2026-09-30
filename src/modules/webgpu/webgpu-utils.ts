export async function requestWebGPUDevice() {
  // Setup adapter and device
  const adapter = await window.navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error(
      "[DEVICE] Couldn't create an adapter. Please check if your browser supports WebGPU.",
    );
    return;
  }
  const device = await adapter.requestDevice();

  device.lost.then(() => handleLostDevice);

  return { device, adapter };
}

function handleLostDevice() {
  console.error("[DEVICE] Lost WebGPU device. Trying to recreate...");

  requestWebGPUDevice();
}

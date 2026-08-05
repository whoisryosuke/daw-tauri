export const DEFAULT_PPQ = 960;

/**
 * Get musical time notation (Ticks / Beats / Bars) from frame-based time (frames * sample rate)
 * @param currentSample - Current "frame" (aka playback time in store)
 * @param sampleRate
 * @param bpm - How fast "tempo" is of song
 * @param ppq - Precision of grid placement. The higher, the more precise. 960 is standard. 480 for low, 1920 for high.
 * @param timeSignature - 4/4
 * @returns
 */
export function getMusicalTime(
  currentSample: number,
  sampleRate: number,
  bpm: number,
  ppq: number,
  timeSignature: number,
) {
  // Get total ticks
  const totalTicks = Math.floor(
    (currentSample * bpm * ppq) / (60 * sampleRate),
  );

  const ticks = totalTicks % ppq;
  const totalBeatsPassed = Math.floor(totalTicks / ppq);
  const beatInBar = (totalBeatsPassed % timeSignature) + 1;

  const barsPassed = Math.floor(totalBeatsPassed / timeSignature);
  const barNumber = barsPassed + 1;

  return [barNumber, beatInBar, ticks];
}

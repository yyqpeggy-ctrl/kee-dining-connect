/**
 * Browser-native video trimming & merging using Canvas + MediaRecorder.
 * No SharedArrayBuffer or special headers needed.
 */

export interface TrimSegment {
  videoUrl: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

/**
 * Get video duration from a blob URL
 */
export function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      resolve(video.duration);
      video.src = "";
    };
    video.onerror = () => resolve(0);
    setTimeout(() => resolve(0), 8000);
  });
}

/**
 * Record a single video segment (startTime → endTime) by drawing
 * frames from a <video> onto a <canvas> and capturing via MediaRecorder.
 */
function recordSegment(
  segment: TrimSegment,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  fps: number = 30,
): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true; // avoid autoplay restrictions
    video.playsInline = true;
    video.preload = "auto";
    video.src = segment.videoUrl;

    const chunks: Blob[] = [];
    let animFrameId: number | null = null;

    video.onloadeddata = () => {
      // Resize canvas to match video
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      video.currentTime = segment.startTime;
    };

    video.onseeked = () => {
      // Start playback from the seek point
      video.play().catch(reject);
    };

    video.onplay = () => {
      const stream = canvas.captureStream(fps);

      // Try to add audio track if available
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      } catch {
        // No audio - that's fine
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4_000_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        video.pause();
        video.src = "";
        resolve(chunks);
      };

      recorder.onerror = (e) => {
        reject(new Error("MediaRecorder error"));
      };

      recorder.start();

      const drawFrame = () => {
        if (video.currentTime >= segment.endTime || video.ended) {
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        animFrameId = requestAnimationFrame(drawFrame);
      };
      drawFrame();
    };

    video.onerror = () => reject(new Error(`Failed to load video: ${segment.videoUrl}`));
  });
}

/**
 * Trim and merge video segments into a single output.
 * Uses Canvas + MediaRecorder (works in all modern browsers without special headers).
 * Returns a blob URL for the merged output (webm format).
 */
export async function trimAndMerge(
  segments: TrimSegment[],
  onProgress?: (pct: number) => void
): Promise<string> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create canvas context");

  const allChunks: Blob[] = [];
  const totalSegments = segments.length;

  for (let i = 0; i < totalSegments; i++) {
    onProgress?.(Math.round(((i) / totalSegments) * 80));
    
    const chunks = await recordSegment(segments[i], canvas, ctx);
    allChunks.push(...chunks);
    
    onProgress?.(Math.round(((i + 1) / totalSegments) * 80));
  }

  onProgress?.(90);

  // Combine all chunks into a single blob
  const outputBlob = new Blob(allChunks, { type: "video/webm" });
  
  onProgress?.(100);

  return URL.createObjectURL(outputBlob);
}

/**
 * Auto-generate trim segments to fit a target duration.
 * Splits the target duration proportionally across videos.
 */
export async function autoTrimSegments(
  videoUrls: string[],
  targetDurationSec: number
): Promise<TrimSegment[]> {
  const durations = await Promise.all(videoUrls.map(getVideoDuration));
  const totalDuration = durations.reduce((a, b) => a + b, 0);

  if (totalDuration <= targetDurationSec) {
    return videoUrls.map((url, i) => ({
      videoUrl: url,
      startTime: 0,
      endTime: durations[i],
    }));
  }

  const segments: TrimSegment[] = [];
  for (let i = 0; i < videoUrls.length; i++) {
    const proportion = durations[i] / totalDuration;
    const segDuration = Math.max(2, targetDurationSec * proportion);
    const midPoint = durations[i] / 2;
    const halfSeg = segDuration / 2;
    const startTime = Math.max(0, midPoint - halfSeg);
    const endTime = Math.min(durations[i], startTime + segDuration);

    segments.push({
      videoUrl: videoUrls[i],
      startTime: Math.round(startTime * 10) / 10,
      endTime: Math.round(endTime * 10) / 10,
    });
  }

  return segments;
}

/**
 * Extract the "best" frame from a video as a data URL.
 * Samples multiple positions and picks the frame with highest visual complexity
 * (approximated by color variance on a downscaled canvas).
 */
export async function extractBestFrame(
  videoUrl: string,
  sampleCount: number = 5,
): Promise<string> {
  const duration = await getVideoDuration(videoUrl);
  if (duration <= 0) throw new Error("Cannot read video duration");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Sample positions: avoid first/last 10%, pick evenly spaced points
  const start = duration * 0.1;
  const end = duration * 0.9;
  const step = (end - start) / (sampleCount - 1);
  const times = Array.from({ length: sampleCount }, (_, i) => start + step * i);

  let bestDataUrl = "";
  let bestScore = -1;

  for (const time of times) {
    const dataUrl = await captureFrameAt(videoUrl, time, canvas, ctx);
    const score = computeFrameScore(ctx, canvas.width, canvas.height);
    if (score > bestScore) {
      bestScore = score;
      bestDataUrl = dataUrl;
    }
  }

  return bestDataUrl;
}

function captureFrameAt(
  videoUrl: string,
  time: number,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;

    video.onloadeddata = () => {
      canvas.width = Math.min(video.videoWidth, 1280);
      canvas.height = Math.min(video.videoHeight, 720);
      video.currentTime = time;
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      video.src = "";
      resolve(dataUrl);
    };

    video.onerror = () => reject(new Error("Failed to load video for frame extraction"));
    setTimeout(() => reject(new Error("Frame extraction timeout")), 10000);
  });
}

/**
 * Compute a "visual complexity" score for the current canvas content.
 * Higher score = more color variation = likely a more interesting frame.
 */
function computeFrameScore(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  // Sample a grid of pixels for performance
  const sampleSize = 32;
  const stepX = Math.max(1, Math.floor(w / sampleSize));
  const stepY = Math.max(1, Math.floor(h / sampleSize));
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  const samples: [number, number, number][] = [];

  for (let y = 0; y < h; y += stepY) {
    for (let x = 0; x < w; x += stepX) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      sumR += r; sumG += g; sumB += b;
      samples.push([r, g, b]);
      count++;
    }
  }

  if (count === 0) return 0;

  const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;

  // Variance as complexity score
  let variance = 0;
  for (const [r, g, b] of samples) {
    variance += (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2;
  }

  // Penalize very dark or very bright frames (likely transitions)
  const brightness = (avgR + avgG + avgB) / 3;
  const brightnessPenalty = brightness < 30 || brightness > 240 ? 0.3 : 1;

  return (variance / count) * brightnessPenalty;
}

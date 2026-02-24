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
 * Audio is captured via AudioContext → MediaStreamDestination.
 */
function recordSegment(
  segment: TrimSegment,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  fps: number = 30,
): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    // IMPORTANT: Do NOT mute - we need audio
    video.muted = false;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.volume = 1;
    video.src = segment.videoUrl;

    const chunks: Blob[] = [];
    let animFrameId: number | null = null;
    let recorder: MediaRecorder | null = null;
    let audioCtx: AudioContext | null = null;

    const cleanup = () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      video.pause();
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
      video.src = "";
    };

    video.onloadeddata = () => {
      // Resize canvas to match video
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      video.currentTime = segment.startTime;
    };

    video.onseeked = () => {
      // Mute the actual speaker output but still capture audio
      // We use a gain node to silence speaker while routing to destination
      video.play().catch((e) => {
        console.warn("[recordSegment] play failed, trying muted:", e);
        video.muted = true;
        video.play().catch(reject);
      });
    };

    video.onplay = () => {
      const canvasStream = canvas.captureStream(fps);

      // Set up audio capture
      try {
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        // Mute speaker output by NOT connecting to audioCtx.destination
        // But still route to the recording destination
        source.connect(dest);
        dest.stream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
        console.log("[recordSegment] Audio track added successfully");
      } catch (e) {
        console.warn("[recordSegment] Audio capture failed:", e);
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

      recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 4_000_000,
        audioBitsPerSecond: 128_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        cleanup();
        resolve(chunks);
      };

      recorder.onerror = () => {
        cleanup();
        reject(new Error("MediaRecorder error"));
      };

      recorder.start(100); // collect data every 100ms for smoother output

      const drawFrame = () => {
        if (video.currentTime >= segment.endTime || video.ended || video.paused) {
          if (recorder && recorder.state === "recording") {
            recorder.stop();
          }
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        animFrameId = requestAnimationFrame(drawFrame);
      };
      drawFrame();
    };

    video.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load video: ${segment.videoUrl}`));
    };

    // Safety timeout: if segment takes too long, force stop
    const maxWait = (segment.endTime - segment.startTime + 10) * 1000;
    setTimeout(() => {
      if (recorder && recorder.state === "recording") {
        console.warn("[recordSegment] Safety timeout, stopping recorder");
        recorder.stop();
      }
    }, maxWait);
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
    
    console.log(`[trimAndMerge] Recording segment ${i + 1}/${totalSegments}: ${segments[i].startTime.toFixed(1)}s - ${segments[i].endTime.toFixed(1)}s`);
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
 * Generate impactful short clips from multiple videos.
 * Instead of taking one long boring segment from each video,
 * this creates multiple short punchy clips (1-3s each) sampled
 * from different high-energy positions throughout each video.
 */
export async function autoTrimSegments(
  videoUrls: string[],
  targetDurationSec: number
): Promise<TrimSegment[]> {
  const durations = await Promise.all(videoUrls.map(getVideoDuration));
  const totalDuration = durations.reduce((a, b) => a + b, 0);

  // If total source is shorter than target, just use everything
  if (totalDuration <= targetDurationSec) {
    return videoUrls.map((url, i) => ({
      videoUrl: url,
      startTime: 0,
      endTime: durations[i],
    }));
  }

  // Calculate how many clips and their duration based on style
  // Short punchy clips (1.5-3s) create more energy and impact
  const clipDuration = targetDurationSec <= 15 ? 1.5 : targetDurationSec <= 30 ? 2 : 2.5;
  const totalClips = Math.max(4, Math.floor(targetDurationSec / clipDuration));
  
  // Distribute clips across videos proportionally
  const segments: TrimSegment[] = [];
  
  for (let i = 0; i < videoUrls.length; i++) {
    const videoDur = durations[i];
    if (videoDur <= 0) continue;
    
    const proportion = videoDur / totalDuration;
    const clipsForThisVideo = Math.max(2, Math.round(totalClips * proportion));
    
    // Skip first and last 5% of video (usually intro/outro)
    const usableStart = videoDur * 0.05;
    const usableEnd = videoDur * 0.95;
    const usableRange = usableEnd - usableStart;
    
    if (usableRange <= clipDuration) {
      // Video too short, take one clip from middle
      segments.push({
        videoUrl: videoUrls[i],
        startTime: Math.max(0, videoDur / 2 - clipDuration / 2),
        endTime: Math.min(videoDur, videoDur / 2 + clipDuration / 2),
      });
      continue;
    }
    
    // Sample positions using golden ratio for visually varied spacing
    const goldenRatio = 0.618033988749895;
    let position = 0.1 + Math.random() * 0.2; // Start at random position 10-30%
    
    for (let c = 0; c < clipsForThisVideo; c++) {
      const startPos = usableStart + (position % 1) * usableRange;
      const startTime = Math.round(startPos * 10) / 10;
      const endTime = Math.round(Math.min(startTime + clipDuration, videoDur) * 10) / 10;
      
      // Only add if clip is meaningful (> 0.5s)
      if (endTime - startTime > 0.5) {
        segments.push({
          videoUrl: videoUrls[i],
          startTime,
          endTime,
        });
      }
      
      position += goldenRatio; // Golden ratio jump for non-repeating distribution
    }
  }
  
  // Interleave clips from different videos for dynamic pacing
  // Sort by video index alternating to avoid all clips from same video in a row
  const interleaved: TrimSegment[] = [];
  const byVideo = new Map<string, TrimSegment[]>();
  for (const seg of segments) {
    const arr = byVideo.get(seg.videoUrl) || [];
    arr.push(seg);
    byVideo.set(seg.videoUrl, arr);
  }
  
  const videoQueues = Array.from(byVideo.values());
  let qi = 0;
  while (interleaved.length < segments.length) {
    const queue = videoQueues[qi % videoQueues.length];
    if (queue.length > 0) {
      interleaved.push(queue.shift()!);
    }
    qi++;
    // Safety: prevent infinite loop
    if (qi > segments.length * 3) break;
  }
  
  // Trim total to target duration
  let accumulated = 0;
  const finalSegments: TrimSegment[] = [];
  for (const seg of interleaved) {
    const segDur = seg.endTime - seg.startTime;
    if (accumulated + segDur > targetDurationSec + 1) break; // allow 1s tolerance
    finalSegments.push(seg);
    accumulated += segDur;
  }
  
  console.log(`[autoTrimSegments] Generated ${finalSegments.length} clips, total ~${accumulated.toFixed(1)}s`);
  return finalSegments;
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

  let variance = 0;
  for (const [r, g, b] of samples) {
    variance += (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2;
  }

  const brightness = (avgR + avgG + avgB) / 3;
  const brightnessPenalty = brightness < 30 || brightness > 240 ? 0.3 : 1;

  return (variance / count) * brightnessPenalty;
}

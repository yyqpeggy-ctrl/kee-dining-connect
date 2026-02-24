/**
 * Browser-native video trimming & merging using Canvas + MediaRecorder.
 * Uses a SINGLE MediaRecorder session across all segments to produce
 * a valid WebM file. No SharedArrayBuffer or special headers needed.
 */

export interface TrimSegment {
  videoUrl: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export interface VideoSubtitle {
  startPct: number;  // 0-100 percentage of total duration
  endPct: number;    // 0-100 percentage of total duration
  zh: string;
  en: string;
}

export interface SubtitleStyle {
  zhFontScale: number;    // multiplier, default 1.0
  enFontScale: number;    // multiplier, default 1.0
  zhColor: string;        // hex color e.g. "#FFFFFF"
  enColor: string;        // hex color e.g. "#FFFFFF"
  bgColor: string;        // hex bg color e.g. "#000000"
  bgOpacity: number;      // 0-1
  position: "bottom" | "top" | "center"; // vertical position
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
 * Load a video element and wait until it's ready to play from a given time.
 */
function loadVideoAt(url: string, startTime: number): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true; // muted for autoplay compliance
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = startTime;
    };

    video.onseeked = () => {
      resolve(video);
    };

    video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
    setTimeout(() => reject(new Error("Video load timeout")), 15000);
  });
}

/**
 * Play a single segment on the canvas, resolves when the segment ends.
 * The video element plays in real-time while we draw frames to canvas.
 */
/**
 * Draw bilingual subtitles onto the canvas.
 */
function drawSubtitles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  subtitle: VideoSubtitle | undefined,
  style?: SubtitleStyle,
) {
  if (!subtitle) return;

  const s = style || {
    zhFontScale: 1, enFontScale: 1,
    zhColor: "#FFFFFF", enColor: "#FFFFFF",
    bgColor: "#000000", bgOpacity: 0.65,
    position: "bottom" as const,
  };

  const zhFontSize = Math.round(h * 0.045 * s.zhFontScale);
  const enFontSize = Math.round(h * 0.032 * s.enFontScale);
  const padding = Math.round(h * 0.015);

  // Measure text
  ctx.font = `bold ${zhFontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  const zhWidth = ctx.measureText(subtitle.zh).width;
  ctx.font = `${enFontSize}px "SF Pro Display", "Helvetica Neue", Arial, sans-serif`;
  const enWidth = ctx.measureText(subtitle.en).width;

  const boxWidth = Math.max(zhWidth, enWidth) + padding * 4;
  const boxHeight = zhFontSize + enFontSize + padding * 3;
  const boxX = (w - boxWidth) / 2;

  // Position
  let boxY: number;
  if (s.position === "top") {
    boxY = Math.round(h * 0.05);
  } else if (s.position === "center") {
    boxY = Math.round((h - boxHeight) / 2);
  } else {
    boxY = h - Math.round(h * 0.08) - boxHeight;
  }

  // Parse hex to rgb for background
  const hexToRgb = (hex: string) => {
    const c = hex.replace("#", "");
    return {
      r: parseInt(c.substring(0, 2), 16) || 0,
      g: parseInt(c.substring(2, 4), 16) || 0,
      b: parseInt(c.substring(4, 6), 16) || 0,
    };
  };
  const bg = hexToRgb(s.bgColor);
  ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${s.bgOpacity})`;

  const radius = 8;
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxWidth - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
  ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
  ctx.lineTo(boxX + radius, boxY + boxHeight);
  ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();

  // Chinese text
  ctx.font = `bold ${zhFontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  ctx.fillStyle = s.zhColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(subtitle.zh, w / 2, boxY + padding);

  // English text
  ctx.font = `${enFontSize}px "SF Pro Display", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = s.enColor;
  ctx.fillText(subtitle.en, w / 2, boxY + padding + zhFontSize + padding * 0.5);
}

function playSegmentOnCanvas(
  video: HTMLVideoElement,
  endTime: number,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  getSubtitle?: () => VideoSubtitle | undefined,
  subtitleStyle?: SubtitleStyle,
): Promise<void> {
  return new Promise((resolve) => {
    // Resize canvas to match video
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const segStart = video.currentTime;
    const segDuration = endTime - segStart;
    const fadeDuration = Math.min(0.4, segDuration * 0.15); // 0.4s or 15% of clip

    let animFrameId: number | null = null;

    const drawFrame = () => {
      if (video.currentTime >= endTime || video.ended || video.paused) {
        video.pause();
        if (animFrameId) cancelAnimationFrame(animFrameId);
        resolve();
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply fade-in / fade-out for smooth transitions
      const elapsed = video.currentTime - segStart;
      const remaining = endTime - video.currentTime;
      let fadeAlpha = 0;
      if (elapsed < fadeDuration) {
        fadeAlpha = 1 - (elapsed / fadeDuration); // fade in from black
      } else if (remaining < fadeDuration) {
        fadeAlpha = 1 - (remaining / fadeDuration); // fade out to black
      }
      if (fadeAlpha > 0.01) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Overlay subtitles
      if (getSubtitle) {
        drawSubtitles(ctx, canvas.width, canvas.height, getSubtitle(), subtitleStyle);
      }
      animFrameId = requestAnimationFrame(drawFrame);
    };

    video.play().then(() => {
      drawFrame();
    }).catch(() => {
      console.warn("[playSegmentOnCanvas] play() failed, skipping segment");
      resolve();
    });

    // Safety timeout
    const maxWait = (endTime - video.currentTime + 5) * 1000;
    setTimeout(() => {
      video.pause();
      if (animFrameId) cancelAnimationFrame(animFrameId);
      resolve();
    }, maxWait);
  });
}

/**
 * Trim and merge video segments into a single output.
 * Uses ONE continuous MediaRecorder session across all segments
 * to produce a valid WebM file.
 * Returns a blob URL for the merged output.
 */
export async function trimAndMerge(
  segments: TrimSegment[],
  onProgress?: (pct: number) => void,
  subtitles?: VideoSubtitle[],
  subtitleStyle?: SubtitleStyle,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create canvas context");

  // Draw a black frame initially so the stream has content
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Create canvas stream
  const fps = 30;
  const canvasStream = canvas.captureStream(fps);

  // Set up audio: we'll create audio context and mix audio from each segment
  let audioCtx: AudioContext | null = null;
  let audioDest: MediaStreamAudioDestinationNode | null = null;

  try {
    audioCtx = new AudioContext();
    audioDest = audioCtx.createMediaStreamDestination();
    audioDest.stream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
    console.log("[trimAndMerge] Audio destination set up");
  } catch (e) {
    console.warn("[trimAndMerge] Audio setup failed:", e);
  }

  // Choose best codec
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm";

  // Start ONE MediaRecorder for the entire output
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
    audioBitsPerSecond: 128_000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Start recording
  recorder.start(200);
  console.log("[trimAndMerge] MediaRecorder started, processing", segments.length, "segments");

  // Calculate total output duration for subtitle percentage mapping
  const totalOutputDuration = segments.reduce((acc, s) => acc + (s.endTime - s.startTime), 0);
  let elapsedTime = 0; // tracks how much output time has been recorded so far

  const totalSegments = segments.length;

  for (let i = 0; i < totalSegments; i++) {
    const seg = segments[i];
    const segElapsedStart = elapsedTime;
    onProgress?.(Math.round((i / totalSegments) * 85));
    console.log(`[trimAndMerge] Segment ${i + 1}/${totalSegments}: ${seg.startTime.toFixed(1)}s - ${seg.endTime.toFixed(1)}s`);

    try {
      // Load & seek the video
      const video = await loadVideoAt(seg.videoUrl, seg.startTime);

      // Connect audio from this video to the shared audio destination
      let audioSource: MediaElementAudioSourceNode | null = null;
      if (audioCtx && audioDest) {
        try {
          audioSource = audioCtx.createMediaElementSource(video);
          audioSource.connect(audioDest);
          console.log(`[trimAndMerge] Audio connected for segment ${i + 1}`);
        } catch (e) {
          console.warn(`[trimAndMerge] Audio connect failed for segment ${i + 1}:`, e);
        }
      }

      // Unmute for audio capture (after createMediaElementSource)
      video.muted = false;
      video.volume = 1;

      // Build subtitle getter that maps current playback to output timeline percentage
      const getSubtitle = subtitles && subtitles.length > 0
        ? () => {
            const currentOutputTime = segElapsedStart + (video.currentTime - seg.startTime);
            const pct = totalOutputDuration > 0 ? (currentOutputTime / totalOutputDuration) * 100 : 0;
            return subtitles.find(s => pct >= s.startPct && pct < s.endPct);
          }
        : undefined;

      // Play segment on canvas (real-time)
      await playSegmentOnCanvas(video, seg.endTime, canvas, ctx, getSubtitle, subtitleStyle);

      // Cleanup video
      if (audioSource) {
        try { audioSource.disconnect(); } catch {}
      }
      video.src = "";
    } catch (e) {
      console.warn(`[trimAndMerge] Segment ${i + 1} failed:`, e);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    elapsedTime += (seg.endTime - seg.startTime);
    onProgress?.(Math.round(((i + 1) / totalSegments) * 85));
  }

  // Stop recording and wait for final data
  onProgress?.(90);

  const outputBlob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
    recorder.stop();
  });

  // Cleanup audio context
  if (audioCtx && audioCtx.state !== "closed") {
    audioCtx.close().catch(() => {});
  }

  onProgress?.(100);
  console.log(`[trimAndMerge] Done! Output size: ${(outputBlob.size / 1024 / 1024).toFixed(1)} MB`);

  return URL.createObjectURL(outputBlob);
}

/**
 * Generate impactful short clips from multiple videos.
 * Creates multiple short punchy clips (1-3s each) sampled
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

  // Use longer, smoother clips for a professional feel
  // Clip duration: 4-6s for longer outputs, 3-4s for shorter ones
  const clipDuration = targetDurationSec <= 15 ? 3 : targetDurationSec <= 30 ? 4 : 5;
  // Fewer clips = less chaotic transitions
  const totalClips = Math.max(3, Math.ceil(targetDurationSec / clipDuration));

  // Distribute clips per video proportionally
  const clipsPer: number[] = videoUrls.map((_, i) => {
    const proportion = durations[i] / totalDuration;
    return Math.max(1, Math.round(totalClips * proportion));
  });

  // For each video, pick sequential segments evenly spaced through the timeline
  // This keeps chronological order within each video for narrative flow
  const segmentsByVideo: TrimSegment[][] = [];
  for (let i = 0; i < videoUrls.length; i++) {
    const videoDur = durations[i];
    if (videoDur <= 0) { segmentsByVideo.push([]); continue; }

    const numClips = clipsPer[i];
    const segments: TrimSegment[] = [];

    // Skip first/last 5% to avoid black frames
    const safeStart = videoDur * 0.05;
    const safeEnd = videoDur * 0.95;
    const safeRange = safeEnd - safeStart;

    if (safeRange <= clipDuration) {
      // Video too short, use the middle portion
      segments.push({
        videoUrl: videoUrls[i],
        startTime: Math.max(0, videoDur / 2 - clipDuration / 2),
        endTime: Math.min(videoDur, videoDur / 2 + clipDuration / 2),
      });
    } else {
      // Evenly space clip start points across the safe range
      const spacing = (safeRange - clipDuration) / Math.max(1, numClips - 1);
      for (let c = 0; c < numClips; c++) {
        const startTime = Math.round((safeStart + c * spacing) * 10) / 10;
        const endTime = Math.round(Math.min(startTime + clipDuration, safeEnd) * 10) / 10;
        if (endTime - startTime >= 1) {
          segments.push({ videoUrl: videoUrls[i], startTime, endTime });
        }
      }
    }
    segmentsByVideo.push(segments);
  }

  // Structured interleave: alternate between videos in round-robin
  // This creates a smooth A-B-A-B pattern instead of chaotic mixing
  const finalSegments: TrimSegment[] = [];
  let accumulated = 0;
  const maxRounds = Math.max(...segmentsByVideo.map(s => s.length));

  for (let round = 0; round < maxRounds; round++) {
    for (let vi = 0; vi < segmentsByVideo.length; vi++) {
      if (round >= segmentsByVideo[vi].length) continue;
      const seg = segmentsByVideo[vi][round];
      const segDur = seg.endTime - seg.startTime;
      if (accumulated + segDur > targetDurationSec + 2) break;
      finalSegments.push(seg);
      accumulated += segDur;
    }
    if (accumulated >= targetDurationSec) break;
  }

  console.log(`[autoTrimSegments] Generated ${finalSegments.length} clips (${clipDuration}s each), total ~${accumulated.toFixed(1)}s`);
  return finalSegments;
}

/**
 * Extract the "best" frame from a video as a data URL.
 */
export async function extractBestFrame(
  videoUrl: string,
  sampleCount: number = 5,
): Promise<string> {
  const duration = await getVideoDuration(videoUrl);
  if (duration <= 0) throw new Error("Cannot read video duration");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

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

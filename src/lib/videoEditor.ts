import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (loadPromise) {
    await loadPromise;
    return ffmpegInstance!;
  }

  ffmpegInstance = new FFmpeg();
  loadPromise = ffmpegInstance.load({
    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js",
    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm",
  }).then(() => {});
  await loadPromise;
  return ffmpegInstance;
}

export interface TrimSegment {
  videoUrl: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

/**
 * Trim and merge video segments into a single output.
 * - Trims each video to the specified time range
 * - Concatenates all trimmed segments
 * - Returns a blob URL for the merged output
 */
export async function trimAndMerge(
  segments: TrimSegment[],
  onProgress?: (pct: number) => void
): Promise<string> {
  const ffmpeg = await getFFmpeg();

  // Progress tracking
  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.(Math.min(Math.round(progress * 100), 99));
  });

  const trimmedFiles: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const inputName = `input_${i}.mp4`;
    const outputName = `trimmed_${i}.mp4`;

    // Write input file
    const fileData = await fetchFile(seg.videoUrl);
    await ffmpeg.writeFile(inputName, fileData);

    // Trim: -ss (start) -to (end) with re-encode for accurate seeking
    const duration = seg.endTime - seg.startTime;
    await ffmpeg.exec([
      "-ss", String(seg.startTime),
      "-i", inputName,
      "-t", String(duration),
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-c:a", "aac",
      "-y",
      outputName,
    ]);

    trimmedFiles.push(outputName);
    // Cleanup input to save memory
    await ffmpeg.deleteFile(inputName);
  }

  let outputBlob: Blob;

  if (trimmedFiles.length === 1) {
    // Single segment, no concat needed
    const data = await ffmpeg.readFile(trimmedFiles[0]);
    outputBlob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
    await ffmpeg.deleteFile(trimmedFiles[0]);
  } else {
    // Create concat file list
    const concatList = trimmedFiles.map(f => `file '${f}'`).join("\n");
    await ffmpeg.writeFile("concat.txt", concatList);

    await ffmpeg.exec([
      "-f", "concat",
      "-safe", "0",
      "-i", "concat.txt",
      "-c", "copy",
      "-y",
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    outputBlob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });

    // Cleanup
    for (const f of trimmedFiles) {
      try { await ffmpeg.deleteFile(f); } catch {}
    }
    try { await ffmpeg.deleteFile("concat.txt"); } catch {}
    try { await ffmpeg.deleteFile("output.mp4"); } catch {}
  }

  return URL.createObjectURL(outputBlob);
}

/**
 * Get video duration from a blob URL
 */
export function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => resolve(video.duration);
    video.onerror = () => resolve(0);
    setTimeout(() => resolve(0), 5000);
  });
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
    // Videos are already short enough, use full duration
    return videoUrls.map((url, i) => ({
      videoUrl: url,
      startTime: 0,
      endTime: durations[i],
    }));
  }

  // Distribute target duration proportionally
  const segments: TrimSegment[] = [];
  for (let i = 0; i < videoUrls.length; i++) {
    const proportion = durations[i] / totalDuration;
    const segDuration = Math.max(2, targetDurationSec * proportion); // min 2 seconds per segment
    // Pick from the middle of each video for "highlights"
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

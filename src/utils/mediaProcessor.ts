/**
 * 媒体处理工具
 * 使用 @webav/av-cliper 提取视频缩略图和音频波形数据
 */
import { MP4Clip, AudioClip } from '@webav/av-cliper';

// 缓存已处理的媒体数据
const thumbnailCache = new Map<string, string[]>();
const waveformCache = new Map<string, number[]>();
const durationCache = new Map<string, number>();

/**
 * 视频缩略图提取结果
 */
export interface ThumbnailResult {
  thumbnails: string[]; // Base64 URL 列表
  duration: number; // 视频时长（秒）
}

/**
 * 音频波形提取结果
 */
export interface WaveformResult {
  waveformData: number[]; // 归一化的波形数据 (0-1)
  duration: number; // 音频时长（秒）
}

/**
 * 从视频中提取缩略图
 * @param videoUrl 视频 URL
 * @param options 配置选项
 * @returns 缩略图结果
 */
export async function extractVideoThumbnails(
  videoUrl: string,
  options: {
    count?: number; // 提取的缩略图数量
    width?: number; // 缩略图宽度
  } = {}
): Promise<ThumbnailResult> {
  const { count = 10, width = 120 } = options;

  // 检查缓存
  const cacheKey = `${videoUrl}_${count}_${width}`;
  if (thumbnailCache.has(cacheKey)) {
    return {
      thumbnails: thumbnailCache.get(cacheKey)!,
      duration: durationCache.get(videoUrl) || 0,
    };
  }

  try {
    // 获取视频数据
    const response = await fetch(videoUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    // 创建 MP4Clip 实例
    const clip = new MP4Clip(response.body);
    await clip.ready;

    // 获取视频时长（微秒转秒）
    const duration = clip.meta.duration / 1e6;

    // 计算缩略图的时间间隔
    const step = (duration * 1e6) / count;

    // 提取缩略图
    const thumbnailResults = await clip.thumbnails(width, {
      start: 0,
      end: duration * 1e6,
      step: Math.max(step, 100000), // 至少 0.1 秒间隔
    });

    // 转换为 Base64 URL
    const thumbnails: string[] = [];
    for (const thumb of thumbnailResults) {
      if (thumb.img) {
        const url = URL.createObjectURL(thumb.img);
        thumbnails.push(url);
      }
    }

    // 销毁 clip
    clip.destroy();

    // 缓存结果
    thumbnailCache.set(cacheKey, thumbnails);
    durationCache.set(videoUrl, duration);

    return { thumbnails, duration };
  } catch (error) {
    console.error('Error extracting thumbnails:', error);
    return { thumbnails: [], duration: 0 };
  }
}

/**
 * 从音频/视频中提取波形数据
 * @param audioUrl 音频/视频 URL
 * @param options 配置选项
 * @returns 波形数据结果
 */
export async function extractAudioWaveform(
  audioUrl: string,
  options: {
    samples?: number; // 采样点数量
  } = {}
): Promise<WaveformResult> {
  const { samples = 100 } = options;

  // 检查缓存
  const cacheKey = `${audioUrl}_${samples}`;
  if (waveformCache.has(cacheKey)) {
    return {
      waveformData: waveformCache.get(cacheKey)!,
      duration: durationCache.get(audioUrl) || 0,
    };
  }

  try {
    // 获取音频数据
    const response = await fetch(audioUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    // 创建 AudioClip 实例
    const clip = new AudioClip(response.body);
    await clip.ready;

    // 获取音频时长
    const duration = clip.meta.duration / 1e6;

    // 获取 PCM 数据
    const pcmData = clip.getPCMData();

    // 处理波形数据
    const waveformData = processWaveformData(pcmData, samples);

    // 销毁 clip
    clip.destroy();

    // 缓存结果
    waveformCache.set(cacheKey, waveformData);
    durationCache.set(audioUrl, duration);

    return { waveformData, duration };
  } catch (error) {
    console.error('Error extracting waveform:', error);
    return { waveformData: [], duration: 0 };
  }
}

/**
 * 从视频中提取音频波形数据
 * @param videoUrl 视频 URL
 * @param options 配置选项
 * @returns 波形数据结果
 */
export async function extractVideoAudioWaveform(
  videoUrl: string,
  options: {
    samples?: number;
  } = {}
): Promise<WaveformResult> {
  const { samples = 100 } = options;

  const cacheKey = `video_audio_${videoUrl}_${samples}`;
  if (waveformCache.has(cacheKey)) {
    return {
      waveformData: waveformCache.get(cacheKey)!,
      duration: durationCache.get(videoUrl) || 0,
    };
  }

  try {
    const response = await fetch(videoUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    // 使用 MP4Clip 来获取视频中的音频
    const clip = new MP4Clip(response.body);
    await clip.ready;

    const duration = clip.meta.duration / 1e6;

    // 通过 tick 方法采样音频数据
    const waveformData: number[] = [];
    const step = (duration * 1e6) / samples;

    for (let i = 0; i < samples; i++) {
      const time = i * step;
      try {
        const { audio } = await clip.tick(Math.floor(time));
        if (audio && audio.length > 0) {
          // 计算这个采样点的音量
          let sum = 0;
          let count = 0;
          for (const channel of audio) {
            for (let j = 0; j < channel.length; j++) {
              sum += Math.abs(channel[j]);
              count++;
            }
          }
          waveformData.push(count > 0 ? sum / count : 0);
        } else {
          waveformData.push(0);
        }
      } catch {
        waveformData.push(0);
      }
    }

    // 归一化
    const maxVal = Math.max(...waveformData, 0.001);
    const normalizedData = waveformData.map((v) => v / maxVal);

    clip.destroy();

    waveformCache.set(cacheKey, normalizedData);
    durationCache.set(videoUrl, duration);

    return { waveformData: normalizedData, duration };
  } catch (error) {
    console.error('Error extracting video audio waveform:', error);
    return { waveformData: [], duration: 0 };
  }
}

/**
 * 处理 PCM 数据为波形数据
 * @param pcmData PCM 数据（多通道）
 * @param samples 目标采样点数量
 * @returns 归一化的波形数据
 */
function processWaveformData(
  pcmData: Float32Array[],
  samples: number
): number[] {
  if (!pcmData || pcmData.length === 0) {
    return new Array(samples).fill(0);
  }

  // 合并所有通道
  const totalLength = pcmData[0].length;
  const mergedData = new Float32Array(totalLength);

  for (let i = 0; i < totalLength; i++) {
    let sum = 0;
    for (const channel of pcmData) {
      sum += Math.abs(channel[i] || 0);
    }
    mergedData[i] = sum / pcmData.length;
  }

  // 下采样到目标数量
  const blockSize = Math.floor(totalLength / samples);
  const waveformData: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalLength);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += mergedData[j];
    }
    waveformData.push(sum / (end - start));
  }

  // 归一化到 0-1 范围
  const maxVal = Math.max(...waveformData, 0.001);
  return waveformData.map((v) => v / maxVal);
}

/**
 * 获取媒体时长
 * @param url 媒体 URL
 * @param type 媒体类型
 * @returns 时长（秒）
 */
export async function getMediaDuration(
  url: string,
  type: 'video' | 'audio'
): Promise<number> {
  // 检查缓存
  if (durationCache.has(url)) {
    return durationCache.get(url)!;
  }

  try {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    if (type === 'video') {
      const clip = new MP4Clip(response.body);
      await clip.ready;
      const duration = clip.meta.duration / 1e6;
      clip.destroy();
      durationCache.set(url, duration);
      return duration;
    } else {
      const clip = new AudioClip(response.body);
      await clip.ready;
      const duration = clip.meta.duration / 1e6;
      clip.destroy();
      durationCache.set(url, duration);
      return duration;
    }
  } catch (error) {
    console.error('Error getting media duration:', error);
    return 0;
  }
}

/**
 * 清除缓存
 */
export function clearMediaCache() {
  // 释放所有 blob URL
  for (const thumbnails of thumbnailCache.values()) {
    for (const url of thumbnails) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
  }
  thumbnailCache.clear();
  waveformCache.clear();
  durationCache.clear();
}

/**
 * 预加载媒体数据
 * @param url 媒体 URL
 * @param type 媒体类型
 */
export async function preloadMedia(
  url: string,
  type: 'video' | 'audio'
): Promise<void> {
  if (type === 'video') {
    await extractVideoThumbnails(url);
  } else {
    await extractAudioWaveform(url);
  }
}

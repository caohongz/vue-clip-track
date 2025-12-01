import type {
  Track,
  MediaClip,
  SubtitleClip,
  FilterClip,
  TransitionClip,
  Clip,
} from '@/types';
import { generateId } from './helpers';

// 生成模拟视频轨道
export function createMockVideoTrack(order: number, isMain = false): Track {
  const clips: MediaClip[] = [
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'video',
      startTime: 0,
      endTime: 5,
      selected: false,
      sourceUrl: '/src/assets/video/bunny_0.mp4',
      originalDuration: 23,
      trimStart: 0,
      trimEnd: 5,
      playbackRate: 1,
      thumbnails: [],
    },
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'video',
      startTime: 6,
      endTime: 12,
      selected: false,
      sourceUrl: '/src/assets/video/bunny_1.mp4',
      originalDuration: 20,
      trimStart: 2,
      trimEnd: 8,
      playbackRate: 1,
      thumbnails: [],
    },
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'video',
      startTime: 15,
      endTime: 20,
      selected: false,
      sourceUrl: '/src/assets/video/bunny_2.mp4',
      originalDuration: 16,
      trimStart: 1,
      trimEnd: 6,
      playbackRate: 1.5,
      thumbnails: [],
    },
  ];

  const track: Track = {
    id: generateId('track-'),
    type: 'video',
    name: isMain ? '主轨道（视频）' : `视频${order}`,
    visible: true,
    locked: false,
    clips: [],
    order,
    isMain,
  };

  clips.forEach((clip) => {
    clip.trackId = track.id;
  });
  track.clips = clips;

  return track;
}

// 生成模拟音频轨道
export function createMockAudioTrack(order: number): Track {
  const clips: MediaClip[] = [
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'audio',
      startTime: 0,
      endTime: 8,
      selected: false,
      sourceUrl: '/src/assets/audio/44.1kHz-2chan.mp3',
      originalDuration: 0, // 将在加载时更新
      trimStart: 0,
      trimEnd: 8,
      playbackRate: 1,
      volume: 0.8,
      waveformData: [], // 将在加载时获取真实波形数据
    },
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'audio',
      startTime: 10,
      endTime: 18,
      selected: false,
      sourceUrl: '/src/assets/audio/16kHz-1chan.mp3',
      originalDuration: 0, // 将在加载时更新
      trimStart: 1,
      trimEnd: 9,
      playbackRate: 1,
      volume: 1.0,
      waveformData: [], // 将在加载时获取真实波形数据
    },
  ];

  const track: Track = {
    id: generateId('track-'),
    type: 'audio',
    name: `音频${order}`,
    visible: true,
    locked: false,
    clips: [],
    order,
  };

  clips.forEach((clip) => {
    clip.trackId = track.id;
  });
  track.clips = clips;

  return track;
}

// 生成模拟字幕轨道
export function createMockSubtitleTrack(order: number): Track {
  const clips: SubtitleClip[] = [
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'subtitle',
      startTime: 1,
      endTime: 3,
      selected: false,
      text: '这是第一段字幕',
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      textAlign: 'center',
    },
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'subtitle',
      startTime: 5,
      endTime: 8,
      selected: false,
      text: '这是第二段字幕，内容更长一些',
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffff00',
      textAlign: 'center',
    },
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'subtitle',
      startTime: 10,
      endTime: 14,
      selected: false,
      text: '最后一段字幕',
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      textAlign: 'center',
    },
  ];

  const track: Track = {
    id: generateId('track-'),
    type: 'subtitle',
    name: `字幕${order}`,
    visible: true,
    locked: false,
    clips: [],
    order,
  };

  clips.forEach((clip) => {
    clip.trackId = track.id;
  });
  track.clips = clips;

  return track;
}

// 生成模拟滤镜轨道
export function createMockFilterTrack(order: number): Track {
  const clips: FilterClip[] = [
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'filter',
      startTime: 2,
      endTime: 6,
      selected: false,
      filterType: 'blur',
      filterValue: 5,
      name: '模糊滤镜',
    },
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'filter',
      startTime: 8,
      endTime: 12,
      selected: false,
      filterType: 'brightness',
      filterValue: 1.5,
      name: '亮度调整',
    },
  ];

  const track: Track = {
    id: generateId('track-'),
    type: 'filter',
    name: `滤镜${order}`,
    visible: true,
    locked: false,
    clips: [],
    order,
  };

  clips.forEach((clip) => {
    clip.trackId = track.id;
  });
  track.clips = clips;

  return track;
}

// 生成完整的模拟数据
export function createMockTracks(enableMainTrackMode = false): Track[] {
  if (enableMainTrackMode) {
    // 主轨道模式：第一条视频轨道为主轨道，clips 连续排列，中间有转场
    return [
      createMockMainTrackWithTransitions(),
      createMockVideoTrack(2),
      createMockAudioTrack(1),
      createMockSubtitleTrack(1),
      createMockFilterTrack(1),
    ];
  } else {
    // 普通模式
    return [
      createMockVideoTrack(1),
      createMockVideoTrack(2),
      createMockAudioTrack(1),
      createMockSubtitleTrack(1),
      createMockFilterTrack(1),
    ];
  }
}

// 生成带转场的主轨道
export function createMockMainTrackWithTransitions(): Track {
  const clips: Array<MediaClip | TransitionClip> = [
    // 第一个视频 clip
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'video',
      startTime: 0,
      endTime: 5,
      selected: false,
      sourceUrl: '/src/assets/video/bunny_0.mp4',
      originalDuration: 23,
      trimStart: 0,
      trimEnd: 5,
      playbackRate: 1,
      thumbnails: [],
    } as MediaClip,
    // 转场效果
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'transition',
      startTime: 4.5,
      endTime: 5.5,
      selected: false,
      transitionType: 'fade',
      transitionDuration: 1,
      name: '淡入淡出',
    } as TransitionClip,
    // 第二个视频 clip
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'video',
      startTime: 5,
      endTime: 11,
      selected: false,
      sourceUrl: '/src/assets/video/bunny_1.mp4',
      originalDuration: 20,
      trimStart: 2,
      trimEnd: 8,
      playbackRate: 1,
      thumbnails: [],
    } as MediaClip,
    // 转场效果
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'transition',
      startTime: 10.5,
      endTime: 11.5,
      selected: false,
      transitionType: 'slide',
      transitionDuration: 1,
      name: '滑动',
    } as TransitionClip,
    // 第三个视频 clip
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'video',
      startTime: 11,
      endTime: 16,
      selected: false,
      sourceUrl: '/src/assets/video/bunny_2.mp4',
      originalDuration: 16,
      trimStart: 1,
      trimEnd: 6,
      playbackRate: 1.5,
      thumbnails: [],
    } as MediaClip,
  ];

  const track: Track = {
    id: generateId('track-'),
    type: 'video',
    name: '主轨道（视频）',
    visible: true,
    locked: false,
    clips: [],
    order: 0,
    isMain: true,
  };

  clips.forEach((clip) => {
    clip.trackId = track.id;
  });
  track.clips = clips as Clip[];

  return track;
}

// 生成主轨道（连续排列的 clips）
export function createMockMainTrack(): Track {
  const clips: MediaClip[] = [
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'video',
      startTime: 5, // 连续排列，无间隙
      endTime: 11,
      selected: false,
      sourceUrl: '/src/assets/video/bunny_1.mp4',
      originalDuration: 20,
      trimStart: 2,
      trimEnd: 8,
      playbackRate: 1,
      thumbnails: [],
    },
    {
      id: generateId('clip-'),
      trackId: '',
      type: 'video',
      startTime: 11, // 连续排列，无间隙
      endTime: 16,
      selected: false,
      sourceUrl: '/src/assets/video/bunny_2.mp4',
      originalDuration: 16,
      trimStart: 1,
      trimEnd: 6,
      playbackRate: 1.5,
      thumbnails: [],
    },
  ];

  const track: Track = {
    id: generateId('track-'),
    type: 'video',
    name: '主轨道（视频）',
    visible: true,
    locked: false,
    clips: [],
    order: 0,
    isMain: true,
  };

  clips.forEach((clip) => {
    clip.trackId = track.id;
  });
  track.clips = clips;

  return track;
}

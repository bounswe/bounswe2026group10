import React from 'react';
import { render } from '@testing-library/react-native';
import { VideoPlayer } from '../components/video-guide/VideoPlayer';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const mockPlayer: { currentTime: number; loop: boolean; play: jest.Mock } = {
  currentTime: 0,
  loop: false,
  play: jest.fn(),
};

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn((_source, setup) => {
    if (typeof setup === 'function') setup(mockPlayer);
    return mockPlayer;
  }),
  VideoView: 'VideoView',
}));

beforeEach(() => {
  mockPlayer.currentTime = 0;
  mockPlayer.loop = false;
  mockPlayer.play.mockClear();
});

describe('VideoPlayer seek-to-timestamp behavior', () => {
  it('seeks to videoTimestamp and plays on mount when timestamp is provided', () => {
    render(
      <VideoPlayer
        videoUrl="https://example.com/video.mp4"
        stepNumber={1}
        stepDescription="Mix the dough"
        videoTimestamp={42}
      />,
    );

    expect(mockPlayer.currentTime).toBe(42);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('does not seek or play when videoTimestamp is undefined', () => {
    render(
      <VideoPlayer
        videoUrl="https://example.com/video.mp4"
        stepNumber={1}
        stepDescription="Mix the dough"
      />,
    );

    expect(mockPlayer.currentTime).toBe(0);
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('seeks to the new timestamp when videoTimestamp prop changes', () => {
    const { rerender } = render(
      <VideoPlayer
        videoUrl="https://example.com/video.mp4"
        stepNumber={1}
        stepDescription="Step one"
        videoTimestamp={10}
      />,
    );

    expect(mockPlayer.currentTime).toBe(10);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);

    rerender(
      <VideoPlayer
        videoUrl="https://example.com/video.mp4"
        stepNumber={2}
        stepDescription="Step two"
        videoTimestamp={75}
      />,
    );

    expect(mockPlayer.currentTime).toBe(75);
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);
  });
});

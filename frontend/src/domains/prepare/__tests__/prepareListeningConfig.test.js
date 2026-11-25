import {
  getPrepareListeningAudioPlaybackKey,
  getPrepareListeningAudioPlaybackState,
  normalizePrepareListeningAudioPlayCounts,
} from "../prepareListeningConfig";

describe("Prepare Listening audio playback", () => {
  test("tracks shared audio separately from each part's audio", () => {
    expect(getPrepareListeningAudioPlaybackKey(true, 0)).toBe("shared");
    expect(getPrepareListeningAudioPlaybackKey(false, 0)).toBe("0");
    expect(getPrepareListeningAudioPlaybackKey(false, 1)).toBe("1");
  });

  test("allows one initial play and one manual replay, but no third play", () => {
    expect(getPrepareListeningAudioPlaybackState({ playCount: 0 })).toMatchObject({
      canStart: true,
      canReplay: false,
      hasUsedAllPlays: false,
    });
    expect(
      getPrepareListeningAudioPlaybackState({
        playCount: 1,
        isPlaying: false,
      })
    ).toMatchObject({
      canStart: false,
      canReplay: true,
      hasUsedAllPlays: false,
    });
    expect(
      getPrepareListeningAudioPlaybackState({
        playCount: 2,
        isPlaying: false,
      })
    ).toMatchObject({
      canStart: false,
      canReplay: false,
      hasUsedAllPlays: true,
    });
  });

  test("resumes an unfinished listen without consuming the replay", () => {
    expect(
      getPrepareListeningAudioPlaybackState({
        playCount: 1,
        hasResumeAudio: true,
        audioEnded: false,
      })
    ).toMatchObject({
      canResume: true,
      canReplay: false,
    });
  });

  test("restores old attempts from their started-audio flags", () => {
    expect(
      normalizePrepareListeningAudioPlayCounts(undefined, {
        startedAudioByPart: { 0: true, 1: false },
      })
    ).toEqual({ 0: 1 });
    expect(
      normalizePrepareListeningAudioPlayCounts({ 0: 8, 1: 1 })
    ).toEqual({ 0: 2, 1: 1 });
  });
});

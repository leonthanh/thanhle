export const PREPARE_LISTENING_DURATION_MINUTES = 15;
export const PREPARE_LISTENING_AUDIO_PLAYS_PER_PART = 2;

const normalizePlayCount = (value) => {
  const count = Number(value);
  if (!Number.isFinite(count)) return 0;
  return Math.min(
    PREPARE_LISTENING_AUDIO_PLAYS_PER_PART,
    Math.max(0, Math.floor(count))
  );
};

export const getPrepareListeningAudioPlaybackKey = (isSingleFile, partIndex) =>
  isSingleFile ? "shared" : String(Number.isInteger(Number(partIndex)) ? Number(partIndex) : 0);

export const normalizePrepareListeningAudioPlayCounts = (
  persistedCounts,
  {
    startedAudioByPart = {},
    isSingleFile = false,
    testStarted = false,
    currentPartIndex = 0,
    audioCurrentTime = 0,
  } = {}
) => {
  if (
    persistedCounts &&
    typeof persistedCounts === "object" &&
    !Array.isArray(persistedCounts) &&
    Object.keys(persistedCounts).length > 0
  ) {
    return Object.fromEntries(
      Object.entries(persistedCounts)
        .map(([key, count]) => [key, normalizePlayCount(count)])
        .filter(([, count]) => count > 0)
    );
  }

  const restoredCounts = {};
  if (isSingleFile && testStarted) {
    restoredCounts.shared = 1;
  } else {
    Object.entries(
      startedAudioByPart &&
        typeof startedAudioByPart === "object" &&
        !Array.isArray(startedAudioByPart)
        ? startedAudioByPart
        : {}
    ).forEach(([partIndex, started]) => {
      if (started) restoredCounts[partIndex] = 1;
    });

    if (
      Object.keys(restoredCounts).length === 0 &&
      testStarted &&
      Number(audioCurrentTime) > 0
    ) {
      restoredCounts[String(currentPartIndex)] = 1;
    }
  }

  return restoredCounts;
};

export const getPrepareListeningAudioPlaybackState = ({
  playCount = 0,
  isPlaying = false,
  hasResumeAudio = false,
  audioEnded = false,
} = {}) => {
  const normalizedPlayCount = normalizePlayCount(playCount);
  const canResume =
    normalizedPlayCount > 0 && Boolean(hasResumeAudio) && !Boolean(audioEnded);

  return {
    playCount: normalizedPlayCount,
    canStart: normalizedPlayCount === 0,
    canResume,
    canReplay:
      normalizedPlayCount === 1 && !Boolean(isPlaying) && !canResume,
    hasUsedAllPlays:
      normalizedPlayCount >= PREPARE_LISTENING_AUDIO_PLAYS_PER_PART,
  };
};

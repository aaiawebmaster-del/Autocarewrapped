/** Set to false when re-enabling app audio for demos or production. */
export const APP_AUDIO_MUTED = true;

export function isAppAudioMuted(): boolean {
  return APP_AUDIO_MUTED;
}

export function playAppAudio(audio: HTMLAudioElement, onEnded?: () => void): void {
  if (isAppAudioMuted() || typeof window === 'undefined') {
    onEnded?.();
    return;
  }

  if (onEnded) {
    audio.addEventListener('ended', onEnded, { once: true });
    audio.addEventListener('error', onEnded, { once: true });
  }

  void audio.play().catch(() => onEnded?.());
}

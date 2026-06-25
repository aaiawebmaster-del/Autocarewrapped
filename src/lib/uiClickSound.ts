import { isAppAudioMuted, playAppAudio } from '@/lib/appAudio';
import buttonClickSound from '@/assets/mechanical-button-click.mp3';

const CLICK_VOLUME = 1;

let sessionPrimed = false;

/**
 * Prime click playback during a user gesture (e.g. Push to start) so later
 * button clicks are not blocked by autoplay policy or cold decoder state.
 */
export function primeUiClickSoundSession(): void {
  if (typeof window === 'undefined' || sessionPrimed || isAppAudioMuted()) return;
  sessionPrimed = true;

  const prime = new Audio(buttonClickSound);
  prime.preload = 'auto';
  prime.volume = 0.001;
  const playPromise = prime.play();
  if (playPromise) {
    void playPromise
      .then(() => {
        prime.pause();
        prime.currentTime = 0;
      })
      .catch(() => {
        /* Session may still accept plays from fresh elements after the gesture. */
      });
  }
}

export function playUiClickSound(onEnded?: () => void): void {
  if (typeof window === 'undefined') return;
  const audio = new Audio(buttonClickSound);
  audio.volume = CLICK_VOLUME;
  playAppAudio(audio, onEnded);
}

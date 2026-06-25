import { isAppAudioMuted, playAppAudio } from '@/lib/appAudio';
import hoodStandardsClickBack from '@/assets/hood-standards-click-back.mp3';
import hoodStandardsClickForward from '@/assets/hood-standards-click-forward.mp3';
import hoodStandardsDataBeep from '@/assets/hood-standards-data-beep.mp3';

const CLICK_VOLUME = 0.85;
const DATA_BEEP_VOLUME = 0.85;

export const HOOD_TYPEWRITER_CHAR_DELAY_MS = 42;

let dataBeepAudio: HTMLAudioElement | null = null;
let dataBeepStopTimer: ReturnType<typeof setTimeout> | null = null;

export function getHoodTypewriterDurationMs(
  textLength: number,
  charDelayMs = HOOD_TYPEWRITER_CHAR_DELAY_MS,
): number {
  return Math.max(0, textLength) * charDelayMs;
}

export function stopHoodStandardsDataProcessingBeep(): void {
  if (dataBeepStopTimer !== null) {
    window.clearTimeout(dataBeepStopTimer);
    dataBeepStopTimer = null;
  }
  if (!dataBeepAudio) return;
  dataBeepAudio.pause();
  dataBeepAudio.currentTime = 0;
  dataBeepAudio = null;
}

export function startHoodStandardsDataProcessingBeep(durationMs?: number): void {
  if (typeof window === 'undefined' || isAppAudioMuted()) return;

  stopHoodStandardsDataProcessingBeep();

  const audio = new Audio(hoodStandardsDataBeep);
  audio.loop = true;
  audio.volume = DATA_BEEP_VOLUME;
  dataBeepAudio = audio;
  playAppAudio(audio);

  if (durationMs !== undefined && durationMs > 0) {
    dataBeepStopTimer = window.setTimeout(() => {
      stopHoodStandardsDataProcessingBeep();
    }, durationMs);
  }
}

export function playHoodStandardsForwardClickSound(): void {
  if (typeof window === 'undefined') return;

  const audio = new Audio(hoodStandardsClickForward);
  audio.volume = CLICK_VOLUME;
  playAppAudio(audio);
}

export function playHoodStandardsBackClickSound(): void {
  if (typeof window === 'undefined') return;

  const audio = new Audio(hoodStandardsClickBack);
  audio.volume = CLICK_VOLUME;
  playAppAudio(audio);
}

/** @deprecated Prefer start/stop tied to typewriter duration. */
export function playHoodStandardsDataProcessingBeepSound(): void {
  startHoodStandardsDataProcessingBeep();
}

import { playAppAudio } from '@/lib/appAudio';
import aapexArrivalAlert from '@/assets/journey-aapex-arrival-alert.mp3';
import aapex2026Alert from '@/assets/journey-aapex-2026-alert.mp3';

const ALERT_VOLUME = 0.85;

/** "You have arrived" AAPEX 2025 overlay — after webinar next transition completes. */
export function playAapexArrivalAlertSound(): void {
  if (typeof window === 'undefined') return;

  const audio = new Audio(aapex2026Alert);
  audio.volume = ALERT_VOLUME;
  playAppAudio(audio);
}

/** AAPEX 2026 re-routing slide — after next from the arrival overlay. */
export function playAapex2026RerouteAlertSound(): void {
  if (typeof window === 'undefined') return;

  const audio = new Audio(aapexArrivalAlert);
  audio.volume = ALERT_VOLUME;
  playAppAudio(audio);
}

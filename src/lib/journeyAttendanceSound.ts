import { isAppAudioMuted, playAppAudio } from '@/lib/appAudio';
import attendanceCalculatingLoop from '@/assets/journey-attendance-calculating-loop.mp3';
import inPersonEventsAchievement from '@/assets/journey-in-person-events-achievement.mp3';
import noInPersonEventsAlert from '@/assets/journey-no-in-person-events-alert.mp3';

const CALCULATING_VOLUME = 0.65;
const ALERT_VOLUME = 0.85;
const ACHIEVEMENT_VOLUME = 0.85;

let calculatingAudio: HTMLAudioElement | null = null;

/** Loop while the GPS attendance "Calculating" state is active. */
export function startAttendanceCalculatingSound(): void {
  if (typeof window === 'undefined' || isAppAudioMuted()) return;

  stopAttendanceCalculatingSound();

  calculatingAudio = new Audio(attendanceCalculatingLoop);
  calculatingAudio.loop = true;
  calculatingAudio.volume = CALCULATING_VOLUME;
  playAppAudio(calculatingAudio);
}

export function stopAttendanceCalculatingSound(): void {
  if (!calculatingAudio) return;
  calculatingAudio.pause();
  calculatingAudio.currentTime = 0;
  calculatingAudio = null;
}

/** After calculating finishes when the company attended zero in-person events. */
export function playNoInPersonEventsAlertSound(): void {
  if (typeof window === 'undefined') return;

  const audio = new Audio(noInPersonEventsAlert);
  audio.volume = ALERT_VOLUME;
  playAppAudio(audio);
}

/** After calculating finishes when the company attended at least one in-person event. */
export function playInPersonEventsAchievementSound(): void {
  if (typeof window === 'undefined') return;

  const audio = new Audio(inPersonEventsAchievement);
  audio.volume = ACHIEVEMENT_VOLUME;
  playAppAudio(audio);
}

/** When entering the webinar attendance segment (0 = negative, 1+ = positive). */
export function playWebinarAttendanceOutcomeSound(webinarCount: number): void {
  if (typeof window === 'undefined') return;

  if (webinarCount === 0) {
    playNoInPersonEventsAlertSound();
    return;
  }

  playInPersonEventsAchievementSound();
}

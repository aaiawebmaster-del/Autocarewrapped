import { playAppAudio } from '@/lib/appAudio';
import journeyNegativeAlert from '@/assets/journey-negative-alert.mp3';
import journeyPositiveDing from '@/assets/journey-positive-ding.mp3';
import type { JourneySection } from '@/lib/buildJourneySections';

/** Matches `JourneyCounterGauge` low-fuel warning threshold. */
const LOW_FUEL_CONTACTS_THRESHOLD = 5;

const OUTCOME_VOLUME = 0.85;

export function isMembershipTenureSection(section: JourneySection): boolean {
  return section.type === 'counter' && section.subtitle === 'Membership Tenure';
}

export function isJourneyCounterSectionNegative(section: JourneySection): boolean {
  if (isMembershipTenureSection(section)) return false;
  if (section.type !== 'counter') return false;

  const { target, gaugeVariant } = section;
  if (gaugeVariant === 'fuel') return target < LOW_FUEL_CONTACTS_THRESHOLD;
  if (gaugeVariant === 'battery') return target === 0;
  if (gaugeVariant === 'community-logo') return target === 0;
  return false;
}

function playJourneyPositiveDing(): void {
  const audio = new Audio(journeyPositiveDing);
  audio.volume = OUTCOME_VOLUME;
  playAppAudio(audio);
}

/** Positive ding / negative alert for the journey counter slide being navigated to. */
export function playJourneySlideOutcomeSound(section: JourneySection | undefined): void {
  if (typeof window === 'undefined' || !section || section.type !== 'counter') return;

  if (isJourneyCounterSectionNegative(section)) {
    const audio = new Audio(journeyNegativeAlert);
    audio.volume = OUTCOME_VOLUME;
    playAppAudio(audio);
    return;
  }

  playJourneyPositiveDing();
}

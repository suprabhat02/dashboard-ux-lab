import type { RoadmapStage } from './i18n/en';

/**
 * Where "You are here" goes on the roadmap: the phase in progress, or, between
 * phases, the latest one finished. -1 only for a roadmap with neither.
 */
export function currentPhaseIndex(stages: readonly RoadmapStage[]): number {
  const now = stages.indexOf('now');
  return now === -1 ? stages.lastIndexOf('done') : now;
}

import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { loadingPhase, msUntilNextPhase } from '../../spec/timing';
import type { LoadingPhase } from '../../spec/types';

interface Observed {
  readonly startedAt: number | null;
  readonly phase: LoadingPhase;
}

/**
 * The phase of the current request, re-evaluated only at phase boundaries
 * (300ms, 3s, 8s) — never on an interval, so a slow request costs three renders.
 *
 * @param startedAt `performance.now()` when the request started, or null when idle.
 */
export function useLoadingPhase(startedAt: number | null): LoadingPhase | null {
  const [observed, setObserved] = useState<Observed>({
    startedAt: null,
    phase: 'pending',
  });

  // Layout effect, not effect: the next boundary is armed in the same task as the
  // commit that shows `pending`, so anything that observes `pending` (a person, an
  // assistive technology, a test) can rely on the 300ms timer already running.
  useLayoutEffect(() => {
    if (startedAt === null) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (): void => {
      const elapsed = performance.now() - startedAt;
      // Commit now, not in a later batch. On a busy main thread React would
      // otherwise fold this phase into the render of the response that ends it,
      // and the skeleton (and its announcement) would never happen. The spec says
      // every boundary reached is shown; the vanilla build renders here too.
      // Found by the comparison page; see docs/divergence-log.md.
      flushSync(() => {
        setObserved({ startedAt, phase: loadingPhase(elapsed) });
      });
      const wait = msUntilNextPhase(elapsed);
      if (wait !== null) timer = setTimeout(schedule, wait + 1);
    };
    const wait = msUntilNextPhase(performance.now() - startedAt);
    if (wait !== null) timer = setTimeout(schedule, wait + 1);

    return () => {
      clearTimeout(timer);
    };
  }, [startedAt]);

  if (startedAt === null) return null;
  // Derived during render: a new request starts in `pending` without an extra render.
  return observed.startedAt === startedAt ? observed.phase : 'pending';
}

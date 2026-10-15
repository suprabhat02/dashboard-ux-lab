import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { LabChannel, Politeness } from '../../spec/protocol';
import { TIMING } from '../../spec/timing';

export interface Announcer {
  readonly politeRef: RefObject<HTMLDivElement | null>;
  readonly assertiveRef: RefObject<HTMLDivElement | null>;
  readonly announce: (message: string, politeness?: Politeness) => void;
}

/**
 * Live-region announcements written straight to the DOM node, not through React
 * state. Screen readers announce *changes* to a region that already exists, so
 * the regions are always rendered, and each message is cleared then written on
 * the next tick to make repeated messages announce again.
 *
 * Bursts are debounced: switching scenarios five times quickly yields one
 * announcement for the final state, not a queue of five.
 */
export function useAnnouncer(channel: LabChannel): Announcer {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const announce = useCallback(
    (message: string, politeness: Politeness = 'polite') => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const target =
          politeness === 'assertive' ? assertiveRef.current : politeRef.current;
        const other =
          politeness === 'assertive' ? politeRef.current : assertiveRef.current;
        if (!target) return;
        if (other) other.textContent = '';
        target.textContent = '';
        requestAnimationFrame(() => {
          target.textContent = message;
        });
        channel.emit({ type: 'announce', message, politeness });
      }, TIMING.announceDebounceMs);
    },
    [channel],
  );

  return { politeRef, assertiveRef, announce };
}

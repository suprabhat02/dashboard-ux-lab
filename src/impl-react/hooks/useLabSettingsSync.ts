import { useEffect } from 'react';
import type { LabChannel } from '../../spec/protocol';
import { parseSettings } from '../../spec/url';
import type { LabSettings } from '../../spec/types';

interface Handlers {
  readonly onApply: (settings: LabSettings) => void;
  readonly onReplay: () => void;
}

/**
 * Keeps the dashboard in step with the outside world:
 * - commands from the lab chrome (optional — the dashboard works without it)
 * - browser back/forward through settings the visitor has visited
 */
export function useLabSettingsSync(
  channel: LabChannel,
  { onApply, onReplay }: Handlers,
): void {
  useEffect(() => {
    const off = channel.onCommand((command) => {
      switch (command.type) {
        case 'apply':
          onApply(command.settings);
          break;
        case 'replay':
          onReplay();
          break;
      }
    });
    const onPopState = (): void => {
      onApply(parseSettings(new URLSearchParams(window.location.search)));
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      off();
      window.removeEventListener('popstate', onPopState);
    };
  }, [channel, onApply, onReplay]);
}

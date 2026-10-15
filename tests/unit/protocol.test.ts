import { describe, expect, it, vi } from 'vitest';
import { createLabChannel } from '../../src/spec/protocol';
import { DEFAULT_SETTINGS } from '../../src/spec/scenarios';

describe('lab channel', () => {
  it('delivers commands and timestamped telemetry, and unsubscribes cleanly', () => {
    const channel = createLabChannel(new EventTarget(), () => 42);
    const onCommand = vi.fn();
    const onTelemetry = vi.fn();
    const offCommand = channel.onCommand(onCommand);
    channel.onTelemetry(onTelemetry);

    channel.sendCommand({ type: 'apply', settings: DEFAULT_SETTINGS });
    channel.emit({ type: 'announce', message: 'Hello', politeness: 'polite' });
    expect(onCommand).toHaveBeenCalledWith({ type: 'apply', settings: DEFAULT_SETTINGS });
    expect(onTelemetry).toHaveBeenCalledWith({
      type: 'announce',
      message: 'Hello',
      politeness: 'polite',
      at: 42,
    });

    offCommand();
    channel.sendCommand({ type: 'replay' });
    expect(onCommand).toHaveBeenCalledTimes(1);
  });
});

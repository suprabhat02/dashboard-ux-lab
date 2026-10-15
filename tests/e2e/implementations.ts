import type { ImplementationId } from '../../src/spec/types';

/**
 * Implementations under test. The vanilla build joins this list when it ships;
 * every test in the suite then runs against it unchanged. That is the parity contract.
 */
export const IMPLEMENTATIONS: readonly ImplementationId[] = ['react'];

export const labPath = (implementation: ImplementationId, query = ''): string =>
  `/lab/${implementation}/${query ? `?${query}` : ''}`;

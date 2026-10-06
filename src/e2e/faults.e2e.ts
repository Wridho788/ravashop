import {FaultSource, FaultTarget} from '../data/repository';

/** E2E build only: one-shot storage faults armed from the Profile screen panel. */
const armed = new Set<FaultTarget>();

export const faultSource: FaultSource = {consume: target => armed.delete(target)};

export function armFault(target: FaultTarget): void {
  armed.add(target);
}

export function isFaultArmed(target: FaultTarget): boolean {
  return armed.has(target);
}

import {FaultSource} from '../data/repository';

/**
 * Production stub. Builds bundled with RAVASHOP_E2E=1 resolve `faults.e2e.ts` instead
 * (see metro.config.js), so release APKs contain no fault controls.
 */
export const faultSource: FaultSource = {consume: () => false};

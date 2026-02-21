import type { LightAlgorithm } from '../types';
import { PHASES, PHASE_DURATIONS, PEDESTRIAN_PHASE_INDEX, CLEARANCE_PHASE_INDEX } from './phases';

export const timerLightAlgorithm: LightAlgorithm = {
    getInitialState: () => ({ currentPhase: 0, phaseTimer: 0, lights: PHASES[0] }),

    tick: ({ currentPhase, phaseTimer }) => {
        const nextTimer = phaseTimer + 1;
        if (nextTimer >= PHASE_DURATIONS[currentPhase]) {
            const nextPhase = (currentPhase + 1) % PHASES.length;
            return { state: { currentPhase: nextPhase, phaseTimer: 0, lights: PHASES[nextPhase] }, lights: PHASES[nextPhase] };
        }
        return { state: { currentPhase, phaseTimer: nextTimer, lights: PHASES[currentPhase] }, lights: PHASES[currentPhase] };
    },

    isPedestrianPhase: ({ currentPhase }) => currentPhase === PEDESTRIAN_PHASE_INDEX,
    isClearancePhase:  ({ currentPhase }) => currentPhase === CLEARANCE_PHASE_INDEX,
};
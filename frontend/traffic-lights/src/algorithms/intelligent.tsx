import type { LightAlgorithm, IntelligentState } from '../types';
import { PHASES, PEDESTRIAN_LIGHTS, PEDESTRIAN_PHASE_INDEX, CLEARANCE_PHASE_INDEX } from './phases';

const SCENARIO_DURATIONS = [80, 320, 160, 80];
const PEDESTRIAN_DURATION = 300;
const CLEARANCE_DURATION = 500;
const PEDESTRIAN_EVERY_N_SCENARIOS = 4;
const STARVATION_THRESHOLD = 2;

const scoreScenario = (idx: number, movementCount: Record<string, number>): number => {
    const g = (k: string) => movementCount[k] ?? 0;
    switch (idx) {
        case 0: return g('north_straight') + g('north_right') + g('south_straight') + g('south_right');
        case 1: return g('east_straight')  + g('east_right')  + g('west_straight')  + g('west_right');
        case 2: return g('north_left') + g('south_left');
        case 3: return g('east_left')  + g('west_left');
        default: return 0;
    }
};

const pickNextScenario = (state: IntelligentState): number => {
    const movementCount = state.trafficData?.movementCount ?? {};
    const prioritized = [0, 1, 2, 3].filter(i => state.skippedCount[i] >= STARVATION_THRESHOLD);
    const candidates = prioritized.length > 0 ? prioritized : [0, 1, 2, 3];
    return candidates.reduce((best, i) =>
        scoreScenario(i, movementCount) > scoreScenario(best, movementCount) ? i : best
    , candidates[0]);
};

const advanceScenario = (state: IntelligentState): IntelligentState => {
    const nextScenario = pickNextScenario(state);
    const movementCount = state.trafficData?.movementCount ?? {};
    const newSkipped = state.skippedCount.map((c, i) => {
        if (i === nextScenario) return 0;
        return scoreScenario(i, movementCount) === 0 ? c : c + 1;
    });
    return {
        ...state,
        scenarioIdx: nextScenario,
        phaseInScenario: 0,
        phaseTimer: 0,
        lights: PHASES[nextScenario * 4],
        currentPhase: nextScenario * 4,
        skippedCount: newSkipped,
    };
};

export const intelligentLightAlgorithm: LightAlgorithm = {
    getInitialState: (): IntelligentState => ({
        currentPhase: 0,
        phaseTimer: 0,
        lights: PHASES[0],
        scenarioIdx: 0,
        phaseInScenario: 0,
        skippedCount: [0, 0, 0, 0],
        scenariosSinceLastPedestrian: 0,
        isPedestrian: false,
        isClearance: false,
    }),

    tick: (rawState) => {
        const state = rawState as IntelligentState;
        const nextTimer = state.phaseTimer + 1;

        if (state.isClearance) {
            if (nextTimer >= CLEARANCE_DURATION) {
                const next = advanceScenario({ ...state, scenariosSinceLastPedestrian: 0 });
                return { state: { ...next, isPedestrian: false, isClearance: false }, lights: next.lights };
            }
            return { state: { ...state, phaseTimer: nextTimer }, lights: state.lights };
        }

        if (state.isPedestrian) {
            if (nextTimer >= PEDESTRIAN_DURATION) {
                return { state: { ...state, phaseTimer: 0, isClearance: true, currentPhase: CLEARANCE_PHASE_INDEX }, lights: PEDESTRIAN_LIGHTS };
            }
            return { state: { ...state, phaseTimer: nextTimer }, lights: PEDESTRIAN_LIGHTS };
        }

        if (nextTimer >= SCENARIO_DURATIONS[state.phaseInScenario]) {
            const nextPhaseInScenario = state.phaseInScenario + 1;

            if (nextPhaseInScenario >= 4) {
                const newSinceLastPed = state.scenariosSinceLastPedestrian + 1;

                if (newSinceLastPed >= PEDESTRIAN_EVERY_N_SCENARIOS) {
                    const pedestrianWaiting = state.trafficData?.pedestrianWaiting ?? 0;

                    if (pedestrianWaiting === 0) {
                        const next = advanceScenario({ ...state, scenariosSinceLastPedestrian: 0 });
                        return { state: next, lights: next.lights };
                    }

                    return {
                        state: {
                            ...state,
                            phaseTimer: 0,
                            isPedestrian: true,
                            isClearance: false,
                            lights: PEDESTRIAN_LIGHTS,
                            scenariosSinceLastPedestrian: newSinceLastPed,
                            currentPhase: PEDESTRIAN_PHASE_INDEX,
                        },
                        lights: PEDESTRIAN_LIGHTS,
                    };
                }

                const next = advanceScenario({ ...state, scenariosSinceLastPedestrian: newSinceLastPed });
                return { state: next, lights: next.lights };
            }

            const newLights = PHASES[state.scenarioIdx * 4 + nextPhaseInScenario];
            return {
                state: {
                    ...state,
                    phaseInScenario: nextPhaseInScenario,
                    phaseTimer: 0,
                    lights: newLights,
                    currentPhase: state.scenarioIdx * 4 + nextPhaseInScenario,
                },
                lights: newLights,
            };
        }

        return { state: { ...state, phaseTimer: nextTimer }, lights: state.lights };
    },

    isPedestrianPhase: (s) => (s as IntelligentState).isPedestrian,
    isClearancePhase:  (s) => (s as IntelligentState).isClearance,
};
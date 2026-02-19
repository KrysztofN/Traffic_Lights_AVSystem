import type { LightMap, LightState, MovementLights, LightAlgorithm } from '../types';

const ml = (left: LightState, straight: LightState, right: LightState): MovementLights => ({ left, straight, right });
const OFF = ml('red', 'red', 'red');
const COND = ml('red', 'red', 'conditional');

const PHASES: LightMap[] = [
    // Scenariusz 1
    // Droga północna: prosto, prawo
    // Droga południowa: prosto, prawo
    // Droga wschodnia: warunkowo w prawo
    // Droga zachodnia: warunkowo w prawo
    { north: ml('red', 'yellow', 'yellow'), south: ml('red', 'yellow', 'yellow'), east: OFF, west: OFF },
    { north: ml('red', 'green', 'green'), south: ml('red', 'green', 'green'), east: COND, west: COND },
    { north: ml('red', 'yellow', 'yellow'), south: ml('red', 'yellow', 'yellow'), east: OFF, west: OFF },
    { north: OFF, south: OFF, east: OFF, west: OFF },

    // Scenariusz 2
    // Droga wschodnia: prosto, prawo
    // Droga zachodnia: prosto, prawo
    // Droga północna: warunkowo w prawo
    // Droga południowa: warunkowo w prawo
    { north: OFF, south: OFF, east: ml('red', 'yellow', 'yellow'), west: ml('red', 'yellow', 'yellow') },
    { north: COND, south: COND, east: ml('red', 'green', 'green'), west: ml('red', 'green', 'green') },
    { north: OFF, south: OFF, east: ml('red', 'yellow', 'yellow'), west: ml('red', 'yellow', 'yellow') },
    { north: OFF, south: OFF, east: OFF, west: OFF },


    // Scenariusz 3
    // Droga północna: lewo
    // Droga południowa: lewo
    { north: ml('yellow', 'red', 'red'), south: ml('yellow', 'red', 'red'), east: OFF, west: OFF },
    { north: ml('green', 'red', 'red'), south: ml('green', 'red', 'red'), east: OFF, west: OFF },
    { north: ml('yellow', 'red', 'red'), south: ml('yellow', 'red', 'red'), east: OFF, west: OFF },
    { north: OFF, south: OFF, east: OFF, west: OFF },

    // Scenariusz 4
    // Droga wschodnia: lewo
    // Droga zachodnia: lewo
    { north: OFF, south: OFF, east: ml('yellow', 'red', 'red'), west: ml('yellow', 'red', 'red') },
    { north: OFF, south: OFF, east: ml('green', 'red', 'red'), west: ml('green', 'red', 'red') },
    { north: OFF, south: OFF, east: ml('yellow', 'red', 'red'), west: ml('yellow', 'red', 'red') },
    { north: OFF, south: OFF, east: OFF, west: OFF },

    // Scenariusz 5
    // piesi
    { north: OFF, south: OFF, east: OFF, west: OFF },

    // Scenariusz 6
    // Oczekiwanie na opuszczenie przejścia przez wszystkich pieszych
    { north: OFF, south: OFF, east: OFF, west: OFF },
];

const PHASE_DURATIONS = [
    40, 300, 80, 40,
    40, 300, 80, 40,
    40, 300, 80, 40,
    40, 200, 80, 40,
    300,
    300,
];

export const PEDESTRIAN_PHASE_INDEX = 16;
export const CLEARANCE_PHASE_INDEX = 17;

export const timerLightAlgorithm: LightAlgorithm = {
    getInitialState: () => ({ 
        currentPhase: 0, 
        phaseTimer: 0, 
        lights: PHASES[0]
    }),

    tick: ({ currentPhase, phaseTimer }) => {
        const nextTimer = phaseTimer + 1;
        if (nextTimer >= PHASE_DURATIONS[currentPhase]) {
            const nextPhase = (currentPhase + 1) % PHASES.length;
            return {
                state: { currentPhase: nextPhase, phaseTimer: 0, lights: PHASES[nextPhase] },
                lights: PHASES[nextPhase],
            };
        }
        return {
            state: { currentPhase, phaseTimer: nextTimer, lights: PHASES[currentPhase] },
            lights: PHASES[currentPhase],
        };
    },

    isPedestrianPhase: ({ currentPhase }) => currentPhase === PEDESTRIAN_PHASE_INDEX,
    isClearancePhase:  ({ currentPhase }) => currentPhase === CLEARANCE_PHASE_INDEX,
};
export interface Config {
    lanes: {
        count: number;
        laneWidth: number;
    };
    zebra: {
        zebraWidth: number;
        zebraGap: number;
        zebraLength: number;
        zebraMargin: number;
    };
    vehicle: {
        car: {
            width: number;
            height: number;
            speed: number;
        };
    };
    simulation: {
        stepSize: number,
        maxPedestriansPerPath: number,
        spawnInterval: number,
        pedestrianPhaseIndex: number,
        clearancePhaseIndex: number
    };
    pedestrian: {
        speed: number,
        size: number
    };
    bicycle: {
        speed: number,
        size: number
    }
}

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ZebraCrossing {
    stripes: Rectangle[];
    direction: 'horizontal' | 'vertical';
}

export interface Crossable {
    path: PedestrianPath;
    direction: 1 | -1;
}


export interface WorldGeometry {
    canvas: {
        width: number;
        height: number;
    };
    center: {
        x: number;
        y: number;
    };
    config: {
        numOfLanes: number;
        laneWidth: number;
        roadWidth: number;
        stopLineDistance: number;
        pavementWidth: number;
        bikeLaneWidth: number;
        zebraWidth: number;
        zebraGap: number;
        zebraLength: number;
        zebraMargin: number;
    };
    grass: Rectangle;
    pavements: {
        top: Rectangle;
        bottom: Rectangle;
        left: Rectangle;
        right: Rectangle;
    };
    bikeLanes: {
        top: Rectangle;
        bottom: Rectangle;
        left: Rectangle;
        right: Rectangle;
    };
    roads: {
        horizontal: Rectangle;
        vertical: Rectangle;
    };
    laneLines: Line[];
    stopLines: Line[];
    zebraCrossings: {
        top: ZebraCrossing;
        bottom: ZebraCrossing;
        left: ZebraCrossing;
        right: ZebraCrossing;
    };
}

export interface Vehicle {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    startRoad: RoadDirection;
    movementType: MovementType;
    currentRoad: RoadDirection;
    targetRoad: RoadDirection;
    lane: number;
    state: 'moving' | 'stopping' | 'stopped' | 'turning' | 'waiting';
    route: RoadDirection[];
    carImage: string;
}
export interface Command {
    type: 'addVehicle' | 'step' | 'run' | 'pause' | 'reset';
    vehicleId?: string;
    startRoad?: RoadDirection;
    endRoad?: RoadDirection;
}
export interface TrafficWorldProps {
    numLanes: number;
    onGeometryReady: (geometry: WorldGeometry) => void;
}

export interface VehicleSimulationProps {
    numLanes: number;
    geometry: WorldGeometry;
    onLaneChange: (n: number) => void;
}
export interface Pedestrian {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    path: PedestrianPath;
    direction: 1 | -1; // 1 = prawo/lewo, -1 = góra/dół
    state: 'walking' | 'waiting' | 'crossing';
    pedestrianImg: string;
}

export interface Bicycle {
    id: string;
    x: number;
    y: number;
    size: number;
    speed: number;
    path: PedestrianPath;
    direction: 1 | -1;
    state: 'riding' | 'waiting' | 'crossing';
    bikeImg: string;
}

export interface SimulationControlsProps {
    currentCommandIndex: number;
    commandsLength: number;
    isRunning: boolean;
    isMinimized: boolean;
    roadCounts: Record<RoadDirection, number>;
    waitingCounts: Record<PedestrianPath, number>;
    showPedestrians: boolean;
    showBicycles: boolean;
    numberOfLanes: number,
    stepStatuses: { leftVehicles: string[] }[];
    algorithm: String,
    onAlgorithmChange: (algo: 'timer' | 'intelligent') => void;
    onToggleRunning: () => void;
    onToggleMinimized: () => void;
    onTogglePedestrians: () => void;
    onToggleBicycles: () => void;
    onLaneChange: (n: number) => void;
    onStep: () => void;
    onReset: () => void;
    onExport: () => void;
    onLoadFile: (f: File) => void;
}

export interface PedestrianData {
    speed: number,
    size: number
}

export interface LightAlgorithmState {
    currentPhase: number;
    phaseTimer: number;
    lights: LightMap;
}

export interface LightAlgorithm {
    getInitialState: () => LightAlgorithmState;
    tick: (state: LightAlgorithmState) => { state: LightAlgorithmState; lights: LightMap };
    isPedestrianPhase: (state: LightAlgorithmState) => boolean;
    isClearancePhase: (state: LightAlgorithmState) => boolean;
}

export interface IntelligentState extends LightAlgorithmState {
    scenarioIdx: number;
    phaseInScenario: number;
    skippedCount: number[];
    isPedestrian: boolean;
    isClearance: boolean;
    scenariosSinceLastPedestrian: number;
    trafficData?: {
        movementCount: Record<string, number>;
        pedestrianWaiting: number;
        pedestrianTotal: number;
    };
}

export type RoadDirection = 'north' | 'south' | 'east' | 'west';

export type LightState = 'red' | 'yellow' | 'green' | 'conditional';

export type MovementType = 'left' | 'straight' | 'right';

export type MovementLights = { left: LightState; straight: LightState; right: LightState };

export type LightMap = { north: MovementLights; south: MovementLights; east: MovementLights; west: MovementLights };

export type PedestrianPath = 'north' | 'south' | 'west' | 'east';

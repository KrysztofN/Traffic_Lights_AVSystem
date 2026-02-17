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

export type RoadDirection = 'north' | 'south' | 'east' | 'west';

export interface Vehicle {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    currentRoad: RoadDirection;
    targetRoad: RoadDirection;
    lane: number;
    state: 'moving' | 'stopping' | 'stopped' | 'turning';
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
    onGeometryReady: (geometry: WorldGeometry) => void;
}

export interface VehicleSimulationProps {
    geometry: WorldGeometry;
}
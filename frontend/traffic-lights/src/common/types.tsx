
export interface Config {
    lanes: {
        count: number;
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
    lineWidth?: number;
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

export interface TrafficWorldProps {
    onGeometryReady: (geometry: WorldGeometry) => void;
}
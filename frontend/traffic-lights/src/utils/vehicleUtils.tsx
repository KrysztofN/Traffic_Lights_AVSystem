import type { Vehicle, RoadDirection, WorldGeometry, MovementType, LightMap } from '../types';

const CONDITIONAL_CONFLICTS: Record<string, RoadDirection> = {
    west:  'south',  
    east:  'north',  
    north: 'west',
    south: 'east', 
};

const isConflictingVehicleNearby = (
    vehicle: Vehicle,
    allVehicles: Map<string, Vehicle>,
    center: { x: number; y: number },
    stopLineDistance: number
): boolean => {
    const conflictingRoad = CONDITIONAL_CONFLICTS[vehicle.startRoad];
    if (!conflictingRoad) return false;

    const dangerZone = stopLineDistance + 80;

    return Array.from(allVehicles.values()).some(other => {
        if (other.id === vehicle.id) return false;
        if (other.startRoad !== conflictingRoad) return false;
        if (other.movementType !== 'straight') return false;
        if (other.route.length === 0) return false; 

        return (
            Math.abs(other.x - center.x) < dangerZone &&
            Math.abs(other.y - center.y) < dangerZone
        );
    });
};

const shouldWaitAtLight = (
    vehicle: Vehicle,
    allVehicles: Map<string, Vehicle>,
    center: { x: number; y: number },
    stopLineDistance: number,
    lights: LightMap
): boolean => {
    if (vehicle.route.length === 0) return false;

    const movementLight = lights[vehicle.startRoad][vehicle.movementType];

    if (movementLight === 'red' || movementLight === 'yellow') {
        const frontOffsetNS = vehicle.width / 2;
        const frontOffsetEW = vehicle.height / 2;
        switch (vehicle.currentRoad) {
            case 'north': return vehicle.y <= center.y + stopLineDistance + frontOffsetNS + 10;
            case 'south': return vehicle.y >= center.y - stopLineDistance - frontOffsetNS - 10;
            case 'east':  return vehicle.x >= center.x - stopLineDistance - frontOffsetEW - 10;
            case 'west':  return vehicle.x <= center.x + stopLineDistance + frontOffsetEW + 10;
            default: return false;
        }
    }

    if (movementLight === 'green') return false;

    if (movementLight === 'conditional') {
        const conflictingRoad = CONDITIONAL_CONFLICTS[vehicle.startRoad];
        const conflictingStraightLight = lights[conflictingRoad]?.straight;

        if (conflictingStraightLight === 'red' || conflictingStraightLight === 'yellow') {
            return false;
        }

        const frontOffsetNS = vehicle.width / 2;
        const frontOffsetEW = vehicle.height / 2;
        let atStopLine = false;
        switch (vehicle.currentRoad) {
            case 'north': atStopLine = vehicle.y <= center.y + stopLineDistance + frontOffsetNS; break;
            case 'south': atStopLine = vehicle.y >= center.y - stopLineDistance - frontOffsetNS; break;
            case 'east':  atStopLine = vehicle.x >= center.x - stopLineDistance - frontOffsetEW; break;
            case 'west':  atStopLine = vehicle.x <= center.x + stopLineDistance + frontOffsetEW; break;
        }
        if (!atStopLine) return false;

        return isConflictingVehicleNearby(vehicle, allVehicles, center, stopLineDistance);
    }

    return false;
};

export const getMovementType = (startRoad: RoadDirection, endRoad: RoadDirection): MovementType => {
    const rightTurns = [['north','west'],['south','east'],['east','north'],['west','south']];
    const leftTurns  = [['north','east'],['south','west'],['east','south'],['west','north']];
    if (rightTurns.some(([s,e]) => s === startRoad && e === endRoad)) return 'right';
    if (leftTurns.some(([s,e])  => s === startRoad && e === endRoad)) return 'left';
    return 'straight';
};

export const getSpawnPosition = (road: RoadDirection, lane: number, geometry: WorldGeometry) => {
    const { center, config } = geometry;
    const laneOffset = (lane + 0.5) * config.laneWidth;
    const positions = {
        south: { x: center.x + laneOffset, y: geometry.canvas.height, direction: 'north' as const },
        north: { x: center.x - laneOffset, y: 0,                      direction: 'south' as const },
        east:  { x: geometry.canvas.width,  y: center.y - laneOffset, direction: 'west'  as const },
        west:  { x: 0,                      y: center.y + laneOffset, direction: 'east'  as const },
    };
    return positions[road];
};

export const selectLane = (startRoad: RoadDirection, endRoad: RoadDirection, laneCount: number): number => {
    const rightTurns = [['north','west'],['south','east'],['east','north'],['west','south']];
    const leftTurns  = [['north','east'],['south','west'],['east','south'],['west','north']];
    if (rightTurns.some(([s,e]) => s === startRoad && e === endRoad)) return laneCount - 1;
    if (leftTurns.some(([s,e])  => s === startRoad && e === endRoad)) return 0;
    return Math.floor(laneCount / 2);
};

export const updateVehiclePosition = (
    vehicle: Vehicle,
    allVehicles: Map<string, Vehicle>,
    geometry: WorldGeometry,
    speed: number,
    lights: LightMap
): void => {
    const { center, config } = geometry;
    const { laneWidth, stopLineDistance, roadWidth } = config;

    if (vehicle.state === 'turning') {
        handleTurning(vehicle, center, laneWidth, speed);
        return;
    }

    if (shouldWaitAtLight(vehicle, allVehicles, center, stopLineDistance, lights)) {
        return;
    }

    const intersectionRadius = roadWidth / 2 + 50;
    const atIntersection =
        Math.abs(vehicle.x - center.x) < intersectionRadius &&
        Math.abs(vehicle.y - center.y) < intersectionRadius;

    if (atIntersection && vehicle.route.length > 0 && vehicle.state === 'moving') {
        vehicle.state = 'turning';
    }

    if (vehicle.state === 'turning') {
        handleTurning(vehicle, center, laneWidth, speed);
    } else {
        handleStraightMovement(vehicle, speed);
    }
};

const handleTurning = (vehicle: Vehicle, center: { x: number; y: number }, laneWidth: number, speed: number): void => {
    const targetLaneOffset = (vehicle.lane + 0.5) * laneWidth;
    const targets: Record<string, { x: number; y: number }> = {
        north: { x: center.x + targetLaneOffset, y: vehicle.y },
        south: { x: center.x - targetLaneOffset, y: vehicle.y },
        east:  { x: vehicle.x, y: center.y + targetLaneOffset },
        west:  { x: vehicle.x, y: center.y - targetLaneOffset },
    };

    let targetX = vehicle.x, targetY = vehicle.y;
    if (vehicle.targetRoad in targets) ({ x: targetX, y: targetY } = targets[vehicle.targetRoad]);

    const dx = targetX - vehicle.x;
    const dy = targetY - vehicle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < speed) {
        vehicle.x = targetX; vehicle.y = targetY;
        vehicle.currentRoad = vehicle.targetRoad;
        vehicle.route = [];
        vehicle.state = 'moving';
    } else {
        vehicle.x += (dx / distance) * speed;
        vehicle.y += (dy / distance) * speed;
    }
};

const handleStraightMovement = (vehicle: Vehicle, speed: number): void => {
    const movements: Record<string, { dx: number; dy: number }> = {
        north: { dx: 0, dy: -speed }, south: { dx: 0, dy: speed },
        east:  { dx: speed, dy: 0 },  west:  { dx: -speed, dy: 0 },
    };
    const m = movements[vehicle.currentRoad];
    if (m) { vehicle.x += m.dx; vehicle.y += m.dy; }
};

export const shouldRemoveVehicle = (vehicle: Vehicle, canvasWidth: number, canvasHeight: number): boolean => {
    const buffer = 100;
    return vehicle.x < -buffer || vehicle.x > canvasWidth + buffer ||
           vehicle.y < -buffer || vehicle.y > canvasHeight + buffer;
};
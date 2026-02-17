import type { Vehicle, RoadDirection, WorldGeometry } from '../types';

export const getSpawnPosition = (
    road: RoadDirection,
    lane: number,
    geometry: WorldGeometry
) => {
    const { center, config } = geometry;
    const { laneWidth } = config;
    const laneOffset = (lane + 0.5) * laneWidth;

    const positions = {
        south: { x: center.x + laneOffset, y: geometry.canvas.height, direction: 'north' as const },
        north: { x: center.x - laneOffset, y: 0, direction: 'south' as const },
        east: { x: geometry.canvas.width, y: center.y - laneOffset, direction: 'west' as const },
        west: { x: 0, y: center.y + laneOffset, direction: 'east' as const }
    };

    return positions[road];
};

export const selectLane = (
    startRoad: RoadDirection,
    endRoad: RoadDirection,
    laneCount: number
): number => {
    const rightTurns = [
        ['north', 'west'],
        ['south', 'east'],
        ['east', 'north'],
        ['west', 'south']
    ];

    const leftTurns = [
        ['north', 'east'],
        ['south', 'west'],
        ['east', 'south'],
        ['west', 'north']
    ];

    const isRightTurn = rightTurns.some(([start, end]) => 
        startRoad === start && endRoad === end
    );

    const isLeftTurn = leftTurns.some(([start, end]) => 
        startRoad === start && endRoad === end
    );

    if (isRightTurn) return laneCount - 1;
    if (isLeftTurn) return 0;
    return Math.floor(laneCount / 2);
};

export const updateVehiclePosition = (
    vehicle: Vehicle,
    geometry: WorldGeometry,
    speed: number
): void => {
    const { center, config } = geometry;
    const { laneWidth } = config;
    const atIntersection = Math.abs(vehicle.x - center.x) < 100 && 
                          Math.abs(vehicle.y - center.y) < 100;

    if (atIntersection && vehicle.route.length > 0 && vehicle.state === 'moving') {
        vehicle.state = 'turning';
        vehicle.targetRoad = vehicle.route[0];
    }

    if (vehicle.state === 'turning') {
        handleTurning(vehicle, center, laneWidth, speed);
    } else {
        handleStraightMovement(vehicle, speed);
    }
};

const handleTurning = (
    vehicle: Vehicle,
    center: { x: number; y: number },
    laneWidth: number,
    speed: number
): void => {
    const targetLaneOffset = (vehicle.lane + 0.5) * laneWidth;
    let targetX = vehicle.x;
    let targetY = vehicle.y;

    const targets = {
        north: { x: center.x + targetLaneOffset, y: vehicle.y },
        south: { x: center.x - targetLaneOffset, y: vehicle.y },
        east: { x: vehicle.x, y: center.y + targetLaneOffset },
        west: { x: vehicle.x, y: center.y - targetLaneOffset }
    };

    if (vehicle.targetRoad in targets) {
        ({ x: targetX, y: targetY } = targets[vehicle.targetRoad]);
    }

    const dx = targetX - vehicle.x;
    const dy = targetY - vehicle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < speed) {
        vehicle.x = targetX;
        vehicle.y = targetY;
        vehicle.currentRoad = vehicle.targetRoad;
        vehicle.route = [];
        vehicle.state = 'moving';
    } else {
        vehicle.x += (dx / distance) * speed;
        vehicle.y += (dy / distance) * speed;
    }
};

const handleStraightMovement = (vehicle: Vehicle, speed: number): void => {
    const movements = {
        north: { dx: 0, dy: -speed },
        south: { dx: 0, dy: speed },
        east: { dx: speed, dy: 0 },
        west: { dx: -speed, dy: 0 }
    };

    const movement = movements[vehicle.currentRoad];
    if (movement) {
        vehicle.x += movement.dx;
        vehicle.y += movement.dy;
    }
};

export const shouldRemoveVehicle = (
    vehicle: Vehicle,
    canvasWidth: number,
    canvasHeight: number
): boolean => {
    const buffer = 100;
    return (
        vehicle.x < -buffer ||
        vehicle.x > canvasWidth + buffer ||
        vehicle.y < -buffer ||
        vehicle.y > canvasHeight + buffer
    );
};
import type { Pedestrian, PedestrianPath, WorldGeometry, PedestrianData } from '../types';
import { getStopPosition, getCrossTarget, getAxis } from './crossUtils';

export const spawnPedestrian = (
    id: string, 
    path: PedestrianPath, 
    geometry: WorldGeometry, 
    pedestrianImg: string,
    pedestrianData: PedestrianData
): Pedestrian => {
    const { canvas, pavements } = geometry;
    const { bikeLaneWidth } = geometry.config;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const roadMargin = 10;
    let x = 0, y = 0;

    switch (path) {
        case 'north': {
            const start = pavements.top.y + bikeLaneWidth + roadMargin;
            const end = pavements.top.y + pavements.top.height - roadMargin;
            y = start + Math.random() * (end - start);
            x = direction === 1 ? 0 : canvas.width;
            break;
        }
        case 'south': {
            const start = pavements.bottom.y + roadMargin;
            const end = pavements.bottom.y + pavements.bottom.height - bikeLaneWidth - roadMargin;
            y = start + Math.random() * (end - start);
            x = direction === 1 ? 0 : canvas.width;
            break;
        }
        case 'west': {
            const start = pavements.left.x + bikeLaneWidth + roadMargin;
            const end = pavements.left.x + pavements.left.width - roadMargin;
            x = start + Math.random() * (end - start);
            y = direction === 1 ? 0 : canvas.height;
            break;
        }
        case 'east': {
            const start = pavements.right.x + roadMargin;
            const end = pavements.right.x + pavements.right.width - bikeLaneWidth - roadMargin;
            x = start + Math.random() * (end - start);
            y = direction === 1 ? 0 : canvas.height;
            break;
        }
    }

    return { id, x, y, width: pedestrianData.size, height: pedestrianData.size, speed: pedestrianData.speed + Math.random() * 0.5, path, direction, state: 'walking', pedestrianImg };
};

export const updatePedestrianPosition = (
    pedestrian: Pedestrian,
    geometry: WorldGeometry,
    pedestrianGreen: boolean
): void => {
    const axis = getAxis(pedestrian.path);
    const stopPos = getStopPosition(pedestrian, geometry);
    const crossPos = getCrossTarget(pedestrian, geometry);
    const delta = pedestrian.direction * pedestrian.speed;

    if (pedestrian.state === 'walking') {
        const reached = pedestrian.direction === 1
            ? pedestrian[axis] < stopPos && pedestrian[axis] + pedestrian.speed >= stopPos
            : pedestrian[axis] > stopPos && pedestrian[axis] - pedestrian.speed <= stopPos;

        if (reached) {
            pedestrian[axis] = stopPos;
            pedestrian.state = pedestrianGreen ? 'crossing' : 'waiting';
        } else {
            pedestrian[axis] += delta;
        }
        return;
    }

    if (pedestrian.state === 'waiting') {
        if (pedestrianGreen) pedestrian.state = 'crossing';
        return;
    }

    if (pedestrian.state === 'crossing') {
        const doneCrossing = pedestrian.direction === 1
            ? pedestrian[axis] + pedestrian.speed >= crossPos
            : pedestrian[axis] - pedestrian.speed <= crossPos;

        if (doneCrossing) {
            pedestrian[axis] = crossPos;
            pedestrian.state = 'walking';  
        } else {
            pedestrian[axis] += delta;
        }
    }
};

export const shouldRemovePedestrian = (
    pedestrian: Pedestrian, 
    geometry: WorldGeometry
): boolean => {
    const buffer = 20;
    return (
        pedestrian.x < -buffer ||
        pedestrian.x > geometry.canvas.width  + buffer ||
        pedestrian.y < -buffer ||
        pedestrian.y > geometry.canvas.height + buffer
    );
};

export const getWaitingCounts = (
    pedestrians: Map<string, Pedestrian>
): Record<PedestrianPath, number> => {
    const counts: Record<PedestrianPath, number> = { north: 0, south: 0, west: 0, east: 0 };
    pedestrians.forEach(p => {
        if (p.state === 'waiting') counts[p.path]++;
    });
    return counts;
};
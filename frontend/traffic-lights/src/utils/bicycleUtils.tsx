import type { Bicycle, Pedestrian, PedestrianPath, WorldGeometry } from '../types';
import { getStopPosition, getCrossTarget, getAxis } from './crossUtils';

export const spawnBicycle = (
    id: string,
    path: PedestrianPath,
    geometry: WorldGeometry,
    bikeImg: string,
    speed: number,
    size: number
): Bicycle => {
    const { canvas, bikeLanes } = geometry;
    const direction = Math.random() > 0.5 ? 1 : -1;
    let x = 0, y = 0;

    switch (path) {
        case 'north': y = bikeLanes.top.y + bikeLanes.top.height    / 2; x = direction === 1 ? 0 : canvas.width;  break;
        case 'south': y = bikeLanes.bottom.y + bikeLanes.bottom.height / 2; x = direction === 1 ? 0 : canvas.width;  break;
        case 'west':  x = bikeLanes.left.x + bikeLanes.left.width    / 2; y = direction === 1 ? 0 : canvas.height; break;
        case 'east':  x = bikeLanes.right.x + bikeLanes.right.width   / 2; y = direction === 1 ? 0 : canvas.height; break;
    }

    return { id, x, y, size, speed: speed + Math.random() * 0.5, path, direction, state: 'riding', bikeImg };
};

const isBlockedByPedestrian = (
    bicycle: Bicycle, 
    pedestrians: Map<string, Pedestrian>
): boolean => {
    const axis = getAxis(bicycle.path);
    return Array.from(pedestrians.values()).some(p => {
        const dist = Math.sqrt((p.x - bicycle.x) ** 2 + (p.y - bicycle.y) ** 2);
        if (dist > 30) return false;
        if (axis === 'x') return bicycle.direction === 1 ? p.x > bicycle.x : p.x < bicycle.x;
        else return bicycle.direction === 1 ? p.y > bicycle.y : p.y < bicycle.y;
    });
};

export const updateBicyclePosition = (
    bicycle: Bicycle,
    pedestrians: Map<string, Pedestrian>,
    geometry: WorldGeometry,
    pedestrianGreen: boolean
): void => {
    if (isBlockedByPedestrian(bicycle, pedestrians)) return;

    const axis     = getAxis(bicycle.path);
    const stopPos  = getStopPosition(bicycle, geometry);
    const crossPos = getCrossTarget(bicycle, geometry);
    const delta    = bicycle.direction * bicycle.speed;

    if (bicycle.state === 'riding') {
        const reached = bicycle.direction === 1
            ? bicycle[axis] < stopPos  && bicycle[axis] + bicycle.speed >= stopPos
            : bicycle[axis] > stopPos  && bicycle[axis] - bicycle.speed <= stopPos;
        if (reached) {
            bicycle[axis] = stopPos;
            bicycle.state = pedestrianGreen ? 'crossing' : 'waiting';
        } else {
            bicycle[axis] += delta;
        }
        return;
    }

    if (bicycle.state === 'waiting') {
        if (pedestrianGreen) bicycle.state = 'crossing';
        return;
    }

    if (bicycle.state === 'crossing') {
        const done = bicycle.direction === 1
            ? bicycle[axis] + bicycle.speed >= crossPos
            : bicycle[axis] - bicycle.speed <= crossPos;
        if (done) {
            bicycle[axis] = crossPos;
            bicycle.state = 'riding';
        } else {
            bicycle[axis] += delta;
        }
    }
};

export const shouldRemoveBicycle = (
    bicycle: Bicycle, 
    geometry: WorldGeometry
): boolean => {
    const buffer = 20;
    return bicycle.x < -buffer || bicycle.x > geometry.canvas.width  + buffer ||
           bicycle.y < -buffer || bicycle.y > geometry.canvas.height + buffer;
};
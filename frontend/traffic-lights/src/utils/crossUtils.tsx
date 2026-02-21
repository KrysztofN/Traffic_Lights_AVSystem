import type { PedestrianPath, WorldGeometry, Crossable } from '../types';

export const getStopPosition = (entity: Crossable, geometry: WorldGeometry): number => {
    const { center, config } = geometry;
    const half = config.roadWidth / 2;
    const margin = 10;
    switch (entity.path) {
        case 'north': case 'south':
            return entity.direction === 1 ? center.x - half - margin : center.x + half + margin;
        case 'west': case 'east':
            return entity.direction === 1 ? center.y - half - margin : center.y + half + margin;
    }
};

export const getCrossTarget = (entity: Crossable, geometry: WorldGeometry): number => {
    const { center, config } = geometry;
    const half = config.roadWidth / 2;
    const margin = 4;
    switch (entity.path) {
        case 'north': case 'south':
            return entity.direction === 1 ? center.x + half + margin : center.x - half - margin;
        case 'west': case 'east':
            return entity.direction === 1 ? center.y + half + margin : center.y - half - margin;
    }
};

export const getAxis = (path: PedestrianPath): 'x' | 'y' =>
    path === 'north' || path === 'south' ? 'x' : 'y';
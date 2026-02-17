import type { WorldGeometry, Line } from '../types';

export const drawLine = (
    ctx: CanvasRenderingContext2D,
    line: Line
): void => {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
};

export const drawCrossroad = (
    ctx: CanvasRenderingContext2D,
    geometry: WorldGeometry
): void => {
    const { config, grass, pavements, bikeLanes, roads, laneLines, stopLines, zebraCrossings } = geometry;
    const { numOfLanes } = config;

    // Trawa
    ctx.fillStyle = '#2e6509';
    ctx.fillRect(grass.x, grass.y, grass.width, grass.height);

    // Chodniki
    ctx.fillStyle = 'grey';
    Object.values(pavements).forEach(pavement => {
        ctx.fillRect(pavement.x, pavement.y, pavement.width, pavement.height);
    });

    // Ścieżki rowerowe
    ctx.fillStyle = '#784141';
    Object.values(bikeLanes).forEach(lane => {
        ctx.fillRect(lane.x, lane.y, lane.width, lane.height);
    });

    // Drogi
    ctx.fillStyle = '#444040';
    ctx.fillRect(roads.horizontal.x, roads.horizontal.y, roads.horizontal.width, roads.horizontal.height);
    ctx.fillRect(roads.vertical.x, roads.vertical.y, roads.vertical.width, roads.vertical.height);

    // Linie rozdzielające
    if (numOfLanes === 1) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        laneLines.forEach(line => drawLine(ctx, line));
    } else {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        laneLines.slice(0, 8).forEach(line => drawLine(ctx, line));

        if (laneLines.length > 8) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 15]);
            laneLines.slice(8).forEach(line => drawLine(ctx, line));
        }
    }

    // Linie stopu
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    stopLines.forEach(line => drawLine(ctx, line));

    // Przejście dla pieszych
    ctx.fillStyle = 'white';
    Object.values(zebraCrossings).forEach(crossing => {
        crossing.stripes.forEach(stripe => {
            ctx.fillRect(stripe.x, stripe.y, stripe.width, stripe.height);
        });
    });
};

export const drawVehicle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    direction: string,
    image?: HTMLImageElement
): void => {
    ctx.save();
    ctx.translate(x, y);

    let angle = 0;
    if (direction === 'north') angle = -Math.PI / 2;
    if (direction === 'south') angle = Math.PI / 2;
    if (direction === 'east') angle = 0;
    if (direction === 'west') angle = Math.PI;

    ctx.rotate(angle);

    if (image?.complete) {
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
    }

    ctx.restore();
};

export const drawTrafficLights = (
    ctx: CanvasRenderingContext2D,
    geometry: WorldGeometry,
    lights: Record<string, 'red' | 'yellow' | 'green'>
): void => {
    const { center, config } = geometry;
    const roadHalfWidth = config.numOfLanes * config.laneWidth;
    const bikeLaneWidth = config.bikeLaneWidth;
    const pavementWidth = config.pavementWidth;

    const grassOffset = roadHalfWidth + bikeLaneWidth + pavementWidth + 30;
    
    const arrowConfigs = {
        north: { 
            x: center.x - grassOffset, 
            y: center.y - grassOffset,
            rotation: Math.PI * 2 
        },
        south: { 
            x: center.x + grassOffset, 
            y: center.y + grassOffset,
            rotation: -Math.PI  
        },
        east: { 
            x: center.x + grassOffset, 
            y: center.y - grassOffset,
            rotation: Math.PI / 2 
        },
        west: { 
            x: center.x - grassOffset, 
            y: center.y + grassOffset,
            rotation: -Math.PI / 2
        }
    };

    Object.entries(arrowConfigs).forEach(([startRoad, config]) => {
        const lightState = lights[startRoad] ?? 'red';
        drawArrowSet(ctx, config.x, config.y, config.rotation, lightState);
    });
};

const drawArrowSet = (
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    rotation: number,
    lightState: 'red' | 'yellow' | 'green'
): void => {
    const arrowSize = 25;  
    const spacing = 30;    
    
    const color = lightState === 'green' ? '#00ff26' : 
                  lightState === 'yellow' ? '#ffdd00' : '#af0000';

    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(rotation);
    ctx.fillStyle = color;

    const arrowPositions = [
        { x: -spacing, y: 0, turnAngle: Math.PI },      // Lewa
        { x: 0, y: 0, turnAngle: Math.PI / 2 },         // Środkowa
        { x: spacing, y: 0, turnAngle: Math.PI * 2 },   // Prawa
    ];

    arrowPositions.forEach(pos => {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.turnAngle);
        drawSingleArrow(ctx, arrowSize);
        ctx.restore();
    });

    ctx.restore();
};

const drawSingleArrow = (ctx: CanvasRenderingContext2D, size: number): void => {
    ctx.beginPath();
    ctx.moveTo(-size/2, -size/2);  
    ctx.lineTo(size/2, 0);         
    ctx.lineTo(-size/2, size/2);   
    ctx.lineTo(-size/4, 0);        
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.stroke();
};
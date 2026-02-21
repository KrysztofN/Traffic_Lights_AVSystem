import type { WorldGeometry, Line, LightMap, LightState, MovementLights, Pedestrian, Bicycle } from '../types';

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
    lights: LightMap,
    conditionalBlink: boolean
): void => {
    const { center, config } = geometry;
    const roadHalfWidth = config.numOfLanes * config.laneWidth;
    const grassOffset = roadHalfWidth + config.bikeLaneWidth + config.pavementWidth + 30;

    const arrowConfigs = {
        north: { x: center.x - grassOffset, y: center.y - grassOffset, rotation: Math.PI * 2 },
        south: { x: center.x + grassOffset, y: center.y + grassOffset, rotation: -Math.PI },
        east:  { x: center.x + grassOffset, y: center.y - grassOffset, rotation: Math.PI / 2 },
        west:  { x: center.x - grassOffset, y: center.y + grassOffset, rotation: -Math.PI / 2 },
    };

    Object.entries(arrowConfigs).forEach(([road, cfg]) => {
        drawArrowSet(ctx, cfg.x, cfg.y, cfg.rotation, lights[road as keyof LightMap], conditionalBlink);
    });
};

const lightToColor = (state: LightState, blink: boolean): string => {
    if (state === 'green') return '#00ff26';
    if (state === 'yellow') return '#ffdd00';
    if (state === 'conditional') return blink ? '#00ff26' : '#006f00'; 
    return '#af0000';
};

const drawArrowSet = (
    ctx: CanvasRenderingContext2D,
    baseX: number, baseY: number, rotation: number,
    lights: MovementLights,
    blink: boolean
): void => {
    const arrowSize = 25;
    const spacing = 30;

    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(rotation);

    const arrows = [
        { x: -spacing, y: 0, turnAngle: Math.PI, color: lightToColor(lights.right, blink) },
        { x: 0, y: 0, turnAngle: Math.PI / 2, color: lightToColor(lights.straight, blink) },
        { x: spacing,  y: 0, turnAngle: Math.PI * 2, color: lightToColor(lights.left, blink) },
    ];

    arrows.forEach(({ x, y, turnAngle, color }) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(turnAngle);
        ctx.fillStyle = color;
        drawSingleArrow(ctx, arrowSize);
        ctx.restore();
    });

    ctx.restore();
};

const drawSingleArrow = (
    ctx: CanvasRenderingContext2D, 
    size: number
): void => {
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

export const drawPedestrian = (
    ctx: CanvasRenderingContext2D,
    pedestrian: Pedestrian,
    image?: HTMLImageElement
): void => {
    const { x, y, width, height, path, direction } = pedestrian;
    ctx.save();
    ctx.translate(x, y);
    let angle = 0;
    if (path === 'north' || path === 'south') angle = direction === 1 ? Math.PI / 2 : -Math.PI / 2;
    if (path === 'west' || path === 'east') angle = direction === 1 ? Math.PI : 0;
    ctx.rotate(angle);
    if (image?.complete) {
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
    }
    ctx.restore();
};

export const drawPedestrianLights = (
    ctx: CanvasRenderingContext2D,
    geometry: WorldGeometry,
    pedestrianGreen: boolean
): void => {
    const { center, config } = geometry;
    const half = config.roadWidth / 2;
    const offset = 12;
    const color = pedestrianGreen ? '#00ff26' : '#cc0000';

    [
        { x: center.x - half - offset, y: center.y - half - offset },
        { x: center.x + half + offset, y: center.y - half - offset },
        { x: center.x - half - offset, y: center.y + half + offset },
        { x: center.x + half + offset, y: center.y + half + offset },
    ].forEach(({ x, y }) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
};

export const drawBicycle = (
    ctx: CanvasRenderingContext2D,
    bicycle: Bicycle,
    image?: HTMLImageElement
): void => {
    ctx.save();
    ctx.translate(bicycle.x, bicycle.y);
    const angle = bicycle.path === 'north' || bicycle.path === 'south'
        ? (bicycle.direction === 1 ? Math.PI / 2 : -Math.PI / 2)
        : (bicycle.direction === 1 ? Math.PI : 0);
    ctx.rotate(angle);
    if (image?.complete) ctx.drawImage(image, -bicycle.size / 2, -bicycle.size / 2, bicycle.size, bicycle.size);
    ctx.restore();
};
import type { Config, WorldGeometry, Line, Rectangle } from '../types';

export const generateWorldGeometry = (
    canvasWidth: number,
    canvasHeight: number,
    config: Config
): WorldGeometry => {
    const { count: numOfLanes, laneWidth } = config.lanes;
    const { zebraWidth, zebraGap, zebraLength, zebraMargin } = config.zebra;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const roadWidth = numOfLanes * laneWidth * 2;
    const stopLineDistance = roadWidth / 2 + 80;
    const zebraCount = Math.floor((roadWidth - 8) / (zebraWidth + zebraGap));
    const pavementWidth = zebraLength + 10;
    const bikeLaneWidth = pavementWidth / 3;
    const zebraOffset = (roadWidth - (zebraCount * zebraWidth + (zebraCount - 1) * zebraGap)) / 2;

    const geometry: WorldGeometry = {
        canvas: {
            width: canvasWidth,
            height: canvasHeight
        },
        center: {
            x: centerX,
            y: centerY,
        },
        config: {
            numOfLanes,
            laneWidth,
            roadWidth,
            stopLineDistance,
            pavementWidth,
            bikeLaneWidth,
            zebraWidth,
            zebraGap,
            zebraLength,
            zebraMargin
        },
        grass: {
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight
        },
        pavements: {
            top: {
                x: 0,
                y: centerY - roadWidth / 2 - pavementWidth,
                width: canvasWidth,
                height: pavementWidth
            },
            bottom: {
                x: 0,
                y: centerY + roadWidth / 2,
                width: canvasWidth,
                height: pavementWidth
            },
            left: {
                x: centerX - roadWidth / 2 - pavementWidth,
                y: 0,
                width: pavementWidth,
                height: canvasHeight
            },
            right: {
                x: centerX + roadWidth / 2,
                y: 0,
                width: pavementWidth,
                height: canvasHeight
            }
        },
        bikeLanes: {
            top: {
                x: 0,
                y: centerY - roadWidth / 2 - pavementWidth,
                width: canvasWidth,
                height: bikeLaneWidth
            },
            bottom: {
                x: 0,
                y: centerY + roadWidth / 2 + pavementWidth - bikeLaneWidth,
                width: canvasWidth,
                height: bikeLaneWidth
            },
            left: {
                x: centerX - roadWidth / 2 - pavementWidth,
                y: 0,
                width: bikeLaneWidth,
                height: canvasHeight
            },
            right: {
                x: centerX + roadWidth / 2 + pavementWidth - bikeLaneWidth,
                y: 0,
                width: bikeLaneWidth,
                height: canvasHeight
            }
        },
        roads: {
            horizontal: {
                x: 0,
                y: centerY - roadWidth / 2,
                width: canvasWidth,
                height: roadWidth
            },
            vertical: {
                x: centerX - roadWidth / 2,
                y: 0,
                width: roadWidth,
                height: canvasHeight
            }
        },
        laneLines: generateLaneLines(centerX, centerY, roadWidth, stopLineDistance, numOfLanes, laneWidth, canvasWidth, canvasHeight),
        stopLines: generateStopLines(centerX, centerY, roadWidth, stopLineDistance),
        zebraCrossings: generateZebraCrossings(centerX, centerY, roadWidth, stopLineDistance, zebraCount, zebraWidth, zebraGap, zebraLength, zebraMargin, zebraOffset)
    };

    return geometry;
};

const generateLaneLines = (
    centerX: number,
    centerY: number,
    roadWidth: number,
    stopLineDistance: number,
    numOfLanes: number,
    laneWidth: number,
    canvasWidth: number,
    canvasHeight: number
): Line[] => {
    const lines: Line[] = [];

    if (numOfLanes === 1) {
        lines.push(
            { x1: 0, y1: centerY, x2: centerX - stopLineDistance - 20, y2: centerY },
            { x1: centerX + stopLineDistance + 20, y1: centerY, x2: canvasWidth, y2: centerY },
            { x1: centerX, y1: 0, x2: centerX, y2: centerY - stopLineDistance - 20 },
            { x1: centerX, y1: centerY + stopLineDistance + 20, x2: centerX, y2: canvasHeight }
        );
    } else {
        const doubleLineGap = 6;
        
        lines.push(
            { x1: 0, y1: centerY - doubleLineGap / 2, x2: centerX - stopLineDistance - 10, y2: centerY - doubleLineGap / 2 },
            { x1: centerX + stopLineDistance + 10, y1: centerY - doubleLineGap / 2, x2: canvasWidth, y2: centerY - doubleLineGap / 2 },
            { x1: 0, y1: centerY + doubleLineGap / 2, x2: centerX - stopLineDistance - 10, y2: centerY + doubleLineGap / 2 },
            { x1: centerX + stopLineDistance + 10, y1: centerY + doubleLineGap / 2, x2: canvasWidth, y2: centerY + doubleLineGap / 2 },
            { x1: centerX - doubleLineGap / 2, y1: 0, x2: centerX - doubleLineGap / 2, y2: centerY - stopLineDistance - 10 },
            { x1: centerX - doubleLineGap / 2, y1: centerY + stopLineDistance + 10, x2: centerX - doubleLineGap / 2, y2: canvasHeight },
            { x1: centerX + doubleLineGap / 2, y1: 0, x2: centerX + doubleLineGap / 2, y2: centerY - stopLineDistance - 10 },
            { x1: centerX + doubleLineGap / 2, y1: centerY + stopLineDistance + 10, x2: centerX + doubleLineGap / 2, y2: canvasHeight }
        );

        for (let i = 1; i < numOfLanes; i++) {
            const yTop = centerY - roadWidth / 2 + (i * laneWidth);
            const yBottom = centerY + roadWidth / 2 - (i * laneWidth);
            const xLeft = centerX - roadWidth / 2 + (i * laneWidth);
            const xRight = centerX + roadWidth / 2 - (i * laneWidth);

            lines.push(
                { x1: 0, y1: yTop, x2: centerX - stopLineDistance - 10, y2: yTop },
                { x1: centerX + stopLineDistance + 10, y1: yTop, x2: canvasWidth, y2: yTop },
                { x1: 0, y1: yBottom, x2: centerX - stopLineDistance - 10, y2: yBottom },
                { x1: centerX + stopLineDistance + 10, y1: yBottom, x2: canvasWidth, y2: yBottom },
                { x1: xLeft, y1: 0, x2: xLeft, y2: centerY - stopLineDistance - 10 },
                { x1: xLeft, y1: centerY + stopLineDistance + 10, x2: xLeft, y2: canvasHeight },
                { x1: xRight, y1: 0, x2: xRight, y2: centerY - stopLineDistance - 10 },
                { x1: xRight, y1: centerY + stopLineDistance + 10, x2: xRight, y2: canvasHeight }
            );
        }
    }

    return lines;
};

const generateStopLines = (
    centerX: number,
    centerY: number,
    roadWidth: number,
    stopLineDistance: number
): Line[] => {
    return [
        { x1: centerX - stopLineDistance, y1: centerY, x2: centerX - stopLineDistance, y2: centerY + roadWidth / 2 },
        { x1: centerX + stopLineDistance, y1: centerY, x2: centerX + stopLineDistance, y2: centerY - roadWidth / 2 },
        { x1: centerX, y1: centerY - stopLineDistance, x2: centerX - roadWidth / 2, y2: centerY - stopLineDistance },
        { x1: centerX, y1: centerY + stopLineDistance, x2: centerX + roadWidth / 2, y2: centerY + stopLineDistance }
    ];
};

const generateZebraCrossings = (
    centerX: number,
    centerY: number,
    roadWidth: number,
    stopLineDistance: number,
    zebraCount: number,
    zebraWidth: number,
    zebraGap: number,
    zebraLength: number,
    zebraMargin: number,
    zebraOffset: number
) => {
    const crossings = {
        top: { stripes: [] as Rectangle[], direction: 'vertical' as const },
        bottom: { stripes: [] as Rectangle[], direction: 'vertical' as const },
        left: { stripes: [] as Rectangle[], direction: 'horizontal' as const },
        right: { stripes: [] as Rectangle[], direction: 'horizontal' as const },
    };

    for (let i = 0; i < zebraCount; i++) {
        const y = centerY - roadWidth / 2 + zebraOffset + (i * (zebraWidth + zebraGap));
        const x = centerX - roadWidth / 2 + zebraOffset + (i * (zebraWidth + zebraGap));

        crossings.top.stripes.push({ 
            x: centerX - stopLineDistance + zebraMargin, 
            y, 
            width: zebraLength, 
            height: zebraWidth 
        });
        crossings.bottom.stripes.push({ 
            x: centerX + stopLineDistance - zebraLength - zebraMargin, 
            y, 
            width: zebraLength, 
            height: zebraWidth 
        });
        crossings.left.stripes.push({ 
            x, 
            y: centerY - stopLineDistance + zebraMargin, 
            width: zebraWidth, 
            height: zebraLength 
        });
        crossings.right.stripes.push({ 
            x, 
            y: centerY + stopLineDistance - zebraLength - zebraMargin, 
            width: zebraWidth, 
            height: zebraLength 
        });
    }

    return crossings;
};
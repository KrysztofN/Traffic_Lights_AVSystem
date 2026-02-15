import { useEffect, useRef, useState } from 'react';
import { type Config, type WorldGeometry, type TrafficWorldProps } from '../common/types';

function generateWorldGeometry(canvasWidth: number, canvasHeight: number, NUM_OF_LANES: number): WorldGeometry {
    const centerX: number = canvasWidth / 2;
    const centerY: number = canvasHeight / 2;
    
    const laneWidth: number = 40;
    const roadWidth: number = NUM_OF_LANES * laneWidth * 2;
    const stopLineDistance: number = roadWidth / 2 + 80;
    const zebraWidth: number = 8;
    const zebraGap: number = 8;
    const zebraLength: number = 60;
    const zebraCount: number = Math.floor((roadWidth - 8) / (zebraWidth + zebraGap));
    const pavementWidth: number = zebraLength + 10;
    const bikeLaneWidth: number = pavementWidth / 3;
    const totalZebraHeight: number = zebraCount * zebraWidth + (zebraCount - 1) * zebraGap;
    const zebraOffset: number = (roadWidth - totalZebraHeight) / 2;
    const zebraMargin: number = 15;

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
            numOfLanes: NUM_OF_LANES,
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
        laneLines: [],
        stopLines: [],
        zebraCrossings: {
            top: { stripes: [], direction: 'vertical' },
            bottom: { stripes: [], direction: 'vertical' },
            left: { stripes: [], direction: 'horizontal' },
            right: { stripes: [], direction: 'horizontal' },
        }
    };

    if (NUM_OF_LANES === 1) {
        geometry.laneLines.push(
            { x1: 0, y1: centerY, x2: centerX - stopLineDistance - 20, y2: centerY },
            { x1: centerX + stopLineDistance + 20, y1: centerY, x2: canvasWidth, y2: centerY },
            { x1: centerX, y1: 0, x2: centerX, y2: centerY - stopLineDistance - 20 },
            { x1: centerX, y1: centerY + stopLineDistance + 20, x2: centerX, y2: canvasHeight }
        );
    } else {
        const doubleLineGap: number = 6;
        geometry.laneLines.push(
            { x1: 0, y1: centerY - doubleLineGap / 2, x2: centerX - stopLineDistance - 10, y2: centerY - doubleLineGap / 2 },
            { x1: centerX + stopLineDistance + 10, y1: centerY - doubleLineGap / 2, x2: canvasWidth, y2: centerY - doubleLineGap / 2 },
            { x1: 0, y1: centerY + doubleLineGap / 2, x2: centerX - stopLineDistance - 10, y2: centerY + doubleLineGap / 2 },
            { x1: centerX + stopLineDistance + 10, y1: centerY + doubleLineGap / 2, x2: canvasWidth, y2: centerY + doubleLineGap / 2 },
        );
        geometry.laneLines.push(
            { x1: centerX - doubleLineGap / 2, y1: 0, x2: centerX - doubleLineGap / 2, y2: centerY - stopLineDistance - 10 },
            { x1: centerX - doubleLineGap / 2, y1: centerY + stopLineDistance + 10, x2: centerX - doubleLineGap / 2, y2: canvasHeight },
            { x1: centerX + doubleLineGap / 2, y1: 0, x2: centerX + doubleLineGap / 2, y2: centerY - stopLineDistance - 10 },
            { x1: centerX + doubleLineGap / 2, y1: centerY + stopLineDistance + 10, x2: centerX + doubleLineGap / 2, y2: canvasHeight }
        );       
    }

    if (NUM_OF_LANES > 1) {
        for (let i = 1; i < NUM_OF_LANES; i++) {
            const yTop: number = centerY - roadWidth / 2 + (i * laneWidth);
            const yBottom: number = centerY + roadWidth / 2 - (i * laneWidth);
            geometry.laneLines.push(
                { x1: 0, y1: yTop, x2: centerX - stopLineDistance - 10, y2: yTop },
                { x1: centerX + stopLineDistance + 10, y1: yTop, x2: canvasWidth, y2: yTop },
                { x1: 0, y1: yBottom, x2: centerX - stopLineDistance - 10, y2: yBottom },
                { x1: centerX + stopLineDistance + 10, y1: yBottom, x2: canvasWidth, y2: yBottom }
            );

            const xLeft: number = centerX - roadWidth / 2 + (i * laneWidth);
            const xRight: number = centerX + roadWidth / 2 - (i * laneWidth);
            geometry.laneLines.push(
                { x1: xLeft, y1: 0, x2: xLeft, y2: centerY - stopLineDistance - 10 },
                { x1: xLeft, y1: centerY + stopLineDistance + 10, x2: xLeft, y2: canvasHeight },
                { x1: xRight, y1: 0, x2: xRight, y2: centerY - stopLineDistance - 10 },
                { x1: xRight, y1: centerY + stopLineDistance + 10, x2: xRight, y2: canvasHeight }
            );
        }
    }

    if (NUM_OF_LANES === 1) {
        geometry.stopLines.push(
            { x1: centerX - stopLineDistance, y1: centerY, x2: centerX - stopLineDistance, y2: centerY + roadWidth / 2 },
            { x1: centerX + stopLineDistance, y1: centerY, x2: centerX + stopLineDistance, y2: centerY - roadWidth / 2 },
            { x1: centerX, y1: centerY - stopLineDistance, x2: centerX - roadWidth / 2, y2: centerY - stopLineDistance },
            { x1: centerX, y1: centerY + stopLineDistance, x2: centerX + roadWidth / 2, y2: centerY + stopLineDistance }
        );
    } else {
        geometry.stopLines.push(
            { x1: centerX - stopLineDistance, y1: centerY - roadWidth / 2, x2: centerX - stopLineDistance, y2: centerY + roadWidth / 2 },
            { x1: centerX + stopLineDistance, y1: centerY - roadWidth / 2, x2: centerX + stopLineDistance, y2: centerY + roadWidth / 2 },
            { x1: centerX - roadWidth / 2, y1: centerY - stopLineDistance, x2: centerX + roadWidth / 2, y2: centerY - stopLineDistance },
            { x1: centerX - roadWidth / 2, y1: centerY + stopLineDistance, x2: centerX + roadWidth / 2, y2: centerY + stopLineDistance }
        );
    }

    for (let i = 0; i < zebraCount; i++) {
        const y: number = centerY - roadWidth / 2 + zebraOffset + (i * (zebraWidth + zebraGap));
        const x: number = centerX - roadWidth / 2 + zebraOffset + (i * (zebraWidth + zebraGap));
        geometry.zebraCrossings.top.stripes.push({ x: centerX - stopLineDistance + zebraMargin, y, width: zebraLength, height: zebraWidth });
        geometry.zebraCrossings.bottom.stripes.push({ x: centerX + stopLineDistance - zebraLength - zebraMargin, y, width: zebraLength, height: zebraWidth });
        geometry.zebraCrossings.left.stripes.push({ x, y: centerY - stopLineDistance + zebraMargin, width: zebraWidth, height: zebraLength });
        geometry.zebraCrossings.right.stripes.push({ x, y: centerY + stopLineDistance - zebraLength - zebraMargin, width: zebraWidth, height: zebraLength });
    }

    return geometry;
}

const TrafficWorld: React.FC<TrafficWorldProps> = ({ onGeometryReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [numOfLanes, setNumOfLanes] = useState<number>(1);
    const [worldGeometry, setWorldGeometry] = useState<WorldGeometry | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const config = await fetch('/config/main.json');
        const configData: Config = await config.json();
        setNumOfLanes(configData.lanes.count);
    };

    useEffect(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const geometry = generateWorldGeometry(canvas.width, canvas.height, numOfLanes);
            setWorldGeometry(geometry);
            drawCrossroad(ctx, geometry);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [numOfLanes]);

    useEffect(() => {
        if (worldGeometry && onGeometryReady){
            onGeometryReady(worldGeometry);
        }
    }, [worldGeometry]);

    return (
        <canvas 
            ref={canvasRef} 
            id="road"
            style={{ display: 'block' }}
        />
    );
};

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawCrossroad(ctx: CanvasRenderingContext2D, geometry: WorldGeometry): void {
    const { config, grass, pavements, bikeLanes, roads, laneLines, stopLines, zebraCrossings } = geometry;
    const { numOfLanes } = config;

    ctx.fillStyle = '#2e6509';
    ctx.fillRect(grass.x, grass.y, grass.width, grass.height);

    ctx.fillStyle = 'grey';
    ctx.fillRect(pavements.top.x, pavements.top.y, pavements.top.width, pavements.top.height);
    ctx.fillRect(pavements.bottom.x, pavements.bottom.y, pavements.bottom.width, pavements.bottom.height);
    ctx.fillRect(pavements.left.x, pavements.left.y, pavements.left.width, pavements.left.height);
    ctx.fillRect(pavements.right.x, pavements.right.y, pavements.right.width, pavements.right.height);

    ctx.fillStyle = '#784141';
    ctx.fillRect(bikeLanes.top.x, bikeLanes.top.y, bikeLanes.top.width, bikeLanes.top.height);
    ctx.fillRect(bikeLanes.bottom.x, bikeLanes.bottom.y, bikeLanes.bottom.width, bikeLanes.bottom.height);
    ctx.fillRect(bikeLanes.left.x, bikeLanes.left.y, bikeLanes.left.width, bikeLanes.left.height);
    ctx.fillRect(bikeLanes.right.x, bikeLanes.right.y, bikeLanes.right.width, bikeLanes.right.height);

    ctx.fillStyle = '#444040';
    ctx.fillRect(roads.horizontal.x, roads.horizontal.y, roads.horizontal.width, roads.horizontal.height);
    ctx.fillRect(roads.vertical.x, roads.vertical.y, roads.vertical.width, roads.vertical.height);

    if (numOfLanes === 1) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);

        laneLines.forEach(line => {
            drawLine(ctx, line.x1, line.y1, line.x2, line.y2);
        });
    } else {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        for (let i = 0; i < Math.min(8, laneLines.length); i++) {
            const line = laneLines[i];
            drawLine(ctx, line.x1, line.y1, line.x2, line.y2);
        }

        if (numOfLanes > 1) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 15]);

            for (let i = 8; i < laneLines.length; i++) {
                const line = laneLines[i];
                drawLine(ctx, line.x1, line.y1, line.x2, line.y2);
            }
        }

        ctx.setLineDash([]);
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);

    stopLines.forEach(line => {
        drawLine(ctx, line.x1, line.y1, line.x2, line.y2);
    });

    ctx.fillStyle = 'white';

    Object.values(zebraCrossings).forEach(crossing => {
        crossing.stripes.forEach(stripe => {
            ctx.fillRect(stripe.x, stripe.y, stripe.width, stripe.height);
        });
    });
}

export default TrafficWorld;
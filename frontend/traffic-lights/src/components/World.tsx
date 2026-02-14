import { useEffect, useRef, useState } from 'react';

interface Config {
    lanes: {
        count: number;
    };
}

const TrafficWorld: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [numOfLanes, setNumOfLanes] = useState<number>(1);

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
            drawCrossroad(canvas, ctx, numOfLanes);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [numOfLanes]);

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

function drawCrossroad(canvas: HTMLCanvasElement,ctx: CanvasRenderingContext2D, NUM_OF_LANES: number): void {
    const centerX: number = canvas.width / 2;
    const centerY: number = canvas.height / 2;
    
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

    // Trawa
    ctx.fillStyle = '#2e6509';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chodniki
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, centerY - roadWidth / 2 - pavementWidth, canvas.width, pavementWidth);
    ctx.fillRect(0, centerY + roadWidth / 2, canvas.width, pavementWidth);
    ctx.fillRect(centerX + roadWidth / 2, 0, pavementWidth, canvas.height);
    ctx.fillRect(centerX - roadWidth / 2 - pavementWidth, 0, pavementWidth, canvas.height);

    // Droga dla rowerów
    ctx.fillStyle = '#784141';
    ctx.fillRect(0, centerY - roadWidth / 2 - pavementWidth, canvas.width, bikeLaneWidth);
    ctx.fillRect(0, centerY + roadWidth / 2 + pavementWidth - bikeLaneWidth, canvas.width, bikeLaneWidth);
    ctx.fillRect(centerX + roadWidth / 2 + pavementWidth - bikeLaneWidth, 0, bikeLaneWidth, canvas.height);
    ctx.fillRect(centerX - roadWidth / 2 - pavementWidth, 0, bikeLaneWidth, canvas.height);

    // Droga
    ctx.fillStyle = '#444040';
    ctx.fillRect(0, centerY - roadWidth / 2, canvas.width, roadWidth);
    ctx.fillRect(centerX - roadWidth / 2, 0, roadWidth, canvas.height);

    // Biuro
    const buildingWidth: number = 100;
    const buildingHeight: number = 70;

    ctx.fillStyle = 'black';
    ctx.fillRect(
        centerX - roadWidth / 2 - pavementWidth - 150 - buildingWidth,
        centerY - roadWidth / 2 - pavementWidth - 150 - buildingHeight,
        buildingWidth,
        buildingHeight
    );
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(
        'Office',
        centerX - roadWidth / 2 - pavementWidth - 150 - buildingWidth + 10,
        centerY - roadWidth / 2 - pavementWidth - 150 - buildingHeight + 30
    );

    // Linie rozdzielające
    if (NUM_OF_LANES === 1) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);

        drawLine(ctx, 0, centerY, centerX - stopLineDistance - 20, centerY);
        drawLine(ctx, centerX + stopLineDistance + 20, centerY, canvas.width, centerY);
        drawLine(ctx, centerX, 0, centerX, centerY - stopLineDistance - 20);
        drawLine(ctx, centerX, centerY + stopLineDistance + 20, centerX, canvas.height);

        ctx.setLineDash([]);
    } else {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        const doubleLineGap: number = 6;

        drawLine(ctx, 0, centerY - doubleLineGap / 2, centerX - stopLineDistance - 10, centerY - doubleLineGap / 2);
        drawLine(ctx, centerX + stopLineDistance + 10, centerY - doubleLineGap / 2, canvas.width, centerY - doubleLineGap / 2);
        drawLine(ctx, 0, centerY + doubleLineGap / 2, centerX - stopLineDistance - 10, centerY + doubleLineGap / 2);
        drawLine(ctx, centerX + stopLineDistance + 10, centerY + doubleLineGap / 2, canvas.width, centerY + doubleLineGap / 2);

        drawLine(ctx, centerX - doubleLineGap / 2, 0, centerX - doubleLineGap / 2, centerY - stopLineDistance - 10);
        drawLine(ctx, centerX - doubleLineGap / 2, centerY + stopLineDistance + 10, centerX - doubleLineGap / 2, canvas.height);
        drawLine(ctx, centerX + doubleLineGap / 2, 0, centerX + doubleLineGap / 2, centerY - stopLineDistance - 10);
        drawLine(ctx, centerX + doubleLineGap / 2, centerY + stopLineDistance + 10, centerX + doubleLineGap / 2, canvas.height);

        if (NUM_OF_LANES > 1) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 15]);

            for (let i = 1; i < NUM_OF_LANES; i++) {
                const yTop: number = centerY - roadWidth / 2 + (i * laneWidth);
                const yBottom: number = centerY + roadWidth / 2 - (i * laneWidth);

                drawLine(ctx, 0, yTop, centerX - stopLineDistance - 10, yTop);
                drawLine(ctx, centerX + stopLineDistance + 10, yTop, canvas.width, yTop);
                drawLine(ctx, 0, yBottom, centerX - stopLineDistance - 10, yBottom);
                drawLine(ctx, centerX + stopLineDistance + 10, yBottom, canvas.width, yBottom);

                const xLeft: number = centerX - roadWidth / 2 + (i * laneWidth);
                const xRight: number = centerX + roadWidth / 2 - (i * laneWidth);

                drawLine(ctx, xLeft, 0, xLeft, centerY - stopLineDistance - 10);
                drawLine(ctx, xLeft, centerY + stopLineDistance + 10, xLeft, canvas.height);
                drawLine(ctx, xRight, 0, xRight, centerY - stopLineDistance - 10);
                drawLine(ctx, xRight, centerY + stopLineDistance + 10, xRight, canvas.height);
            }
        }

        ctx.setLineDash([]);
    }

    // Linie stopu
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;

    if (NUM_OF_LANES === 1) {
        drawLine(ctx, centerX - stopLineDistance, centerY, centerX - stopLineDistance, centerY + roadWidth / 2);
        drawLine(ctx, centerX + stopLineDistance, centerY, centerX + stopLineDistance, centerY - roadWidth / 2);
        drawLine(ctx, centerX, centerY - stopLineDistance, centerX - roadWidth / 2, centerY - stopLineDistance);
        drawLine(ctx, centerX, centerY + stopLineDistance, centerX + roadWidth / 2, centerY + stopLineDistance);
    } else {
        drawLine(ctx, centerX - stopLineDistance, centerY - roadWidth / 2, centerX - stopLineDistance, centerY + roadWidth / 2);
        drawLine(ctx, centerX + stopLineDistance, centerY - roadWidth / 2, centerX + stopLineDistance, centerY + roadWidth / 2);
        drawLine(ctx, centerX - roadWidth / 2, centerY - stopLineDistance, centerX + roadWidth / 2, centerY - stopLineDistance);
        drawLine(ctx, centerX - roadWidth / 2, centerY + stopLineDistance, centerX + roadWidth / 2, centerY + stopLineDistance);
    }

    // Przejście dla pieszych
    ctx.fillStyle = 'white';
    const zebraMargin: number = 15;

    for (let i = 0; i < zebraCount; i++) {
        const y: number = centerY - roadWidth / 2 + zebraOffset + (i * (zebraWidth + zebraGap));
        const x: number = centerX - roadWidth / 2 + zebraOffset + (i * (zebraWidth + zebraGap));
        ctx.fillRect(centerX - stopLineDistance + zebraMargin, y, zebraLength, zebraWidth);
        ctx.fillRect(centerX + stopLineDistance - zebraLength - zebraMargin, y, zebraLength, zebraWidth);
        ctx.fillRect(x, centerY - stopLineDistance + zebraMargin, zebraWidth, zebraLength);
        ctx.fillRect(x, centerY + stopLineDistance - zebraLength - zebraMargin, zebraWidth, zebraLength);
    }
}

export default TrafficWorld;
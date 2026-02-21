import { useEffect, useRef, useState } from 'react';
import type { TrafficWorldProps, WorldGeometry } from '../types';
import { useConfig } from '../hooks/useConfig';
import { generateWorldGeometry } from '../utils/geometryGenerator';
import { drawCrossroad } from '../utils/renderer';


export const TrafficWorld: React.FC<TrafficWorldProps> = ({ numLanes, onGeometryReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [worldGeometry, setWorldGeometry] = useState<WorldGeometry | null>(null);
    const { config, loading } = useConfig();

    useEffect(() => {
        if (!canvasRef.current || !config || loading) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const geometry = generateWorldGeometry(
                canvas.width,
                canvas.height,
                config,
                numLanes
            );
            
            setWorldGeometry(geometry);
            drawCrossroad(ctx, geometry);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [config, loading, numLanes]);

    useEffect(() => {
        if (worldGeometry && onGeometryReady) {
            onGeometryReady(worldGeometry);
        }
    }, [worldGeometry, onGeometryReady]);

    return (
        <canvas
            ref={canvasRef}
            id="road"
            style={{ display: 'block' }}
        />
    );
};

export default TrafficWorld;
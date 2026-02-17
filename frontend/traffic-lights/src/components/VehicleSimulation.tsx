import { useEffect, useRef, useState } from 'react';
import type { Vehicle, VehicleSimulationProps, Command, RoadDirection } from '../types';
import { useCommands } from '../hooks/useCommands';
import { useConfig } from '../hooks/useConfig';
import { getSpawnPosition, selectLane, updateVehiclePosition, shouldRemoveVehicle } from '../utils/vehicleUtils';
import { drawVehicle } from '../utils/renderer';
import { drawTrafficLights } from '../utils/renderer';

const CAR_FILES = [
    'red-car.svg',
    'blue-car.svg',
    'green-car.svg',
    'yellow-car.svg',
    'purple-car.svg',
    'pink-car.svg',
    'turquise-car.svg'
];

export const VehicleSimulation: React.FC<VehicleSimulationProps> = ({ geometry }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const vehiclesRef = useRef<Map<string, Vehicle>>(new Map());
    const carImages = useRef<Map<string, HTMLImageElement>>(new Map());
    const animationRef = useRef<number>(null);

    const [vehicles, setVehicles] = useState<Map<string, Vehicle>>(new Map());
    const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const { commands } = useCommands();
    const { config } = useConfig();

    useEffect(() => {
        CAR_FILES.forEach(filename => {
            const img = new Image();
            img.src = `/${filename}`;
            carImages.current.set(filename, img);
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = geometry.canvas.width;
        canvas.height = geometry.canvas.height;
    }, [geometry]);

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawTrafficLights(ctx, geometry, {"north": "red", "south": "red", "west": "red", "east": "red"});

        vehiclesRef.current.forEach(vehicle => {
            const img = carImages.current.get(vehicle.carImage);
            drawVehicle(
                ctx, 
                vehicle.x, 
                vehicle.y, 
                vehicle.width, 
                vehicle.height, 
                vehicle.currentRoad, 
                img
            );
        });
    };

    const addVehicle = (id: string, startRoad: RoadDirection, endRoad: RoadDirection) => {
        if (!config) return;

        const laneCount = geometry.config.numOfLanes;
        const selectedLane = selectLane(startRoad, endRoad, laneCount);
        const pos = getSpawnPosition(startRoad, selectedLane, geometry);
        const randomCar = CAR_FILES[Math.floor(Math.random() * CAR_FILES.length)];

        const vehicle: Vehicle = {
            id,
            x: pos.x,
            y: pos.y,
            width: config.vehicle.car.width,
            height: config.vehicle.car.height,
            speed: config.vehicle.car.speed,
            currentRoad: pos.direction,
            targetRoad: endRoad,
            lane: selectedLane,
            state: 'moving',
            route: [endRoad],
            carImage: randomCar
        };

        vehiclesRef.current.set(id, vehicle);
        setVehicles(new Map(vehiclesRef.current));
        renderCanvas();
    };

    const step = () => {
    if (!config) return;
    
    vehiclesRef.current.forEach(vehicle => {
        updateVehiclePosition(
            vehicle, 
            geometry, 
            config.vehicle.car.speed, 
        );
    });

    vehiclesRef.current.forEach((vehicle, id) => {
        if (shouldRemoveVehicle(vehicle, geometry.canvas.width, geometry.canvas.height)) {
            vehiclesRef.current.delete(id);
        }
    });

    renderCanvas();
    setVehicles(new Map(vehiclesRef.current));
};
    const executeCommand = (cmd: Command) => {
        if (cmd.type === 'addVehicle' && cmd.vehicleId && cmd.startRoad && cmd.endRoad) {
            addVehicle(cmd.vehicleId, cmd.startRoad, cmd.endRoad);
        }
        if (cmd.type === 'step') {
            step();
        }
    };

    const reset = () => {
        vehiclesRef.current.clear();
        setVehicles(new Map());
        setCurrentCommandIndex(0);
        setIsRunning(false);
        
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    useEffect(() => {
        if (!isRunning || !config) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastCommandTime = Date.now();

        const animate = () => {
            step();

            const now = Date.now();
            if (now - lastCommandTime > 100 && currentCommandIndex < commands.length) {
                executeCommand(commands[currentCommandIndex]);
                setCurrentCommandIndex(prev => prev + 1);
                lastCommandTime = now;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isRunning, geometry, commands, currentCommandIndex, config]);

    return (
        <>
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            />
            <SimulationControls
                vehicles={vehicles}
                currentCommandIndex={currentCommandIndex}
                commandsLength={commands.length}
                isRunning={isRunning}
                isMinimized={isMinimized}
                onToggleRunning={() => setIsRunning(!isRunning)}
                onToggleMinimized={() => setIsMinimized(!isMinimized)}
                onStep={step}
                onReset={reset}
            />
        </>
    );
};

interface SimulationControlsProps {
    vehicles: Map<string, Vehicle>;
    currentCommandIndex: number;
    commandsLength: number;
    isRunning: boolean;
    isMinimized: boolean;
    onToggleRunning: () => void;
    onToggleMinimized: () => void;
    onStep: () => void;
    onReset: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
    vehicles,
    currentCommandIndex,
    commandsLength,
    isRunning,
    isMinimized,
    onToggleRunning,
    onToggleMinimized,
    onStep,
    onReset
}) => {
    return (
        <div style={{
            position: 'fixed',
            top: 10,
            right: 10,
            background: 'black',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '11px',
            minWidth: isMinimized ? 'auto' : '140px'
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: isMinimized ? 0 : '8px' 
            }}>
                <span style={{ fontWeight: 'bold' }}>Sim</span>
                <button
                    onClick={onToggleMinimized}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: '8px'
                    }}
                >
                    {isMinimized ? '▼' : '▲'}
                </button>
            </div>

            {!isMinimized && (
                <>
                    <div style={{ marginBottom: '4px' }}>Cars: {vehicles.size}</div>
                    <div style={{ marginBottom: '8px' }}>Cmd: {currentCommandIndex}/{commandsLength}</div>

                    <button
                        onClick={onToggleRunning}
                        style={{
                            width: '100%',
                            padding: '6px',
                            marginBottom: '4px',
                            background: isRunning ? 'red' : 'green',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        {isRunning ? 'Pause' : 'Run'}
                    </button>

                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <button
                            onClick={onStep}
                            style={{
                                flex: 1,
                                padding: '5px',
                                background: 'orange',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '10px'
                            }}
                        >
                            Step
                        </button>
                    </div>

                    <button
                        onClick={onReset}
                        style={{
                            width: '100%',
                            padding: '5px',
                            background: 'grey',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '10px'
                        }}
                    >
                        Reset
                    </button>
                </>
            )}
        </div>
    );
};

export default VehicleSimulation;
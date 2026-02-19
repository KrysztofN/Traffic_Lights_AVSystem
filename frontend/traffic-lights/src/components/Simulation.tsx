import { useEffect, useRef, useState } from 'react';
import type { Vehicle, VehicleSimulationProps, Command, RoadDirection, LightMap, Pedestrian, PedestrianPath, SimulationControlsProps, LightAlgorithm, LightAlgorithmState } from '../types';
import { useCommands } from '../hooks/useCommands';
import { useConfig } from '../hooks/useConfig';
import { getSpawnPosition, selectLane, updateVehiclePosition, shouldRemoveVehicle, getMovementType } from '../utils/vehicleUtils';
import { drawVehicle, drawTrafficLights, drawPedestrian, drawPedestrianLights } from '../utils/renderer';
import { spawnPedestrian, updatePedestrianPosition, shouldRemovePedestrian, getWaitingCounts } from '../utils/pedestrianUtils';
import { timerLightAlgorithm } from '../algorithms/timerBased';

const CAR_FILES = [
    'red-car.svg',
    'blue-car.svg',
    'green-car.svg',
    'yellow-car.svg',
    'purple-car.svg',
    'pink-car.svg',
    'turquise-car.svg'
];

const PEDESTRIAN_FILES = [
    'pedestrian-yellow.png',
    'pedestrian-purple.png',
    'pedestrian-red.png',
    'pedestrian-blue.png'
];

export const Simulation: React.FC<VehicleSimulationProps> = ({ geometry }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const vehiclesRef = useRef<Map<string, Vehicle>>(new Map());
    const carImages = useRef<Map<string, HTMLImageElement>>(new Map());
    const pedestrianImages = useRef<Map<string, HTMLImageElement>>(new Map());
    const animationRef = useRef<number>(null);
    const lightsRef = useRef<LightMap>({ ...timerLightAlgorithm.getInitialState().lights });
    const lightStateRef = useRef<LightAlgorithmState>(timerLightAlgorithm.getInitialState());
    const algorithmRef = useRef<LightAlgorithm>(timerLightAlgorithm);
    const blinkRef = useRef(true);
    const blinkTimerRef = useRef(0);
    const pedestriansRef = useRef<Map<string, Pedestrian>>(new Map());
    const pedestrianSpawnTimerRef = useRef(0);
    const pedestrianIdRef = useRef(0);
    const frameCountRef = useRef(0);
    const roadCountsRef = useRef<Record<RoadDirection, number>>({ north: 0, south: 0, east: 0, west: 0 });

    const [vehicles, setVehicles] = useState<Map<string, Vehicle>>(new Map());
    const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [waitingCounts, setWaitingCounts] = useState<Record<PedestrianPath, number>>({ north: 0, south: 0, west: 0, east: 0 });
    const [roadCounts, setRoadCounts] = useState<Record<RoadDirection, number>>({ north: 0, south: 0, east: 0, west: 0 });

    const { commands } = useCommands();
    const { config } = useConfig();

    useEffect(() => {
        CAR_FILES.forEach(filename => {
            const img = new Image();
            img.src = `/${filename}`;
            carImages.current.set(filename, img);
        });
        PEDESTRIAN_FILES.forEach(filename => {
            const img = new Image();
            img.src = `/${filename}`;
            pedestrianImages.current.set(filename, img);
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = geometry.canvas.width;
        canvas.height = geometry.canvas.height;
        ctxRef.current = canvas.getContext('2d');
    }, [geometry]);

    const renderCanvas = () => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        ctx.clearRect(0, 0, geometry.canvas.width, geometry.canvas.height);
        drawTrafficLights(ctx, geometry, lightsRef.current, blinkRef.current);
        drawPedestrianLights(ctx, geometry, algorithmRef.current.isPedestrianPhase(lightStateRef.current));

        vehiclesRef.current.forEach(vehicle => {
            drawVehicle(ctx, vehicle.x, vehicle.y, vehicle.width, vehicle.height, vehicle.currentRoad, carImages.current.get(vehicle.carImage));
        });

        pedestriansRef.current.forEach(pedestrian => {
            drawPedestrian(ctx, pedestrian, pedestrianImages.current.get(pedestrian.pedestrianImg));
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
            startRoad,
            movementType: getMovementType(startRoad, endRoad),
            lane: selectedLane,
            state: 'moving',
            route: [endRoad],
            carImage: randomCar
        };

        vehiclesRef.current.set(id, vehicle);
        roadCountsRef.current[startRoad]++;
        setRoadCounts({ ...roadCountsRef.current });
        setVehicles(new Map(vehiclesRef.current));
        renderCanvas();
    };

    const stepPedestrians = () => {
        const pedestrianGreen = algorithmRef.current.isPedestrianPhase(lightStateRef.current);
        const isClearancePhase = algorithmRef.current.isClearancePhase(lightStateRef.current);
        const { maxPedestriansPerPath, spawnInterval } = config!.simulation;

        pedestrianSpawnTimerRef.current++;
        if (pedestrianSpawnTimerRef.current >= spawnInterval && !isClearancePhase) {
            pedestrianSpawnTimerRef.current = 0;
            (['north', 'south', 'west', 'east'] as PedestrianPath[]).forEach(path => {
                let countOnPath = 0;
                pedestriansRef.current.forEach(p => { if (p.path === path) countOnPath++; });
                if (countOnPath < maxPedestriansPerPath) {
                    const pedId = `ped_${pedestrianIdRef.current++}`;
                    const randomPedestrian = PEDESTRIAN_FILES[Math.floor(Math.random() * PEDESTRIAN_FILES.length)];
                    pedestriansRef.current.set(pedId, spawnPedestrian(pedId, path, geometry, randomPedestrian, config!.pedestrian));
                }
            });
        }

        pedestriansRef.current.forEach((pedestrian, id) => {
            updatePedestrianPosition(pedestrian, geometry, pedestrianGreen);
            if (shouldRemovePedestrian(pedestrian, geometry)) {
                pedestriansRef.current.delete(id);
            }
        });
    };

    const step = () => {
        if (!config) return;

        frameCountRef.current++;
        const shouldSync = frameCountRef.current % 10 === 0;

        stepPedestrians();

        vehiclesRef.current.forEach(vehicle => {
            updateVehiclePosition(vehicle, vehiclesRef.current, geometry, config.vehicle.car.speed, lightsRef.current);
        });

        vehiclesRef.current.forEach((vehicle, id) => {
            if (vehicle.state === 'turning' && vehicle.route.length > 0) {
                roadCountsRef.current[vehicle.startRoad]--;
                vehicle.route = [];
            }
            if (shouldRemoveVehicle(vehicle, geometry.canvas.width, geometry.canvas.height)) {
                vehiclesRef.current.delete(id);
            }
        });

        renderCanvas();

        if (shouldSync) {
            setRoadCounts({ ...roadCountsRef.current });
            setVehicles(new Map(vehiclesRef.current));
            setWaitingCounts(getWaitingCounts(pedestriansRef.current));
        }
    };

    const executeCommand = (cmd: Command) => {
        if (cmd.type === 'addVehicle' && cmd.vehicleId && cmd.startRoad && cmd.endRoad) {
            addVehicle(cmd.vehicleId, cmd.startRoad, cmd.endRoad);
        }
        if (cmd.type === 'step') step();
    };

    const advanceLightPhase = () => {
        blinkTimerRef.current++;
        if (blinkTimerRef.current >= 30) {
            blinkTimerRef.current = 0;
            blinkRef.current = !blinkRef.current;
        }
        const { state, lights } = algorithmRef.current.tick(lightStateRef.current);
        lightStateRef.current = state;
        lightsRef.current = lights;
    };

    const reset = () => {
        vehiclesRef.current.clear();
        pedestriansRef.current.clear();
        setVehicles(new Map());
        setCurrentCommandIndex(0);
        setIsRunning(false);
        lightStateRef.current = algorithmRef.current.getInitialState();
        lightsRef.current = { ...timerLightAlgorithm.getInitialState().lights };
        blinkTimerRef.current = 0;
        blinkRef.current = true;
        frameCountRef.current = 0;
        roadCountsRef.current = { north: 0, south: 0, east: 0, west: 0 };
        setRoadCounts({ north: 0, south: 0, east: 0, west: 0 });
        pedestrianSpawnTimerRef.current = 0;
        pedestrianIdRef.current = 0;
        setWaitingCounts({ north: 0, south: 0, west: 0, east: 0 });

        const ctx = ctxRef.current;
        if (ctx) ctx.clearRect(0, 0, geometry.canvas.width, geometry.canvas.height);
    };

    useEffect(() => {
        if (!isRunning || !config) return;

        let lastCommandTime = Date.now();

        const animate = () => {
            advanceLightPhase();
            step();

            const now = Date.now();
            if (now - lastCommandTime > 2000 && currentCommandIndex < commands.length) {
                executeCommand(commands[currentCommandIndex]);
                setCurrentCommandIndex(prev => prev + 1);
                lastCommandTime = now;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isRunning, geometry, commands, currentCommandIndex, config]);

    return (
        <>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
            <SimulationControls
                vehicles={vehicles}
                currentCommandIndex={currentCommandIndex}
                commandsLength={commands.length}
                isRunning={isRunning}
                isMinimized={isMinimized}
                roadCounts={roadCounts}
                waitingCounts={waitingCounts}
                onToggleRunning={() => setIsRunning(!isRunning)}
                onToggleMinimized={() => setIsMinimized(!isMinimized)}
                onStep={step}
                onReset={reset}
            />
        </>
    );
};

const SimulationControls: React.FC<SimulationControlsProps> = ({
    currentCommandIndex, 
    commandsLength,
    isRunning, 
    isMinimized, 
    roadCounts, 
    waitingCounts,
    onToggleRunning, 
    onToggleMinimized, 
    onStep, 
    onReset
}) => {
    return (
        <div style={{ position: 'fixed', top: 10, right: 10, background: 'black', color: 'white', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', minWidth: isMinimized ? 'auto' : '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMinimized ? 0 : '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Sim</span>
                <button onClick={onToggleMinimized} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, marginLeft: '8px' }}>
                    {isMinimized ? '▼' : '▲'}
                </button>
            </div>

            {!isMinimized && (
                <>
                    <div style={{ marginBottom: '4px' }}>Cars</div>
                    <div style={{ marginBottom: '8px', fontSize: '10px' }}>
                        {(['north', 'south', 'east', 'west'] as const).map(dir => (
                            <div key={dir} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                <span style={{ textTransform: 'capitalize', opacity: 0.7 }}>{dir}</span>
                                <span>{roadCounts[dir]}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '8px', fontSize: '10px' }}>
                        <div style={{ marginBottom: '4px' }}>Pedestrians waiting</div>
                        {(['north', 'south', 'west', 'east'] as const).map(path => (
                            <div key={path} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                <span style={{ opacity: 0.7, textTransform: 'capitalize' }}>{path}</span>
                                <span style={{ color: waitingCounts[path] > 0 ? 'orange' : 'white' }}>{waitingCounts[path]}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '8px' }}>Cmd: {currentCommandIndex}/{commandsLength}</div>

                    <button onClick={onToggleRunning} style={{ width: '100%', padding: '6px', marginBottom: '4px', background: isRunning ? 'red' : 'green', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                        {isRunning ? 'Pause' : 'Run'}
                    </button>

                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <button onClick={onStep} style={{ flex: 1, padding: '5px', background: 'orange', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px' }}>
                            Step
                        </button>
                    </div>

                    <button onClick={onReset} style={{ width: '100%', padding: '5px', background: 'grey', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px' }}>
                        Reset
                    </button>
                </>
            )}
        </div>
    );
};

export default Simulation;
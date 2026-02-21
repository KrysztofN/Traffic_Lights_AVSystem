import { useEffect, useRef, useState } from 'react';
import type { Vehicle, VehicleSimulationProps, Command, RoadDirection, Pedestrian, PedestrianPath, Bicycle, SimulationControlsProps, LightAlgorithm, LightAlgorithmState } from '../types';
import { useCommands } from '../hooks/useCommands';
import { useConfig } from '../hooks/useConfig';
import { getSpawnPosition, selectLane, updateVehiclePosition, shouldRemoveVehicle, getMovementType } from '../utils/vehicleUtils';
import { drawVehicle, drawTrafficLights, drawPedestrian, drawPedestrianLights, drawBicycle } from '../utils/renderer';
import { spawnPedestrian, updatePedestrianPosition, shouldRemovePedestrian, getWaitingCounts } from '../utils/pedestrianUtils';
import { spawnBicycle, updateBicyclePosition, shouldRemoveBicycle } from '../utils/bicycleUtils';
import { timerLightAlgorithm } from '../algorithms/timerBased';
import { intelligentLightAlgorithm } from '../algorithms/intelligent';

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

const BICYCLE_FILES = [
    'bicycle1.png',
    'bicycle2.png'
];

export const Simulation: React.FC<VehicleSimulationProps> = ({ numLanes, geometry, onLaneChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const vehiclesRef = useRef<Map<string, Vehicle>>(new Map());
    const carImages = useRef<Map<string, HTMLImageElement>>(new Map());
    const pedestrianImages = useRef<Map<string, HTMLImageElement>>(new Map());
    const bicycleImages = useRef<Map<string, HTMLImageElement>>(new Map());
    const animationRef = useRef<number>(null);
    const lightStateRef = useRef<LightAlgorithmState>(timerLightAlgorithm.getInitialState());
    const algorithmRef = useRef<LightAlgorithm>(timerLightAlgorithm);
    const blinkRef = useRef(true);
    const blinkTimerRef = useRef(0);
    const pedestriansRef = useRef<Map<string, Pedestrian>>(new Map());
    const bicyclesRef = useRef<Map<string, Bicycle>>(new Map());
    const pedestrianSpawnTimerRef = useRef(0);
    const bicycleSpawnTimerRef = useRef(0);
    const pedestrianIdRef = useRef(0);
    const bicycleIdRef = useRef(0);
    const frameCountRef = useRef(0);
    const simStartTimeRef = useRef<number | null>(null);
    const currentCommandIndexRef = useRef(0);
    const showPedestriansRef = useRef(true);
    const showBicyclesRef = useRef(true);
    const stepStatusesRef = useRef<{ leftVehicles: string[] }[]>([]);
    const isRunningRef = useRef(false);

    const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [waitingCounts, setWaitingCounts] = useState<Record<PedestrianPath, number>>({ north: 0, south: 0, west: 0, east: 0 });
    const [roadCounts, setRoadCounts] = useState<Record<RoadDirection, number>>({ north: 0, south: 0, east: 0, west: 0 });
    const [showPedestrians, setShowPedestrians] = useState(true);
    const [showBicycles, setShowBicycles] = useState(true);
    const [stepStatuses, setStepStatuses] = useState<{ leftVehicles: string[] }[]>([]);
    const [algorithm, setAlgorithm] = useState<'timer' | 'intelligent'>('timer');

    const { commands, loadFromFile } = useCommands();
    const { config } = useConfig();

    const setCommandIndex = (idx: number) => {
        currentCommandIndexRef.current = idx;
        setCurrentCommandIndex(idx);
    };

    const getRoadCounts = (): Record<RoadDirection, number> => {
        const counts: Record<RoadDirection, number> = { north: 0, south: 0, east: 0, west: 0 };
        vehiclesRef.current.forEach(v => {
            if (v.state === 'waiting') counts[v.startRoad]++;
        });
        return counts;
    };

    const getMovementCounts = (): Record<string, number> => {
        const counts: Record<string, number> = {};
        vehiclesRef.current.forEach(v => {
            if (v.state !== 'waiting') return;
            const key = `${v.startRoad}_${v.movementType}`;
            counts[key] = (counts[key] ?? 0) + 1;
        });
        return counts;
    };

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
        BICYCLE_FILES.forEach(filename => {
            const img = new Image();
            img.src = `/${filename}`;
            bicycleImages.current.set(filename, img);
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
        drawTrafficLights(ctx, geometry, lightStateRef.current.lights, blinkRef.current);
        drawPedestrianLights(ctx, geometry, algorithmRef.current.isPedestrianPhase(lightStateRef.current));

        vehiclesRef.current.forEach(vehicle => {
            drawVehicle(ctx, vehicle.x, vehicle.y, vehicle.width, vehicle.height, vehicle.currentRoad, carImages.current.get(vehicle.carImage));
        });

        if (showPedestriansRef.current) {
            pedestriansRef.current.forEach(pedestrian => {
                drawPedestrian(ctx, pedestrian, pedestrianImages.current.get(pedestrian.pedestrianImg));
            });
        }

        if (showBicyclesRef.current) {
            bicyclesRef.current.forEach(bicycle => {
                drawBicycle(ctx, bicycle, bicycleImages.current.get(bicycle.bikeImg));
            });
        }
    };

    const addVehicle = (id: string, startRoad: RoadDirection, endRoad: RoadDirection) => {
        if (!config) return;

        const selectedLane = selectLane(startRoad, endRoad, numLanes);
        const pos = getSpawnPosition(startRoad, selectedLane, geometry);
        const randomCar = CAR_FILES[Math.floor(Math.random() * CAR_FILES.length)];

        const { center, config: gConfig } = geometry;
        const stopPositions: Record<RoadDirection, { x: number; y: number }> = {
            south: { x: pos.x, y: center.y + gConfig.stopLineDistance + config.vehicle.car.height },
            north: { x: pos.x, y: center.y - gConfig.stopLineDistance - config.vehicle.car.height },
            east: { x: center.x + gConfig.stopLineDistance + config.vehicle.car.width, y: pos.y },
            west: { x: center.x - gConfig.stopLineDistance - config.vehicle.car.width, y: pos.y },
        };

        const spawnPos = !isRunningRef.current ? stopPositions[startRoad] : { x: pos.x, y: pos.y };

        const vehicle: Vehicle = {
            id,
            x: spawnPos.x,
            y: spawnPos.y,
            width: config.vehicle.car.width,
            height: config.vehicle.car.height,
            speed: config.vehicle.car.speed,
            currentRoad: pos.direction,
            targetRoad: endRoad,
            startRoad,
            movementType: getMovementType(startRoad, endRoad),
            lane: selectedLane,
            state: !isRunningRef.current ? 'waiting' : 'moving',
            route: [endRoad],
            carImage: randomCar
        };

        vehiclesRef.current.set(id, vehicle);
        setRoadCounts(getRoadCounts());
        renderCanvas();
    };

    const stepPedestrians = () => {
        if (!showPedestriansRef.current) return;
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
            if (shouldRemovePedestrian(pedestrian, geometry)) pedestriansRef.current.delete(id);
        });
    };

    const stepBicycles = () => {
        if (!showBicyclesRef.current) return;
        const pedestrianGreen = algorithmRef.current.isPedestrianPhase(lightStateRef.current);
        const { speed, size } = config!.bicycle;

        bicycleSpawnTimerRef.current++;
        if (bicycleSpawnTimerRef.current >= 2000) {
            bicycleSpawnTimerRef.current = 0;
            (['north', 'south', 'west', 'east'] as PedestrianPath[]).forEach(path => {
                const id = `bike_${bicycleIdRef.current++}`;
                const bikeImg = BICYCLE_FILES[Math.floor(Math.random() * BICYCLE_FILES.length)];
                bicyclesRef.current.set(id, spawnBicycle(id, path, geometry, bikeImg, speed, size));
            });
        }

        bicyclesRef.current.forEach((bicycle, id) => {
            updateBicyclePosition(bicycle, pedestriansRef.current, geometry, pedestrianGreen);
            if (shouldRemoveBicycle(bicycle, geometry)) bicyclesRef.current.delete(id);
        });
    };

    const step = () => {
        if (!config) return;

        frameCountRef.current++;
        const shouldSync = frameCountRef.current % 10 === 0;

        stepPedestrians();
        stepBicycles();

        vehiclesRef.current.forEach(vehicle => {
            updateVehiclePosition(vehicle, vehiclesRef.current, geometry, config.vehicle.car.speed, lightStateRef.current.lights);
        });

        vehiclesRef.current.forEach((vehicle, id) => {
            if (shouldRemoveVehicle(vehicle, geometry.canvas.width, geometry.canvas.height)) {
                console.log('yes');
                vehiclesRef.current.delete(id);
            }
        });

        if (vehiclesRef.current.size > 0 && simStartTimeRef.current === null) {
            simStartTimeRef.current = Date.now();
        }

        renderCanvas();

        if (shouldSync) {
            setRoadCounts(getRoadCounts());
            setWaitingCounts(
                showPedestriansRef.current
                    ? getWaitingCounts(pedestriansRef.current)
                    : { north: 0, south: 0, west: 0, east: 0 }
            );
        }
    };

    const executeStep = (): string[] => {
        const leftVehicles: string[] = [];
        const lights = lightStateRef.current.lights;

        (['north', 'south', 'east', 'west'] as RoadDirection[]).forEach(road => {
            const vehicle = Array.from(vehiclesRef.current.values()).find(v =>
                v.startRoad === road &&
                lights[road][v.movementType] === 'green'
            );
            if (vehicle) {
                vehiclesRef.current.delete(vehicle.id);
                leftVehicles.push(vehicle.id);
            }
        });

        setRoadCounts(getRoadCounts());
        renderCanvas();
        return leftVehicles;
    };

    const executeCommand = (cmd: Command) => {
        if (cmd.type === 'addVehicle' && cmd.vehicleId && cmd.startRoad && cmd.endRoad) {
            addVehicle(cmd.vehicleId, cmd.startRoad, cmd.endRoad);
        }
        if (cmd.type === 'step') {
            if (!isRunningRef.current) advanceToNextPhase();
            const leftVehicles = executeStep();
            stepStatusesRef.current.push({ leftVehicles });
            setStepStatuses([...stepStatusesRef.current]);
        }
    };

    const advanceLightPhase = () => {
        blinkTimerRef.current++;
        if (blinkTimerRef.current >= 30) {
            blinkTimerRef.current = 0;
            blinkRef.current = !blinkRef.current;
        }

        (lightStateRef.current as any).trafficData = {
            vehicleWaiting: getRoadCounts(),
            pedestrianWaiting: Object.values(getWaitingCounts(pedestriansRef.current)).reduce((a, b) => a + b, 0),
            movementCount: getMovementCounts()
        };

        const { state } = algorithmRef.current.tick(lightStateRef.current);
        lightStateRef.current = state;
    };

    const manualStep = () => {
        if (!config) return;

        if (currentCommandIndexRef.current < commands.length) {
            executeCommand(commands[currentCommandIndexRef.current]);
            setCommandIndex(currentCommandIndexRef.current + 1);
        }
    };

    const advanceToNextPhase = () => {
        const { state } = algorithmRef.current.tick({
            ...lightStateRef.current,
            phaseTimer: Infinity  
        });
        lightStateRef.current = state;
    };

    const handleTogglePedestrians = () => {
        pedestriansRef.current.clear();
        showPedestriansRef.current = !showPedestriansRef.current;
        setShowPedestrians(showPedestriansRef.current);
    };

    const handleToggleBicycles = () => {
        bicyclesRef.current.clear();
        showBicyclesRef.current = !showBicyclesRef.current;
        setShowBicycles(showBicyclesRef.current);
    };

    const handleToggleRunning = () => {
        const next = !isRunningRef.current;
        isRunningRef.current = next;
        setIsRunning(next);
    };

    const handleAlgorithmChange = (algo: 'timer' | 'intelligent') => {
        setAlgorithm(algo);
        algorithmRef.current = algo === 'intelligent' ? intelligentLightAlgorithm : timerLightAlgorithm;
        lightStateRef.current = algorithmRef.current.getInitialState();
    };

    const exportJSON = () => {
        const json = JSON.stringify({ stepStatuses: stepStatusesRef.current }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'simulation_output.json';
        a.click();
    };

    const reset = () => {
        vehiclesRef.current.clear();
        pedestriansRef.current.clear();
        bicyclesRef.current.clear();
        setCommandIndex(0);
        setIsRunning(false);
        lightStateRef.current = algorithmRef.current.getInitialState();
        blinkTimerRef.current = 0;
        blinkRef.current = true;
        frameCountRef.current = 0;
        setRoadCounts({ north: 0, south: 0, east: 0, west: 0 });
        pedestrianSpawnTimerRef.current = 0;
        bicycleSpawnTimerRef.current = 0;
        pedestrianIdRef.current = 0;
        bicycleIdRef.current = 0;
        setWaitingCounts({ north: 0, south: 0, west: 0, east: 0 });
        simStartTimeRef.current = null;
        stepStatusesRef.current = [];
        setStepStatuses([]);

        const ctx = ctxRef.current;
        if (ctx) ctx.clearRect(0, 0, geometry.canvas.width, geometry.canvas.height);
    };

    useEffect(() => {
        if (!isRunning || !config) return;

        let lastCommandTime = Date.now();

        const animate = () => {
            if (!isRunningRef.current) return;

            advanceLightPhase();
            step();

            const now = Date.now();
            if (now - lastCommandTime > 2000 && currentCommandIndexRef.current < commands.length) {
                const cmd = commands[currentCommandIndexRef.current];
                if (cmd.type === 'addVehicle') {
                    executeCommand(cmd);
                }
                setCommandIndex(currentCommandIndexRef.current + 1);
                lastCommandTime = now;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isRunning, geometry, commands, config]);

    return (
        <>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
            <SimulationControls
                currentCommandIndex={currentCommandIndex}
                commandsLength={commands.length}
                isRunning={isRunning}
                isMinimized={isMinimized}
                roadCounts={roadCounts}
                waitingCounts={waitingCounts}
                showPedestrians={showPedestrians}
                showBicycles={showBicycles}
                numberOfLanes={numLanes}
                stepStatuses={stepStatuses}
                algorithm={algorithm}
                onAlgorithmChange={handleAlgorithmChange}
                onToggleRunning={handleToggleRunning}
                onToggleMinimized={() => setIsMinimized(!isMinimized)}
                onTogglePedestrians={handleTogglePedestrians}
                onToggleBicycles={handleToggleBicycles}
                onLaneChange={onLaneChange}
                onStep={manualStep}
                onReset={reset}
                onExport={exportJSON}
                onLoadFile={loadFromFile}
            />
        </>
    );
};


const Btn = ({ onClick, disabled, color, children }: { onClick: () => void, disabled?: boolean, color: string, children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '4px', marginBottom: '4px', background: disabled ? '#252525' : color, color: disabled ? 'grey' : 'white', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
        {children}
    </button>
);

const Row = ({ label, value, color }: { label: string, value: React.ReactNode, color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
        <span style={{ color: 'grey' }}>{label}</span>
        <span style={{ color: color ?? 'white' }}>{value}</span>
    </div>
);

const ToggleBtn = ({ value, onToggle }: { value: boolean, onToggle: () => void }) => (
    <button onClick={onToggle} style={{ background: value ? 'green' : 'grey', border: 'none', color: 'white', cursor: 'pointer', padding: '1px 6px', fontSize: '12px' }}>
        {value ? 'on' : 'off'}
    </button>
);

const Divider = () => <div style={{ borderTop: '1px solid grey', margin: '6px 0' }}></div>;
const SectionLabel = ({ children }: { children: React.ReactNode }) => <div style={{ color: '#d6d5d5', marginBottom: '4px', fontSize: '13px'}}>{children}</div>;
const Space = () => <div style={{marginTop: '8px'}}></div>;


const SimulationControls: React.FC<SimulationControlsProps> = ({
    currentCommandIndex,
    commandsLength,
    isRunning,
    isMinimized,
    roadCounts,
    waitingCounts,
    showPedestrians,
    showBicycles,
    numberOfLanes,
    stepStatuses,
    algorithm,
    onAlgorithmChange,
    onToggleRunning,
    onToggleMinimized,
    onTogglePedestrians,
    onToggleBicycles,
    onLaneChange,
    onStep,
    onReset,
    onExport,
    onLoadFile
}) => {
    return (
        <div style={{ position: 'fixed', top: 10, right: 10, background: 'black', color: 'white', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', minWidth: isMinimized ? 'auto' : '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer'}} onClick={onToggleMinimized}>
                <span style={{ fontWeight: 'bold' }}>Simulation</span>
                <button style={{ background: 'none', border: 'none', color: 'grey', transform: 'translate(0px, -2px)'}}>{isMinimized ? '▼' : '▲'}</button>
            </div>

            {!isMinimized && (<>
                <Space></Space>
                <SectionLabel>Cars waiting</SectionLabel>
                {(['north', 'south', 'east', 'west'] as const).map(dir =>
                    <Row key={dir} label={dir} value={roadCounts[dir]} color={roadCounts[dir] > 0 ? 'orange' : 'white'} />
                )}
                <Space></Space>
                <SectionLabel>Pedestrians waiting</SectionLabel>
                {(['north', 'south', 'west', 'east'] as const).map(p =>
                    <Row key={p} label={p} value={waitingCounts[p]} color={waitingCounts[p] > 0 ? 'orange' : 'white'} />
                )}

                <Divider />
                <Row label="CMD" value={`${currentCommandIndex}/${commandsLength}`} />
                <Space></Space>
                
                <Divider />
                <SectionLabel>Dicrete Mode</SectionLabel>
                <Row label="steps" value={stepStatuses.length} color={stepStatuses.length > 0 ? 'green' : 'grey'} />
                <Space></Space>
                <Btn onClick={onStep} disabled={isRunning} color="grey">next cmd</Btn>
                <Btn onClick={onExport} disabled={isRunning || stepStatuses.length === 0} color="blue">export json</Btn>

                <Divider />
                <SectionLabel>Live Mode</SectionLabel>
                <Row label="pedestrians" value={<ToggleBtn value={showPedestrians} onToggle={onTogglePedestrians} />} />
                <Space></Space>
                <Row label="bicycles" value={<ToggleBtn value={showBicycles} onToggle={onToggleBicycles} />} />
                <Space></Space>
                <Divider />
                <Space></Space>
                <Row label="lanes" value={
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3].map(n => (
                            <button key={n} onClick={() => onLaneChange(n)} style={{
                                background: numberOfLanes === n ? 'white' : '#2e2e2e',
                                color: numberOfLanes === n ? 'black' : 'white',
                                border: 'none',
                                cursor: 'pointer', 
                                fontSize: '11px'
                            }}>{n}</button>
                        ))}
                    </div>
                } />
                <Space></Space>
                <Row label="algorithm" value={
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {(['timer', 'intelligent'] as const).map(a => (
                            <button key={a} onClick={() => onAlgorithmChange(a)} style={{
                                background: algorithm === a ? 'white' : '#2e2e2e',
                                color: algorithm === a ? 'black' : 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '11px'
                            }}>{a}</button>
                        ))}
                    </div>
                } />
                <Space></Space>
                <Divider />
                <Space></Space>
                <Btn onClick={onToggleRunning} color={isRunning ? 'red' : 'green'}>{isRunning ? 'pause' : 'run'}</Btn>
                <Btn onClick={onReset} color="grey">reset</Btn>
                <input
                    type="file"
                    accept=".json"
                    id="cmd-file"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && onLoadFile(e.target.files[0])}
                />
                <Btn onClick={() => document.getElementById('cmd-file')!.click()} color="#2e2e2e">
                    load commands {commandsLength > 0 ? `(${commandsLength})` : ''}
                </Btn>
            </>)}
        </div>
    );
};
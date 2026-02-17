import TrafficWorld from './components/TrafficWorld';
import { useState, useEffect } from 'react';
import './App.css';
import type { WorldGeometry } from './types';
import { VehicleSimulation } from './components/VehicleSimulation';

function App() {
    const [worldGeometry, setWorldGeometry] = useState<WorldGeometry | null>(null);

    useEffect(() => {}, [worldGeometry]);
    return (
        <>
            <TrafficWorld onGeometryReady={setWorldGeometry} />
            {worldGeometry && <VehicleSimulation geometry={worldGeometry} />}
        </>
    );
}

export default App;
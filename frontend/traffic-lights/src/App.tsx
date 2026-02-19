import TrafficWorld from './components/TrafficWorld';
import { useState, useEffect } from 'react';
import './App.css';
import type { WorldGeometry } from './types';
import { Simulation } from './components/Simulation';

function App() {
    const [worldGeometry, setWorldGeometry] = useState<WorldGeometry | null>(null);

    useEffect(() => {}, [worldGeometry]);
    return (
        <>
            <TrafficWorld onGeometryReady={setWorldGeometry} />
            {worldGeometry && <Simulation geometry={worldGeometry} />}
        </>
    );
}

export default App;
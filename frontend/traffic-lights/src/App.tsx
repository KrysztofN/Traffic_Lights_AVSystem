import TrafficWorld from './components/TrafficWorld';
import { useState } from 'react';
import './App.css';
import type { WorldGeometry } from './types';
import { Simulation } from './components/Simulation';

function App() {
    const [worldGeometry, setWorldGeometry] = useState<WorldGeometry | null>(null);
    const [numLanes, setNumLanes] = useState(1);

    const handleLaneChange = (n: number) => {
        setNumLanes(n);
        setWorldGeometry(null); 
    };

    return (
        <>
            <TrafficWorld numLanes={numLanes} onGeometryReady={setWorldGeometry} />
            {worldGeometry && (
                <Simulation 
                    geometry={worldGeometry} 
                    numLanes={numLanes}
                    onLaneChange={handleLaneChange}
                />
            )}
        </>
    );
}

export default App;
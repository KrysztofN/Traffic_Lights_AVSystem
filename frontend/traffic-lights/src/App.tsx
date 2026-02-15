import TrafficWorld from './components/World';
import { useState, useEffect } from 'react';
import './App.css';
import type { WorldGeometry } from './common/types';

function App() {
    const [worldGeometry, setWorldGeometry] = useState<WorldGeometry | null>(null);

    useEffect(() => {
        if (worldGeometry) {
            console.log("Sim ready", worldGeometry);
        }
    }, [worldGeometry]);
    return <TrafficWorld onGeometryReady={setWorldGeometry} />;
}

export default App;
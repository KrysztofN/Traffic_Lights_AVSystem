import { useState, useEffect } from 'react';
import type { Config } from '../types';

export const useConfig = () => {
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('/config/main.json');
                const data: Config = await response.json();
                setConfig(data);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to load config'));
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, []);

    return { config, loading, error };
};
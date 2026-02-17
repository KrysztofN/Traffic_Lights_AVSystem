import { useState, useEffect } from 'react';
import type { Command } from '../types';

export const useCommands = () => {
    const [commands, setCommands] = useState<Command[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadCommands = async () => {
            try {
                const response = await fetch('/config/commands.json');
                const data = await response.json();
                setCommands(data.commands);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to load commands'));
            } finally {
                setLoading(false);
            }
        };

        loadCommands();
    }, []);

    return { commands, loading, error };
};
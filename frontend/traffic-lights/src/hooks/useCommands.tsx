import { useState, useEffect } from 'react';
import type { Command } from '../types';

export const useCommands = () => {
    const [commands, setCommands] = useState<Command[]>([]);

    const loadFromFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = e => {
            const parsed = JSON.parse(e.target!.result as string);
            setCommands(parsed.commands ?? parsed);
        };
        reader.readAsText(file);
    };

    return { commands, loadFromFile };
};
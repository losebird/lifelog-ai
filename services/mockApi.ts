
import type { Record, ActionItem, Habit, HabitLog } from '../types';

// Helper functions for localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, value: T): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

// Simulate network latency
const simulateDelay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

// --- API ---

// Records
export const fetchRecords = async (): Promise<Record[]> => {
    await simulateDelay();
    return getFromStorage<Record[]>('records', []);
};

export const saveRecord = async (record: Record): Promise<Record> => {
    await simulateDelay();
    const records = await fetchRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    if (existingIndex > -1) {
        records[existingIndex] = record;
    } else {
        records.push(record);
    }
    saveToStorage('records', records);
    return record;
};

export const deleteRecord = async (recordId: string): Promise<void> => {
    await simulateDelay();
    let records = await fetchRecords();
    records = records.filter(r => r.id !== recordId);
    saveToStorage('records', records);
};

// Habits
export const fetchHabits = async (): Promise<Habit[]> => {
    await simulateDelay();
    return getFromStorage<Habit[]>('habits', []);
};

export const saveHabit = async (habit: Habit): Promise<Habit> => {
    await simulateDelay();
    const habits = await fetchHabits();
    const existingIndex = habits.findIndex(h => h.id === habit.id);
    if (existingIndex > -1) {
        habits[existingIndex] = habit;
    } else {
        habits.push(habit);
    }
    saveToStorage('habits', habits);
    return habit;
};

export const deleteHabit = async (habitId: string): Promise<void> => {
    await simulateDelay();
    let habits = await fetchHabits();
    habits = habits.filter(h => h.id !== habitId);
    saveToStorage('habits', habits);
};

// Habit Logs
export const fetchHabitLogs = async (): Promise<HabitLog[]> => {
    await simulateDelay();
    return getFromStorage<HabitLog[]>('habitLogs', []);
};

export const upsertHabitLog = async (log: HabitLog): Promise<HabitLog | null> => {
    await simulateDelay();
    let logs = await fetchHabitLogs();
    const existingIndex = logs.findIndex(l => l.habitId === log.habitId && l.date === log.date);

    if (log.completed) {
        const logToSave = { ...log, id: existingIndex > -1 ? logs[existingIndex].id : crypto.randomUUID() };
        if (existingIndex > -1) {
            logs[existingIndex] = logToSave;
        } else {
            logs.push(logToSave);
        }
        saveToStorage('habitLogs', logs);
        return logToSave;
    } else {
        // If not completed, it means we are deleting the log.
        if (existingIndex > -1) {
            logs.splice(existingIndex, 1);
            saveToStorage('habitLogs', logs);
        }
        return null; // Indicates deletion
    }
};

export const deleteHabitLogsForHabit = async (habitId: string): Promise<void> => {
    await simulateDelay();
    let logs = await fetchHabitLogs();
    logs = logs.filter(l => l.habitId !== habitId);
    saveToStorage('habitLogs', logs);
};

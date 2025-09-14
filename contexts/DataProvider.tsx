
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Record, ActionItem, Habit, HabitLog, ProactiveSuggestion, InsightTemplate } from '../types';
import * as api from '../services/mockApi';
import { generateProactiveSuggestions } from '../services/geminiService';
import { initialTemplates } from '../utils/templates';

type ActiveView = 'timeline' | 'todos' | 'habits' | 'review' | 'insights';

interface DataContextType {
    // State
    records: Record[];
    habits: Habit[];
    habitLogs: HabitLog[];
    allActionItems: ActionItem[];
    insightTemplates: InsightTemplate[];
    proactiveSuggestions: ProactiveSuggestion[];
    isCheckingSuggestions: boolean;
    isLoading: boolean;
    activeView: ActiveView;
    initialTimelineDate: Date | null;

    // Actions
    addRecord: (newRecord: Record) => Promise<void>;
    updateRecord: (updatedRecord: Record) => Promise<void>;
    
    addHabit: (habitData: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
    updateHabit: (updatedHabit: Habit) => Promise<void>;
    deleteHabit: (habitId: string) => Promise<void>;
    
    logHabit: (log: HabitLog) => Promise<void>;

    updateActionItem: (updatedItem: ActionItem) => Promise<void>;
    addActionItem: (taskDetails: Omit<ActionItem, 'id' | 'recordId' | 'status'>) => Promise<void>;
    deleteActionItem: (itemToDelete: ActionItem) => Promise<void>;
    
    setActiveView: (view: ActiveView) => void;
    navigateToTimeline: (date: Date) => void;
    onDateChange: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [records, setRecords] = useState<Record[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [activeView, setActiveView] = useState<ActiveView>('timeline');
    const [initialTimelineDate, setInitialTimelineDate] = useState<Date | null>(null);
    
    const [insightTemplates] = useState<InsightTemplate[]>(initialTemplates);
    const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
    const [isCheckingSuggestions, setIsCheckingSuggestions] = useState(false);

    // Initial data load
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [recordsData, habitsData, habitLogsData] = await Promise.all([
                api.fetchRecords(),
                api.fetchHabits(),
                api.fetchHabitLogs(),
            ]);
            setRecords(recordsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setHabits(habitsData);
            setHabitLogs(habitLogsData);
            setIsLoading(false);
        };
        loadData();
    }, []);

    // Proactive suggestions
     useEffect(() => {
        const checkSuggestions = async () => {
            if (activeView === 'insights' && !isCheckingSuggestions && records.length > 5) {
                setIsCheckingSuggestions(true);
                try {
                    const suggestions = await generateProactiveSuggestions(records.slice(0, 50));
                    setProactiveSuggestions(suggestions);
                } finally {
                    setIsCheckingSuggestions(false);
                }
            }
        };
        checkSuggestions();
    }, [activeView, records, isCheckingSuggestions]);


    // Memoized derived state
    const allActionItems = useMemo((): ActionItem[] => {
        return records.flatMap(record => record.actionItems);
    }, [records]);


    // --- Actions ---

    const addRecord = useCallback(async (newRecord: Record) => {
        await api.saveRecord(newRecord);
        setRecords(prev => [newRecord, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, []);
    
    const updateRecord = useCallback(async (updatedRecord: Record) => {
        await api.saveRecord(updatedRecord);
        setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, []);

    const deleteRecord = useCallback(async (recordId: string) => {
        await api.deleteRecord(recordId);
        setRecords(prev => prev.filter(r => r.id !== recordId));
    }, []);

    const addHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
        const newHabit: Habit = {
            ...habitData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        await api.saveHabit(newHabit);
        setHabits(prev => [...prev, newHabit]);
    }, []);

    const updateHabit = useCallback(async (updatedHabit: Habit) => {
        await api.saveHabit(updatedHabit);
        setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    }, []);

    const deleteHabit = useCallback(async (habitId: string) => {
        await api.deleteHabit(habitId);
        await api.deleteHabitLogsForHabit(habitId);
        setHabits(prev => prev.filter(h => h.id !== habitId));
        setHabitLogs(prev => prev.filter(l => l.habitId !== habitId));
    }, []);

    const logHabit = useCallback(async (log: HabitLog) => {
        const resultLog = await api.upsertHabitLog(log);
        
        setHabitLogs(prev => {
            const newLogs = prev.filter(l => !(l.habitId === log.habitId && l.date === log.date));
            if (resultLog) {
                newLogs.push(resultLog);
            }
            return newLogs;
        });
    }, []);
    
    const updateActionItem = useCallback(async (updatedItem: ActionItem) => {
        const finalItem = { ...updatedItem };

        if (finalItem.subtasks && finalItem.subtasks.length > 0) {
            const allSubtasksCompleted = finalItem.subtasks.every(sub => sub.completed);

            if (allSubtasksCompleted && finalItem.status !== 'done') {
                finalItem.status = 'done';
            } else if (!allSubtasksCompleted && finalItem.status === 'done') {
                finalItem.status = 'inprogress';
            }
        }
        
        const recordToUpdate = records.find(r => r.id === finalItem.recordId);
        if (recordToUpdate) {
            const newActionItems = recordToUpdate.actionItems.map(item =>
                item.id === finalItem.id ? finalItem : item
            );
            await updateRecord({ ...recordToUpdate, actionItems: newActionItems });
        }
    }, [records, updateRecord]);
    
    const addActionItem = useCallback(async (taskDetails: Omit<ActionItem, 'id' | 'recordId' | 'status'>) => {
        const recordId = crypto.randomUUID();
        const newActionItem: ActionItem = {
            id: crypto.randomUUID(),
            ...taskDetails,
            recordId,
            status: 'todo',
        };
        const newRecord: Record = {
            id: recordId,
            type: 'text',
            content: taskDetails.task,
            timestamp: new Date().toISOString(),
            tags: taskDetails.project ? [taskDetails.project] : [],
            actionItems: [newActionItem],
            emotion: '🤔',
        };
        await addRecord(newRecord);
    }, [addRecord]);
    
    const deleteActionItem = useCallback(async (itemToDelete: ActionItem) => {
        const record = records.find(r => r.id === itemToDelete.recordId);
        if (!record) return;

        const newActionItems = record.actionItems.filter(item => item.id !== itemToDelete.id);
        
        if (newActionItems.length === 0 && record.type === 'text' && record.content === itemToDelete.task) {
            await deleteRecord(record.id);
        } else {
            await updateRecord({ ...record, actionItems: newActionItems });
        }
    }, [records, updateRecord, deleteRecord]);
    
    const navigateToTimeline = useCallback((date: Date) => {
        setInitialTimelineDate(date);
        setActiveView('timeline');
    }, []);

    const onDateChange = useCallback(() => {
        setInitialTimelineDate(null);
    }, []);

    const value: DataContextType = {
        records,
        habits,
        habitLogs,
        allActionItems,
        insightTemplates,
        proactiveSuggestions,
        isCheckingSuggestions,
        isLoading,
        activeView,
        initialTimelineDate,
        addRecord,
        updateRecord,
        addHabit,
        updateHabit,
        deleteHabit,
        logHabit,
        updateActionItem,
        addActionItem,
        deleteActionItem,
        setActiveView,
        navigateToTimeline,
        onDateChange
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};


import React, { useState } from 'react';
import type { Habit, HabitLog } from '../types';
import { FlameIcon } from './icons/FlameIcon';

interface LogHabitModalProps {
    habit: Habit;
    date: string; // YYYY-MM-DD
    logForDay: HabitLog | undefined;
    onClose: () => void;
    onSave: (log: HabitLog) => void;
}

const LogHabitModal: React.FC<LogHabitModalProps> = ({ habit, date, logForDay, onClose, onSave }) => {
    const [value, setValue] = useState<string | number>(logForDay?.value ?? '');

    const handleSave = () => {
        const isNumberType = habit.goal.type === 'number';
        const isNoteType = habit.goal.type === 'note';

        if (isNumberType && (value === '' || isNaN(Number(value)))) return;
        if (isNoteType && (typeof value !== 'string' || !value.trim())) return;
        
        onSave({
            id: logForDay?.id || crypto.randomUUID(),
            habitId: habit.id,
            date: date,
            completed: true,
            value: isNumberType ? Number(value) : value,
        });
        onClose();
    };

    const handleRemoveLog = () => {
        if (logForDay) {
             onSave({ ...logForDay, completed: false, value: undefined });
        }
        onClose();
    };
    
    const isSaveDisabled = 
        (habit.goal.type === 'number' && (value === '' || isNaN(Number(value)))) ||
        (habit.goal.type === 'note' && (typeof value !== 'string' || !value.trim()));

    const formattedDate = new Date(date).toLocaleDateString('zh-CN', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-slide-up border border-base-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-base-300">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <FlameIcon className="w-6 h-6" />
                        记录 {habit.name}
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">日期: {formattedDate}</p>
                </div>

                <div className="p-6 space-y-4">
                     {habit.goal.type === 'number' && (
                        <div>
                            <label htmlFor="habit-value" className="text-sm font-medium text-text-primary">
                                {habit.goal.unit ? `输入数字 (${habit.goal.unit})` : '输入数字'}
                            </label>
                            <input
                                id="habit-value"
                                type="number"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                placeholder={habit.goal.target ? `目标: ${habit.goal.target}` : '输入值'}
                                className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg focus:border-brand-primary focus:outline-none"
                                autoFocus
                            />
                        </div>
                    )}
                     {habit.goal.type === 'note' && (
                        <div>
                            <label htmlFor="habit-note" className="text-sm font-medium text-text-primary">写下您的笔记</label>
                            <textarea
                                id="habit-note"
                                value={value as string}
                                onChange={e => setValue(e.target.value)}
                                placeholder="记录今天的进展或想法..."
                                className="mt-1 w-full p-2 h-32 bg-base-100 border border-base-300 rounded-lg focus:border-brand-primary focus:outline-none resize-none"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                <div className="bg-base-100/50 px-6 py-4 rounded-b-2xl flex justify-between items-center gap-4 border-t border-base-300">
                    <div>
                         {logForDay?.completed && (
                            <button onClick={handleRemoveLog} className="px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-100/50 transition-colors">
                                删除记录
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-base-300/50 transition-colors">
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg shadow-md hover:bg-brand-secondary disabled:opacity-50"
                            disabled={isSaveDisabled}
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default LogHabitModal;

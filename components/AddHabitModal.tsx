
import React, { useState, useEffect } from 'react';
import type { Habit } from '../types';
import * as HabitIcons from './icons/HabitIcons';
import { PencilIcon } from './icons/PencilIcon';
import { ClockIcon } from './icons/ClockIcon';
import { QuoteIcon } from './icons/QuoteIcon';
import { CheckIcon } from './icons/CheckIcon';
import { HashtagIcon } from './icons/HashtagIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { getHabitColor, habitColors } from '../utils/colorUtils';

const habitIconMeta = {
    RunIcon: { label: '运动', Icon: HabitIcons.RunIcon },
    BookIcon: { label: '阅读', Icon: HabitIcons.BookIcon },
    BedIcon: { label: '睡眠', Icon: HabitIcons.BedIcon },
    MeditateIcon: { label: '冥想', Icon: HabitIcons.MeditateIcon },
    ForkKnifeIcon: { label: '吃饭', Icon: HabitIcons.ForkKnifeIcon },
};


const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = String(h).padStart(2, '0');
            const minute = String(m).padStart(2, '0');
            options.push(`${hour}:${minute}`);
        }
    }
    return options;
};
const timeOptions = generateTimeOptions();


interface AddHabitModalProps {
    onClose: () => void;
    onSave: (habit: Habit) => void;
    habitToEdit?: Habit | null;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ onClose, onSave, habitToEdit }) => {
    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('RunIcon');
    const [selectedColor, setSelectedColor] = useState('orange');
    const [goalType, setGoalType] = useState<Habit['goal']['type']>('checkmark');
    const [goalTarget, setGoalTarget] = useState('');
    const [goalUnit, setGoalUnit] = useState('');
    const [motivationalQuote, setMotivationalQuote] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
    const [frequencyCount, setFrequencyCount] = useState(1);


    useEffect(() => {
        if (habitToEdit) {
            setName(habitToEdit.name);
            setSelectedIcon(habitToEdit.icon in habitIconMeta ? habitToEdit.icon : 'RunIcon');
            setSelectedColor(habitToEdit.color);
            setGoalType(habitToEdit.goal.type);
            setGoalTarget(habitToEdit.goal.target?.toString() || '');
            setGoalUnit(habitToEdit.goal.unit || '');
            setMotivationalQuote(habitToEdit.motivationalQuote || '');
            setReminderTime(habitToEdit.reminderTime || '');
            setFrequency(habitToEdit.frequency);
            setFrequencyCount(habitToEdit.frequencyCount);
        } else {
            // Set defaults for new habits
            setReminderTime('09:00');
            setFrequency('daily');
            setFrequencyCount(1);
        }
    }, [habitToEdit]);

    const handleSave = () => {
        if (!name.trim()) return;

        let goal: Habit['goal'];
        switch (goalType) {
            case 'number':
                goal = { type: 'number', target: Number(goalTarget) || undefined, unit: goalUnit.trim() || undefined };
                break;
            case 'note':
                goal = { type: 'note' };
                break;
            default:
                goal = { type: 'checkmark' };
        }

        const newHabit: Habit = {
            id: habitToEdit?.id || crypto.randomUUID(),
            name: name.trim(),
            icon: selectedIcon,
            color: selectedColor,
            motivationalQuote: motivationalQuote.trim(),
            frequency: frequency,
            frequencyCount: frequencyCount > 0 ? frequencyCount : 1,
            goal: goal,
            createdAt: habitToEdit?.createdAt || new Date().toISOString(),
            reminderTime: reminderTime || undefined,
        };
        onSave(newHabit);
        onClose();
    };
    
    const GoalTypeOption = ({ type, label, icon }: {type: Habit['goal']['type'], label: string, icon: React.ReactElement<React.SVGProps<SVGSVGElement>>}) => (
        <button
            onClick={() => setGoalType(type)}
            className={`flex-1 p-4 text-left border rounded-lg transition-all duration-200 ${goalType === type ? `bg-base-100 border-brand-primary ring-2 ring-brand-primary/50 shadow-md` : 'bg-base-100/50 border-base-300 hover:border-brand-primary/50'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${getHabitColor(selectedColor).bg}`}>
                    {React.cloneElement(icon, { className: `w-5 h-5 ${getHabitColor(selectedColor).text}`})}
                </div>
                <div>
                    <p className="font-semibold text-text-primary">{label}</p>
                </div>
            </div>
        </button>
    );

    const color = getHabitColor(selectedColor);
    const SelectedIconComponent = habitIconMeta[selectedIcon as keyof typeof habitIconMeta]?.Icon || HabitIcons.RunIcon;

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 animate-slide-up border border-base-300" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-text-primary">
                        {habitToEdit ? '编辑习惯' : '创建新习惯'}
                    </h2>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                     {/* Name and Icon */}
                    <div>
                        <label className="text-sm font-medium text-text-primary block mb-2">习惯</label>
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.bg}`}>
                                <SelectedIconComponent className={`w-7 h-7 ${color.text}`} />
                            </div>
                            <div className="relative flex-grow">
                                <PencilIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50"/>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="例如：每天阅读"
                                    className="w-full h-12 pl-10 pr-4 bg-base-100 border border-base-300 rounded-lg focus:border-brand-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Icon and Color Pickers */}
                    <div className="space-y-4">
                        <div>
                             <label className="text-sm font-medium text-text-primary block mb-2">图标和颜色</label>
                             <div className="p-3 bg-base-100 rounded-lg border border-base-300">
                                <div className="grid grid-cols-6 gap-2 mb-3">
                                    {Object.entries(habitIconMeta).map(([iconKey, {label, Icon}]) => (
                                        <button 
                                            key={iconKey} 
                                            onClick={() => setSelectedIcon(iconKey)} 
                                            className={`flex items-center justify-center aspect-square p-2 rounded-lg transition-all ${selectedIcon === iconKey ? `${color.bg} ring-2 ring-offset-2 ring-offset-base-100 ${color.ring}` : 'bg-base-300/60 hover:bg-base-300'}`}
                                            title={label}
                                        >
                                            <Icon className={`w-7 h-7 ${selectedIcon === iconKey ? color.text : 'text-text-secondary'}`} />
                                        </button>
                                    ))}
                                </div>
                                 <div className="h-px bg-base-300 my-2"></div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {Object.keys(habitColors).map(colorKey => (
                                        <button key={colorKey} onClick={() => setSelectedColor(colorKey)} className={`w-7 h-7 rounded-full ${habitColors[colorKey].bg} transition-transform hover:scale-110 ${selectedColor === colorKey ? 'ring-2 ring-offset-2 ring-offset-base-100 ring-gray-500' : ''}`}></button>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Goal Type */}
                    <div>
                        <label className="text-sm font-medium text-text-primary block mb-2">如何追踪？</label>
                        <div className="flex items-stretch gap-3">
                            <GoalTypeOption type="checkmark" label="打勾" icon={<CheckIcon />} />
                            <GoalTypeOption type="number" label="数字" icon={<HashtagIcon />} />
                            <GoalTypeOption type="note" label="笔记" icon={<DocumentIcon />} />
                        </div>
                    </div>

                    {goalType === 'number' && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in">
                            <div>
                                <label htmlFor="habit-target" className="text-sm font-medium text-text-primary">目标</label>
                                <input id="habit-target" type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="例如: 10" className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg"/>
                            </div>
                            <div>
                                <label htmlFor="habit-unit" className="text-sm font-medium text-text-primary">单位</label>
                                <input id="habit-unit" type="text" value={goalUnit} onChange={e => setGoalUnit(e.target.value)} placeholder="例如: 页" className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg"/>
                            </div>
                        </div>
                    )}

                    {/* Frequency */}
                    <div>
                        <label className="text-sm font-medium text-text-primary block mb-2">频率</label>
                        <div className="space-y-3 p-3 bg-base-100 rounded-lg border border-base-300">
                            <div className="grid grid-cols-3 gap-2">
                                {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                                    <button
                                        key={freq}
                                        onClick={() => {
                                            setFrequency(freq);
                                            if (freq !== frequency) setFrequencyCount(1);
                                        }}
                                        className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${
                                            frequency === freq
                                                ? `${color.bg} ${color.text}`
                                                : 'bg-base-200 text-text-secondary hover:bg-base-300/50'
                                        }`}
                                    >
                                        {freq === 'daily' && '每日'}
                                        {freq === 'weekly' && '每周'}
                                        {freq === 'monthly' && '每月'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={frequencyCount}
                                    onChange={e => setFrequencyCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    min="1"
                                    className="w-24 h-12 text-center text-lg font-semibold bg-base-200 border border-base-300 rounded-lg focus:border-brand-primary focus:outline-none"
                                />
                                <span className="text-text-primary font-medium">
                                    次 / {frequency === 'daily' && '天'}
                                    {frequency === 'weekly' && '周'}
                                    {frequency === 'monthly' && '月'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Other settings */}
                    <div className="space-y-4">
                         <div className="relative">
                            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50 pointer-events-none"/>
                            <select
                                value={reminderTime}
                                onChange={e => setReminderTime(e.target.value)}
                                className="w-full h-12 pl-10 pr-10 bg-base-100 border border-base-300 rounded-lg appearance-none focus:border-brand-primary focus:outline-none"
                            >
                                <option value="">无提醒</option>
                                {timeOptions.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50 pointer-events-none"/>
                        </div>
                         <div className="relative">
                            <QuoteIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50 pointer-events-none"/>
                            <input
                                type="text"
                                value={motivationalQuote}
                                onChange={e => setMotivationalQuote(e.target.value)}
                                placeholder="添加一句激励自己的话"
                                className="w-full h-12 pl-10 pr-4 bg-base-100 border border-base-300 rounded-lg focus:border-brand-primary focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-base-100/50 px-6 py-4 rounded-b-2xl flex justify-end items-center gap-4 border-t border-base-300">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-text-secondary rounded-lg hover:bg-base-300/50 transition-colors">
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-brand-secondary disabled:opacity-50 transition-all"
                        disabled={!name.trim()}
                    >
                        {habitToEdit ? '保存更改' : '创建习惯'}
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px) scale(0.98); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default AddHabitModal;

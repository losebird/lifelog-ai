
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Habit, HabitLog } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import AddHabitModal from './AddHabitModal';
import LogHabitModal from './LogHabitModal';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import * as Icons from './icons/HabitIcons';
import ActivityRing from './ActivityRing';
import { ShareIcon } from './ShareIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useData } from '../contexts/DataProvider';

const ringCustomizationSettings = {
    mainRingStrokeWidth: 22,
    weekViewRingStrokeWidth: 3.5,
    monthViewRingStrokeWidth: 3,
    gradientDirection: 'top-left-to-bottom-right' as const,
};

const ringColors: { [key: string]: { stops: { offset: string, color: string }[], solid: string } } = {
    red: { stops: [{ offset: '0%', color: '#fecaca' }, { offset: '100%', color: '#fca5a5' }], solid: '#fca5a5' },
    orange: { stops: [{ offset: '0%', color: '#fed7aa' }, { offset: '100%', color: '#fdba74' }], solid: '#fdba74' },
    amber: { stops: [{ offset: '0%', color: '#fde68a' }, { offset: '100%', color: '#fcd34d' }], solid: '#fcd34d' },
    green: { stops: [{ offset: '0%', color: '#bbf7d0' }, { offset: '100%', color: '#86efac' }], solid: '#86efac' },
    sky: { stops: [{ offset: '0%', color: '#bae6fd' }, { offset: '100%', color: '#7dd3fc' }], solid: '#7dd3fc' },
    indigo: { stops: [{ offset: '0%', color: '#c7d2fe' }, { offset: '100%', color: '#a5b4fc' }], solid: '#a5b4fc' },
    purple: { stops: [{ offset: '0%', color: '#e9d5ff' }, { offset: '100%', color: '#d8b4fe' }], solid: '#d8b4fe' },
    pink: { stops: [{ offset: '0%', color: '#fbcfe8' }, { offset: '100%', color: '#f9a8d4' }], solid: '#f9a8d4' },
};


const getHabitProgress = (habit: Habit, date: string, logs: HabitLog[]): number => {    
    const log = logs.find(l => l.habitId === habit.id && l.date === date);
    if (!log || !log.completed) return 0;

    switch (habit.goal.type) {
        case 'checkmark':
        case 'note':
            return 100;
        case 'number':
            if (habit.goal.target && habit.goal.target > 0) {
                const value = typeof log.value === 'number' ? log.value : 0;
                return Math.min((value / habit.goal.target) * 100, 1000); // Allow over-achieving progress
            }
            return 100; // If no target, any number completes it
        default:
            return 0;
    }
};

const DayOfWeek: React.FC<{ date: Date; isSelected: boolean; habits: Habit[], logs: HabitLog[]; onClick: () => void; }> = ({ date, isSelected, habits, logs, onClick }) => {
    const dateString = date.toISOString().split('T')[0];
    const dayInitial = date.toLocaleDateString('zh-CN', { weekday: 'narrow' });
    const dayNumber = date.getDate();

    const habitsToShow = habits.slice(0, 3);
    const ringSize = isSelected ? 44 : 40;
    const strokeWidth = ringCustomizationSettings.weekViewRingStrokeWidth + (isSelected ? 0.5 : 0);

    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0 text-center w-14">
            <span className={`text-xs ${isSelected ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>{dayInitial}</span>
            <div className={`relative w-12 h-12 flex items-center justify-center transition-all ${isSelected ? 'bg-base-300/80 rounded-full' : ''}`}>
                <div className="relative">
                     {habitsToShow.map((habit, index) => {
                        const progress = getHabitProgress(habit, dateString, logs);
                        const color = ringColors[habit.color] || ringColors.orange;
                        return (
                            <div key={habit.id} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <ActivityRing
                                    size={ringSize - index * (strokeWidth * 2 + 2)}
                                    strokeWidth={strokeWidth}
                                    progress={progress}
                                    colorStops={color.stops}
                                    gradientDirection={ringCustomizationSettings.gradientDirection}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
             <span className={`text-sm font-semibold ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{dayNumber}</span>
        </button>
    )
};

const CalendarModal: React.FC<{
    habits: Habit[];
    logs: HabitLog[];
    onClose: () => void;
    onDateSelect: (date: Date) => void;
}> = ({ habits, logs, onClose, onDateSelect }) => {
    const [displayMonth, setDisplayMonth] = useState(new Date());

    const changeMonth = (offset: number) => {
        setDisplayMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };
    
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    const calendarDays = useMemo(() => {
        const year = displayMonth.getFullYear();
        const month = displayMonth.getMonth();
        const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7; // Monday is 0
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days: (Date | null)[] = Array(firstDayOfMonth).fill(null);
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [displayMonth]);

    const habitsToShow = habits.slice(0, 3);

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-base-background rounded-2xl shadow-xl w-full max-w-md flex flex-col">
                <header className="flex-shrink-0 flex items-center justify-between py-3 px-4 border-b border-base-300">
                    <h2 className="text-lg font-bold text-text-primary">{displayMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}</h2>
                    <div className="flex items-center gap-2">
                         <button onClick={() => changeMonth(-1)} className="p-2 text-text-secondary rounded-full hover:bg-base-100"><ChevronLeftIcon className="w-5 h-5" /></button>
                         <button onClick={() => changeMonth(1)} className="p-2 text-text-secondary rounded-full hover:bg-base-100"><ChevronRightIcon className="w-5 h-5" /></button>
                         <button onClick={onClose} className="text-base font-semibold text-brand-primary hover:text-brand-secondary">完成</button>
                    </div>
                </header>
                <div className="p-4">
                    <div className="grid grid-cols-7 text-center text-sm text-text-secondary mb-2">
                        {weekdays.map(day => <div key={day}>{day}</div>)}
                    </div>
                     <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, index) => (
                            <button 
                                key={index} 
                                onClick={() => date && onDateSelect(date)}
                                disabled={!date}
                                className="aspect-square flex flex-col items-center justify-center p-0.5 rounded-lg hover:bg-base-100 disabled:opacity-0 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                {date && (
                                    <>
                                        <span className="text-sm font-medium text-text-primary mb-1">{date.getDate()}</span>
                                        <div className="relative w-full h-auto max-w-[36px] aspect-square">
                                           {habitsToShow.map((habit, i) => {
                                                const progress = getHabitProgress(habit, date.toISOString().split('T')[0], logs);
                                                const color = ringColors[habit.color] || ringColors.orange;
                                                return (
                                                    <div key={habit.id} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                                        <ActivityRing
                                                            size={36 - i * 8}
                                                            strokeWidth={ringCustomizationSettings.monthViewRingStrokeWidth}
                                                            progress={progress}
                                                            colorStops={color.stops}
                                                            gradientDirection={ringCustomizationSettings.gradientDirection}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`.animate-fade-in { animation: fadeIn 0.3s ease; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};


const HabitsPage: React.FC = () => {
    const { habits, habitLogs, addHabit, updateHabit, deleteHabit, logHabit } = useData();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [loggingHabit, setLoggingHabit] = useState<{habit: Habit, date: string} | null>(null);
    const [openMenuHabitId, setOpenMenuHabitId] = useState<string | null>(null);
    
    const menuRef = useRef<HTMLDivElement>(null);

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuHabitId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const dateString = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

    const handleOpenAddModal = () => {
        setEditingHabit(null);
        setIsAddModalOpen(true);
    };

    const handleSaveHabit = (habit: Habit) => {
        if (editingHabit) {
            updateHabit(habit);
        } else {
            addHabit(habit);
        }
        setEditingHabit(null);
    };

    const handleHabitPress = (habit: Habit) => {
      const logForDay = habitLogs.find(l => l.habitId === habit.id && l.date === dateString);
      if (habit.goal.type === 'checkmark') {
          logHabit({
              id: logForDay?.id || crypto.randomUUID(), habitId: habit.id, date: dateString, completed: !logForDay?.completed
          });
      } else {
          setLoggingHabit({habit, date: dateString});
      }
    };

    const weekDates = useMemo(() => {
        const dates = [];
        for (let i = 3; i >= -3; i--) { // Show 3 days before and 3 days after selected date
            const date = new Date(selectedDate);
            date.setDate(date.getDate() - i);
            dates.push(date);
        }
        return dates;
    }, [selectedDate]);

    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsAddModalOpen(true);
        setOpenMenuHabitId(null);
    };

    const handleDeleteHabit = (habitId: string) => {
        if (window.confirm('您确定要删除这个习惯吗？此操作无法撤销。')) {
            deleteHabit(habitId);
        }
        setOpenMenuHabitId(null);
    };

    const handleDateSelectFromCalendar = (date: Date) => {
        setSelectedDate(date);
        setIsCalendarOpen(false);
    };

    const habitsToShowOnRings = habits.slice(0, 5);
    const ringSize = 250;
    const strokeWidth = ringCustomizationSettings.mainRingStrokeWidth;

    return (
        <div className="bg-base-background text-text-primary font-sans">
            <header className="flex-shrink-0 p-4 border-b border-base-300 sticky top-0 bg-base-background/80 backdrop-blur-sm z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <h1 className="text-3xl font-bold">进度</h1>
                         <span className="px-2 py-1 bg-base-100 border border-base-300 rounded-md text-xs font-semibold mt-1">
                             {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                         </span>
                         {!isToday(selectedDate) && (
                            <button 
                                onClick={() => setSelectedDate(new Date())}
                                className="px-2 py-1 bg-base-100 border border-base-300 rounded-md text-xs font-semibold text-brand-primary mt-1 hover:bg-base-200"
                            >
                                今天
                            </button>
                         )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsCalendarOpen(true)} className="p-2 rounded-full hover:bg-base-100"><CalendarIcon className="w-6 h-6 text-text-secondary" /></button>
                        <button className="p-2 rounded-full hover:bg-base-100"><ShareIcon className="w-6 h-6 text-text-secondary" /></button>
                    </div>
                </div>
                 <div className="mt-4 flex items-center justify-around">
                    {weekDates.map((date) => (
                        <DayOfWeek 
                            key={date.toISOString()}
                            date={date}
                            isSelected={date.toDateString() === selectedDate.toDateString()}
                            habits={habits}
                            logs={habitLogs}
                            onClick={() => setSelectedDate(date)}
                        />
                    ))}
                </div>
            </header>

            <div className="px-4 pt-2">
                 <div className="relative my-6 flex items-center justify-center h-[250px]">
                    {habitsToShowOnRings.map((habit, index) => {
                        const progress = getHabitProgress(habit, dateString, habitLogs);
                        const color = ringColors[habit.color] || ringColors.orange;
                        return (
                             <div key={habit.id} className="absolute inset-0 flex items-center justify-center drop-shadow-md">
                                <ActivityRing
                                    size={ringSize - index * (strokeWidth * 2 + 4)}
                                    strokeWidth={strokeWidth}
                                    progress={progress}
                                    colorStops={color.stops}
                                    gradientDirection={ringCustomizationSettings.gradientDirection}
                                />
                            </div>
                        );
                    })}
                </div>
                
                <div className="space-y-3">
                    {habits.map(habit => {
                        const log = habitLogs.find(l => l.habitId === habit.id && l.date === dateString);
                        const progress = getHabitProgress(habit, dateString, habitLogs);
                        const color = ringColors[habit.color] || ringColors.orange;
                        const HabitIcon = Icons[habit.icon as keyof typeof Icons] || Icons.FlameIcon;

                        let progressText = '--/--';
                        if(log?.completed) {
                            if(habit.goal.type === 'checkmark' || habit.goal.type === 'note') progressText = '已完成';
                            if(habit.goal.type === 'number') progressText = `${log.value || 0} / ${habit.goal.target || 1} ${habit.goal.unit || ''}`;
                        }

                        return (
                            <div key={habit.id} className="relative">
                                <div onClick={() => handleHabitPress(habit)} className="w-full p-3 bg-base-100 rounded-xl border border-base-300 shadow-sm hover:bg-base-200/50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <HabitIcon className="w-6 h-6 flex-shrink-0" style={{ color: color.solid }} />
                                        <div className="flex-grow text-left">
                                            <p className="font-semibold">{habit.name}</p>
                                            <p className="text-sm text-text-secondary">{progressText}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full bg-base-300 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full"
                                            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color.solid, transition: 'width 0.5s ease-out' }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuHabitId(openMenuHabitId === habit.id ? null : habit.id);
                                        }}
                                        className="p-1.5 rounded-full text-text-secondary hover:bg-base-300/80 hover:text-text-primary"
                                    >
                                        <DotsVerticalIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                {openMenuHabitId === habit.id && (
                                    <div ref={menuRef} className="absolute top-11 right-2 w-32 bg-base-100 border border-base-300 rounded-lg shadow-lg z-20 py-1 animate-fade-in-sm">
                                        <button onClick={() => handleEditHabit(habit)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-base-200/50">
                                            <PencilIcon className="w-4 h-4"/>
                                            <span>编辑</span>
                                        </button>
                                        <button onClick={() => handleDeleteHabit(habit.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-100/50">
                                            <TrashIcon className="w-4 h-4"/>
                                            <span>删除</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <div className="absolute bottom-20 right-4">
                 <button 
                    onClick={handleOpenAddModal} 
                    className="w-12 h-12 flex items-center justify-center bg-base-100 text-text-primary rounded-full hover:bg-base-200 transition-colors shadow-lg border border-base-300"
                    aria-label="添加新习惯"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
            
            {isAddModalOpen && <AddHabitModal onClose={() => setIsAddModalOpen(false)} onSave={handleSaveHabit} habitToEdit={editingHabit} />}
            {loggingHabit && <LogHabitModal habit={loggingHabit.habit} date={loggingHabit.date} logForDay={habitLogs.find(l => l.habitId === loggingHabit.habit.id && l.date === loggingHabit.date)} onClose={() => setLoggingHabit(null)} onSave={logHabit} />}
            {isCalendarOpen && <CalendarModal habits={habits} logs={habitLogs} onClose={() => setIsCalendarOpen(false)} onDateSelect={handleDateSelectFromCalendar} />}
            <style>{`
                @keyframes fade-in-sm {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-sm {
                    animation: fade-in-sm 0.1s ease-out forwards;
                    transform-origin: top right;
                }
            `}</style>
        </div>
    );
};

export default HabitsPage;

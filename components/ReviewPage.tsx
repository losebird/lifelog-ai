
import React, { useState, useMemo, useCallback } from 'react';
import type { Record, Habit, HabitLog } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { useData } from '../contexts/DataProvider';

type View = 'stats' | 'calendar';

const TagCloud: React.FC<{ records: Record[] }> = ({ records }) => {
    const tagCounts = useMemo(() => {
        const counts = new Map<string, number>();
        records.forEach(record => {
            record.tags.forEach(tag => {
                counts.set(tag, (counts.get(tag) || 0) + 1);
            });
        });
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [records]);

    if (tagCounts.length === 0) return null;
    
    const maxCount = tagCounts[0]?.[1] || 1;

    const getFontSize = (count: number) => {
        const size = 12 + (count / maxCount) * 20; // from 12px to 32px
        return `${size}px`;
    };

    return (
        <div className="p-4 bg-base-100 rounded-xl border border-base-300">
            <h3 className="font-bold text-text-primary mb-3">标签云</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                {tagCounts.map(([tag, count]) => (
                    <span key={tag} style={{ fontSize: getFontSize(count) }} className="text-brand-secondary font-semibold">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

const HabitCompletionStats: React.FC<{ habits: Habit[], logs: HabitLog[] }> = ({ habits, logs }) => {
    const stats = useMemo(() => {
        if (habits.length === 0) return [];
        return habits.map(habit => {
            const relevantLogs = logs.filter(log => log.habitId === habit.id && log.completed);
            const totalLogs = logs.filter(log => log.habitId === habit.id).length;
            const completionRate = totalLogs > 0 ? (relevantLogs.length / totalLogs) * 100 : 0;
            return {
                id: habit.id,
                name: habit.name,
                completionRate: Math.round(completionRate)
            };
        });
    }, [habits, logs]);
    
    if (stats.length === 0) return null;

    return (
        <div className="p-4 bg-base-100 rounded-xl border border-base-300">
            <h3 className="font-bold text-text-primary mb-3">习惯完成率</h3>
            <div className="space-y-3">
                {stats.map(stat => (
                    <div key={stat.id}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-text-primary">{stat.name}</span>
                            <span className="font-semibold text-brand-primary">{stat.completionRate}%</span>
                        </div>
                        <div className="w-full bg-base-300 rounded-full h-2">
                            <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${stat.completionRate}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const CalendarView: React.FC<{
    records: Record[],
    navigateToTimeline: (date: Date) => void
}> = ({ records, navigateToTimeline }) => {
    const [displayDate, setDisplayDate] = useState(new Date());

    const recordsByDate = useMemo(() => {
        const map = new Map<string, number>();
        records.forEach(record => {
            const dateStr = new Date(record.timestamp).toISOString().split('T')[0];
            map.set(dateStr, (map.get(dateStr) || 0) + 1);
        });
        return map;
    }, [records]);

    const handleMonthChange = (offset: number) => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };

    const calendarDays = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [displayDate]);
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
        <div className="p-4 bg-base-100 rounded-xl border border-base-300">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-base-200"><ChevronLeftIcon className="w-5 h-5" /></button>
                <h3 className="font-bold text-lg text-text-primary">{displayDate.getFullYear()}年 {displayDate.getMonth() + 1}月</h3>
                <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-base-200"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-sm text-text-secondary">
                {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {calendarDays.map((date, index) => {
                    if (!date) return <div key={index}></div>;
                    
                    const dateStr = date.toISOString().split('T')[0];
                    const hasRecord = recordsByDate.has(dateStr);

                    return (
                        <div key={index} className="aspect-square flex items-center justify-center">
                            <button
                                onClick={() => navigateToTimeline(date)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${hasRecord ? 'bg-brand-accent text-brand-secondary font-bold hover:bg-brand-primary/30' : 'hover:bg-base-200'}`}
                            >
                                {date.getDate()}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ReviewPage: React.FC = () => {
    const { records, habits, habitLogs, navigateToTimeline } = useData();
    const [view, setView] = useState<View>('stats');

    return (
        <div>
            <header className="sticky top-0 z-10 p-4 bg-base-background/80 backdrop-blur-sm border-b border-base-300">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-text-primary">回顾与统计</h1>
                    <div className="p-1 bg-base-300/50 rounded-lg">
                        <button onClick={() => setView('stats')} className={`px-3 py-1 text-sm rounded-md ${view === 'stats' ? 'bg-base-100 shadow-sm' : ''}`}>统计</button>
                        <button onClick={() => setView('calendar')} className={`px-3 py-1 text-sm rounded-md ${view === 'calendar' ? 'bg-base-100 shadow-sm' : ''}`}>日历</button>
                    </div>
                </div>
            </header>
            <main className="p-4 space-y-4">
                {view === 'stats' ? (
                    <>
                        <TagCloud records={records} />
                        <HabitCompletionStats habits={habits} logs={habitLogs} />
                    </>
                ) : (
                    <CalendarView records={records} navigateToTimeline={navigateToTimeline} />
                )}
            </main>
        </div>
    );
};

export default ReviewPage;

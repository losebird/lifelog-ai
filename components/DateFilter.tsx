

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { MenuIcon } from './icons/MenuIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SearchIcon } from './icons/SearchIcon';

interface DateFilterProps {
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
    onGoToSearch: () => void;
    onShowAll: () => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ selectedDate, setSelectedDate, onGoToSearch, onShowAll }) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [displayDate, setDisplayDate] = useState(selectedDate || new Date());
    
    const menuGroupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuGroupRef.current && !menuGroupRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (selectedDate) {
            setDisplayDate(selectedDate);
        }
    }, [selectedDate]);
    
    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const formattedDate = useMemo(() => {
        if (!selectedDate) return { monthYear: '选择日期', day: '' };

        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();

        return {
            monthYear: `${year}年 ${month}月`,
            day: day.toString()
        };
    }, [selectedDate]);


    const handleGoToToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setIsCalendarOpen(false);
    };

    const handleMonthChange = (offset: number) => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };

    const handleDateSelect = (day: number) => {
        const newSelectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        setSelectedDate(newSelectedDate);
        setIsCalendarOpen(false);
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
            days.push(i);
        }
        return days;
    }, [displayDate]);

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    const CalendarContent = () => (
        <div className="bg-base-200 border border-base-300 rounded-2xl shadow-lg p-4 w-72">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-gray-200/50">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="font-semibold text-text-primary">
                    {displayDate.getFullYear()}年 {displayDate.getMonth() + 1}月
                </span>
                <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-gray-200/50">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm text-text-secondary mb-2">
                {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    if (!day) return <div key={index}></div>;

                    const isSelected = selectedDate && selectedDate.getFullYear() === displayDate.getFullYear() && selectedDate.getMonth() === displayDate.getMonth() && selectedDate.getDate() === day;
                    const isDayToday = isToday(new Date(displayDate.getFullYear(), displayDate.getMonth(), day));

                    let dayClasses = 'w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors';

                    if (isSelected) {
                        dayClasses += ' bg-brand-accent text-brand-secondary font-bold';
                    } else {
                        dayClasses += ' hover:bg-gray-200/50';
                        if (isDayToday) {
                            dayClasses += ' font-bold text-brand-primary';
                        } else {
                            dayClasses += ' text-text-primary';
                        }
                    }

                    return (
                        <div key={index} className="flex justify-center items-center h-10">
                            <button 
                                onClick={() => handleDateSelect(day)}
                                className={dayClasses}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            <div className="flex justify-between items-center h-12">
                {/* Left aligned items */}
                <div className="flex-1 flex justify-start">
                    <div ref={menuGroupRef} className="relative">
                        <button 
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="text-text-primary p-2 rounded-full hover:bg-gray-200/50"
                            aria-label="Open menu"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute top-full mt-2 left-0 bg-base-200 border border-base-300 rounded-lg shadow-lg w-48 z-20 py-1 animate-fade-in">
                                <button
                                    onClick={() => { onGoToSearch(); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-base-100 flex items-center gap-3"
                                >
                                    <SearchIcon className="w-4 h-4 text-text-secondary" />
                                    <span>AI 智能搜索</span>
                                </button>
                                 <button
                                    onClick={() => { onShowAll(); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-base-100 flex items-center gap-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                    <span>显示全部</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Centered date picker */}
                <div className="flex-shrink-0">
                    <button 
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)} 
                        className="flex flex-col items-center px-3 py-1.5 rounded-lg hover:bg-gray-200/50"
                    >
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <span>{formattedDate.monthYear}</span>
                            <ChevronDownIcon className={`w-3 h-3 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-2xl font-bold text-text-primary leading-none mt-0.5">{formattedDate.day}</div>
                    </button>
                </div>

                {/* Right aligned items */}
                <div className="flex-1 flex justify-end">
                    <div className="flex items-center gap-2">
                        {!isToday(selectedDate) && selectedDate && (
                             <button 
                                onClick={handleGoToToday} 
                                className="px-3 py-1 text-sm text-text-secondary rounded-full hover:bg-gray-200/80 transition-colors whitespace-nowrap border border-gray-300"
                            >
                                回到今天
                            </button>
                        )}
                        <button className="text-text-primary p-2 rounded-full hover:bg-gray-200/50">
                            <SettingsIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

             {isCalendarOpen && (
                 <div 
                    className="fixed inset-0 z-50 flex items-start justify-center pt-16" 
                    aria-modal="true" 
                    role="dialog"
                >
                    <div 
                        className="fixed inset-x-0 bottom-0 top-16 bg-slate-900/60 animate-fade-in"
                        onClick={() => setIsCalendarOpen(false)}
                    ></div>
                    <div className="relative mt-2 transform transition-all animate-slide-up">
                        <CalendarContent />
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(10px) scale(0.98); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                .animate-fade-in { 
                    animation: fade-in 0.2s ease-out forwards;
                }
                .animate-slide-up {
                    animation: slide-up 0.2s ease-out forwards;
                }
            `}</style>
        </>
    );
};

export default DateFilter;
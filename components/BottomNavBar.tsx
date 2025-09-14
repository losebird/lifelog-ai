
import React from 'react';
import { TimelineIcon } from './icons/TimelineIcon';
import { ListTodoIcon } from './icons/ListTodoIcon';
import { FlameIcon } from './icons/FlameIcon';
import { ReviewIcon } from './icons/ReviewIcon';
import { InsightsIcon } from './icons/InsightsIcon';

type ActiveView = 'timeline' | 'todos' | 'habits' | 'review' | 'insights';

interface BottomNavBarProps {
    activeView: ActiveView;
    onViewChange: (view: ActiveView) => void;
}

const NavItem = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
    >
        {icon}
        <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}>{label}</span>
    </button>
);

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange }) => {
    const navItems = [
        { id: 'timeline', label: '时间线', icon: <TimelineIcon className="w-6 h-6" /> },
        { id: 'todos', label: '待办', icon: <ListTodoIcon className="w-6 h-6" /> },
        { id: 'habits', label: '习惯', icon: <FlameIcon className="w-6 h-6" /> },
        { id: 'review', label: '回顾', icon: <ReviewIcon className="w-6 h-6" /> },
        { id: 'insights', label: '洞察', icon: <InsightsIcon className="w-6 h-6" /> },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-base-200/95 backdrop-blur-sm border-t border-base-300 flex justify-around items-stretch shadow-t-lg z-30">
            {navItems.map(item => (
                <NavItem
                    key={item.id}
                    label={item.label}
                    icon={item.icon}
                    isActive={activeView === item.id}
                    onClick={() => onViewChange(item.id as ActiveView)}
                />
            ))}
        </nav>
    );
};

export default BottomNavBar;

import React, { useState, useRef, useEffect } from 'react';
import type { ActionItem } from '../types';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BellIcon } from './icons/BellIcon';
import { RepeatIcon } from './icons/RepeatIcon';

const PRIORITY_STYLES = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
};

interface ActionItemCardProps {
    item: ActionItem;
    onUpdate: (item: ActionItem) => void;
    onEdit: (item: ActionItem) => void;
    onDelete: (item: ActionItem) => void;
    isDragging: boolean;
}

const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, onUpdate, onEdit, onDelete, isDragging }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSubtaskToggle = (subtaskId: string) => {
        const updatedSubtasks = item.subtasks.map(sub => 
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        onUpdate({ ...item, subtasks: updatedSubtasks });
    };

    const completedSubtasks = item.subtasks.filter(s => s.completed).length;
    const totalSubtasks = item.subtasks.length;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return (
        <div className={`relative bg-base-100 p-3 rounded-lg border border-base-300 shadow-sm space-y-2 ${isDragging ? 'opacity-50' : ''}`}>
            <p className="font-medium text-text-primary pr-8">{item.task}</p>
            
            {totalSubtasks > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span>{completedSubtasks}/{totalSubtasks}</span>
                        <div className="w-full bg-base-300 rounded-full h-1.5">
                            <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto pr-2">
                        {item.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={subtask.completed} 
                                    onChange={() => handleSubtaskToggle(subtask.id)}
                                    className="h-4 w-4 rounded text-brand-primary focus:ring-brand-accent border-gray-300" 
                                />
                                <span className={`text-sm ${subtask.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{subtask.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</span>
                    {item.project && <span className="text-text-secondary bg-base-300/50 px-2 py-0.5 rounded">{item.project}</span>}
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                    {/* FIX: The `title` prop is not a valid SVG attribute. Wrap the icon in a `span` with a title to provide a tooltip. */}
                    {item.reminder && item.reminder !== 'none' && <span title="Reminder set"><BellIcon className="w-4 h-4" /></span>}
                    {/* FIX: The `title` prop is not a valid SVG attribute. Wrap the icon in a `span` with a title to provide a tooltip. */}
                    {item.recurrence && item.recurrence !== 'none' && <span title="Recurring task"><RepeatIcon className="w-4 h-4" /></span>}
                    {item.dueDate && (
                        <p className="text-xs text-brand-secondary">
                            {new Date(item.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </p>
                    )}
                </div>
            </div>

            <div className="absolute top-1 right-1" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(prev => !prev)} 
                    className="p-1.5 rounded-full text-text-secondary hover:bg-base-300/80 hover:text-text-primary"
                >
                    <DotsVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 w-32 bg-base-100 border border-base-300 rounded-lg shadow-lg z-20 py-1">
                        <button 
                            onClick={() => { onEdit(item); setIsMenuOpen(false); }} 
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-base-200/50"
                        >
                            <PencilIcon className="w-4 h-4"/>
                            <span>编辑</span>
                        </button>
                        <button 
                            onClick={() => { onDelete(item); setIsMenuOpen(false); }} 
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-100/50"
                        >
                            <TrashIcon className="w-4 h-4"/>
                            <span>删除</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ActionItemCard;
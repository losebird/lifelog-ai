
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { ActionItem } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BellIcon } from './icons/BellIcon';
import { RepeatIcon } from './icons/RepeatIcon';
import AddTodoModal from './AddTodoModal';
import ActionItemCard from './ActionItemCard';
import { useData } from '../contexts/DataProvider';

type ViewMode = 'list' | 'kanban';
type ActionItemStatus = ActionItem['status'];

const PRIORITY_STYLES = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const TaskInfoIcons: React.FC<{ item: ActionItem }> = ({ item }) => (
    <div className="flex items-center gap-2">
        {item.reminder && item.reminder !== 'none' && (
            <div className="flex items-center gap-1 text-xs text-text-secondary">
                <BellIcon className="w-3.5 h-3.5" />
            </div>
        )}
        {item.recurrence && item.recurrence !== 'none' && (
             <div className="flex items-center gap-1 text-xs text-text-secondary">
                <RepeatIcon className="w-3.5 h-3.5" />
            </div>
        )}
        {item.dueDate && (
             <p className="text-xs text-brand-secondary">
                {new Date(item.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                {new Date(item.dueDate).getHours() !== 12 && ` ${new Date(item.dueDate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
            </p>
        )}
    </div>
);

const KanbanColumn: React.FC<{
    status: ActionItemStatus;
    title: string;
    items: ActionItem[];
    onEdit: (item: ActionItem) => void;
    onDelete: (item: ActionItem) => void;
    onUpdate: (item: ActionItem) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, item: ActionItem) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: ActionItemStatus) => void;
    draggingItem: ActionItem | null;
}> = ({ status, title, items, onEdit, onDelete, onUpdate, onDragStart, onDrop, draggingItem }) => {
    const [isOver, setIsOver] = useState(false);
    return (
        <div 
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={(e) => { onDrop(e, status); setIsOver(false); }}
            className={`w-full md:w-1/3 flex-shrink-0 bg-base-200 p-3 rounded-xl transition-colors ${isOver ? 'bg-base-300' : ''}`}
        >
            <h3 className="font-semibold text-text-primary mb-3 px-2">{title} ({items.length})</h3>
            <div className="space-y-3 min-h-[200px]">
                {items.map(item => (
                    <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item)}>
                       <ActionItemCard 
                            item={item} 
                            onUpdate={onUpdate}
                            onEdit={onEdit}
                            onDelete={onDelete} 
                            isDragging={draggingItem?.id === item.id} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const TodoListItemMenu: React.FC<{ item: ActionItem, onEdit: (item: ActionItem) => void, onDelete: (item: ActionItem) => void }> = ({ item, onEdit, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1.5 rounded-full text-text-secondary hover:bg-base-300/80 hover:text-text-primary">
                <DotsVerticalIcon className="w-5 h-5" />
            </button>
            {isMenuOpen && (
                <div className="absolute top-full right-0 w-32 bg-base-100 border border-base-300 rounded-lg shadow-lg z-20 py-1">
                    <button onClick={() => { onEdit(item); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-base-200/50">
                        <PencilIcon className="w-4 h-4"/>
                        <span>编辑</span>
                    </button>
                    <button onClick={() => { onDelete(item); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-100/50">
                        <TrashIcon className="w-4 h-4"/>
                        <span>删除</span>
                    </button>
                </div>
            )}
        </div>
    );
}

const TodosPage: React.FC = () => {
    const { allActionItems, updateActionItem, addActionItem, deleteActionItem } = useData();
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [draggingItem, setDraggingItem] = useState<ActionItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ActionItem | null>(null);

    const handleSubtaskToggle = (item: ActionItem, subtaskId: string) => {
        const updatedSubtasks = item.subtasks.map(sub =>
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        updateActionItem({ ...item, subtasks: updatedSubtasks });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ActionItem) => {
        setDraggingItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: ActionItemStatus) => {
        if (draggingItem) {
            updateActionItem({ ...draggingItem, status: targetStatus });
            setDraggingItem(null);
        }
    };

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: ActionItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveTask = (itemData: Omit<ActionItem, 'id' | 'recordId' | 'status'>) => {
        if (editingItem) {
            updateActionItem({ ...editingItem, ...itemData });
        } else {
            addActionItem(itemData);
        }
        handleCloseModal();
    };

    const handleDeleteTask = (item: ActionItem) => {
        if (window.confirm(`确定要删除此待办事项吗？\n"${item.task}"`)) {
            deleteActionItem(item);
        }
    };

    const categorizedItems = useMemo(() => {
        const todo: ActionItem[] = [];
        const inprogress: ActionItem[] = [];
        const done: ActionItem[] = [];
        allActionItems.forEach(item => {
            if (item.status === 'done') done.push(item);
            else if (item.status === 'inprogress') inprogress.push(item);
            else todo.push(item);
        });
        return { todo, inprogress, done };
    }, [allActionItems]);

    return (
        <div>
            <header className="sticky top-0 z-10 p-4 bg-base-background/80 backdrop-blur-sm border-b border-base-300">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-text-primary">待办事项</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={handleOpenAddModal} className="px-3 py-1.5 text-sm font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-brand-secondary transition-colors flex items-center gap-2">
                           <PlusIcon className="w-4 h-4" />
                           <span>新增待办</span>
                        </button>
                        <div className="p-1 bg-base-300/50 rounded-lg">
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'list' ? 'bg-base-100 shadow-sm' : ''}`}>列表</button>
                            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'kanban' ? 'bg-base-100 shadow-sm' : ''}`}>看板</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4">
                {allActionItems.length === 0 ? (
                     <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto text-gray-300">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-text-primary">没有待办事项</h2>
                        <p className="mt-2 text-text-secondary">点击“新增待办”来添加您的第一个任务。</p>
                    </div>
                ) : viewMode === 'kanban' ? (
                    <div className="flex flex-col md:flex-row gap-4">
                        <KanbanColumn status="todo" title="待处理" items={categorizedItems.todo} onUpdate={updateActionItem} onEdit={handleOpenEditModal} onDelete={handleDeleteTask} onDragStart={handleDragStart} onDrop={handleDrop} draggingItem={draggingItem} />
                        <KanbanColumn status="inprogress" title="进行中" items={categorizedItems.inprogress} onUpdate={updateActionItem} onEdit={handleOpenEditModal} onDelete={handleDeleteTask} onDragStart={handleDragStart} onDrop={handleDrop} draggingItem={draggingItem} />
                        <KanbanColumn status="done" title="已完成" items={categorizedItems.done} onUpdate={updateActionItem} onEdit={handleOpenEditModal} onDelete={handleDeleteTask} onDragStart={handleDragStart} onDrop={handleDrop} draggingItem={draggingItem} />
                    </div>
                ) : (
                    <div className="space-y-3">
                       {allActionItems.map(item => {
                            const completedSubtasks = item.subtasks.filter(s => s.completed).length;
                            const totalSubtasks = item.subtasks.length;
                            const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

                            return (
                                <div key={item.id} className="bg-base-100 p-3 rounded-lg border border-base-300 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <input type="checkbox" checked={item.status === 'done'} onChange={() => updateActionItem({...item, status: item.status === 'done' ? 'todo' : 'done'})} className="h-5 w-5 rounded text-brand-primary focus:ring-brand-accent border-gray-300 mt-1" />
                                        <div className="flex-grow">
                                            <p className={`font-medium ${item.status === 'done' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{item.task}</p>
                                            <div className="flex items-center gap-4 mt-1">
                                            {item.project && <span className="text-xs text-text-secondary bg-base-300/50 px-1.5 py-0.5 rounded">{item.project}</span>}
                                            <TaskInfoIcons item={item} />
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full self-center ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</span>
                                        <TodoListItemMenu item={item} onEdit={handleOpenEditModal} onDelete={handleDeleteTask} />
                                    </div>
                                    {totalSubtasks > 0 && (
                                        <div className="pl-9 mt-2 space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <span>{completedSubtasks}/{totalSubtasks}</span>
                                                <div className="w-full bg-base-300 rounded-full h-1.5">
                                                    <div className="bg-brand-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {item.subtasks.map(subtask => (
                                                    <div key={subtask.id} className="flex items-center gap-2">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={subtask.completed} 
                                                            onChange={() => handleSubtaskToggle(item, subtask.id)}
                                                            className="h-4 w-4 rounded text-brand-primary focus:ring-brand-accent border-gray-300" 
                                                        />
                                                        <span className={`text-sm ${subtask.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{subtask.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                           )
                       })}
                    </div>
                )}
            </main>
            {isModalOpen && (
                <AddTodoModal
                    itemToEdit={editingItem}
                    onSave={handleSaveTask}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default TodosPage;

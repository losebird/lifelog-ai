
import React, { useState, useEffect } from 'react';
import type { ActionItem } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { CalendarAppIcon } from './icons/CalendarAppIcon';


interface AddTodoModalProps {
    onClose: () => void;
    onSave: (itemData: Omit<ActionItem, 'id' | 'recordId' | 'status'>) => void;
    itemToEdit: ActionItem | null;
}

const AddTodoModal: React.FC<AddTodoModalProps> = ({ onClose, onSave, itemToEdit }) => {
    const [task, setTask] = useState('');
    const [dueDate, setDueDate] =useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState<ActionItem['priority']>('medium');
    const [project, setProject] = useState('');
    const [reminder, setReminder] = useState<ActionItem['reminder']>('none');
    const [recurrence, setRecurrence] = useState<ActionItem['recurrence']>('none');
    const [subtasks, setSubtasks] = useState<{ id: string; text: string; completed: boolean }[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState('');


    useEffect(() => {
        if (itemToEdit) {
            setTask(itemToEdit.task);
            if (itemToEdit.dueDate) {
                const date = new Date(itemToEdit.dueDate);
                setDueDate(date.toISOString().substring(0, 10));
                 // Only set time if it's not the default noon UTC
                if (date.getUTCHours() !== 12 || date.getUTCMinutes() !== 0) {
                     setDueTime(date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                } else {
                    setDueTime('');
                }
            } else {
                setDueDate('');
                setDueTime('');
            }
            setPriority(itemToEdit.priority);
            setProject(itemToEdit.project || '');
            setReminder(itemToEdit.reminder || 'none');
            setRecurrence(itemToEdit.recurrence || 'none');
            setSubtasks(itemToEdit.subtasks || []);
        }
    }, [itemToEdit]);
    
    const handleAddSubtask = () => {
        if (newSubtaskText.trim()) {
            setSubtasks([...subtasks, { id: crypto.randomUUID(), text: newSubtaskText.trim(), completed: false }]);
            setNewSubtaskText('');
        }
    };

    const handleDeleteSubtask = (id: string) => {
        setSubtasks(subtasks.filter(sub => sub.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!task.trim()) return;
        
        let finalDueDate: string | undefined = undefined;
        if (dueDate) {
            const date = new Date(dueDate);
             if (dueTime) {
                const [hours, minutes] = dueTime.split(':');
                date.setUTCHours(Number(hours), Number(minutes));
            } else {
                // Default to noon UTC if no time is set to avoid timezone issues
                date.setUTCHours(12, 0, 0, 0);
            }
            finalDueDate = date.toISOString();
        }

        onSave({
            task: task.trim(),
            dueDate: finalDueDate,
            priority,
            project: project.trim() || undefined,
            reminder,
            recurrence,
            subtasks,
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 animate-slide-up border border-base-300 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b border-base-300">
                        <h2 className="text-xl font-bold text-text-primary">
                            {itemToEdit ? '编辑待办事项' : '新增待办事项'}
                        </h2>
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="task-name" className="text-sm font-medium text-text-primary">任务名称</label>
                            <input
                                id="task-name"
                                type="text"
                                value={task}
                                onChange={e => setTask(e.target.value)}
                                placeholder="例如：完成项目报告"
                                className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg focus:border-brand-primary focus:outline-none"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="task-due-date" className="text-sm font-medium text-text-primary">截止日期</label>
                                <input id="task-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg"/>
                            </div>
                             <div>
                                <label htmlFor="task-due-time" className="text-sm font-medium text-text-primary">时间</label>
                                <input id="task-due-time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="task-reminder" className="text-sm font-medium text-text-primary">提醒</label>
                                <select id="task-reminder" value={reminder} onChange={e => setReminder(e.target.value as ActionItem['reminder'])} className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg">
                                    <option value="none">无</option>
                                    <option value="5m">5 分钟前</option>
                                    <option value="15m">15 分钟前</option>
                                    <option value="1h">1 小时前</option>
                                    <option value="1d">1 天前</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="task-recurrence" className="text-sm font-medium text-text-primary">重复</label>
                                <select id="task-recurrence" value={recurrence} onChange={e => setRecurrence(e.target.value as ActionItem['recurrence'])} className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg">
                                    <option value="none">不重复</option>
                                    <option value="daily">每日</option>
                                    <option value="weekly">每周</option>
                                    <option value="monthly">每月</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="task-priority" className="text-sm font-medium text-text-primary">优先级</label>
                                <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as ActionItem['priority'])} className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg">
                                    <option value="low">低</option>
                                    <option value="medium">中</option>
                                    <option value="high">高</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="task-project" className="text-sm font-medium text-text-primary">项目/分类</label>
                                <input id="task-project" type="text" value={project} onChange={e => setProject(e.target.value)} placeholder="例如：Q3 营销计划" className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg"/>
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-text-primary">子任务</label>
                            <div className="mt-1 space-y-2">
                                {subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2">
                                        <input type="checkbox" checked={sub.completed} readOnly className="h-4 w-4 rounded text-brand-primary focus:ring-brand-accent border-gray-300" />
                                        <span className="flex-grow text-sm">{sub.text}</span>
                                        <button type="button" onClick={() => handleDeleteSubtask(sub.id)} className="text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2">
                                    <input type="text" value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} placeholder="添加子任务..." className="flex-grow p-1.5 text-sm bg-base-100 border border-base-300 rounded-lg" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}/>
                                    <button type="button" onClick={handleAddSubtask} className="p-1.5 bg-brand-accent text-brand-secondary rounded-full hover:opacity-80"><PlusIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-primary">同步</label>
                             <div className="mt-2 flex items-center gap-2">
                                <button type="button" disabled className="flex-1 flex items-center justify-center gap-2 p-2 text-sm bg-base-100 border border-base-300 rounded-lg disabled:opacity-50 cursor-not-allowed" title="需要后端集成">
                                    <GoogleIcon className="w-4 h-4" />
                                    <span>Google 日历</span>
                                </button>
                                <button type="button" disabled className="flex-1 flex items-center justify-center gap-2 p-2 text-sm bg-base-100 border border-base-300 rounded-lg disabled:opacity-50 cursor-not-allowed" title="需要后端集成">
                                    <CalendarAppIcon className="w-4 h-4" />
                                    <span>Apple 提醒事项</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-base-100/50 px-6 py-4 rounded-b-2xl flex justify-end items-center gap-4 border-t border-base-300 mt-auto">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-base-300/50 transition-colors">
                            取消
                        </button>
                        <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg shadow-md hover:bg-brand-secondary transition-all disabled:opacity-50" disabled={!task.trim()}>
                            {itemToEdit ? '保存更改' : '保存任务'}
                        </button>
                    </div>
                </form>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(20px) scale(0.98); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
                /* Custom styles for better date/time input appearance */
                input[type="date"], input[type="time"] {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    position: relative;
                }
             `}</style>
        </div>
    );
};

export default AddTodoModal;
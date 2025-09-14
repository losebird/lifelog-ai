
import React, { useState, useCallback } from 'react';
import type { Record, ActionItem, GeminiAnalysisResult, Emotion } from '../types';
import { analyzeTextWithGemini } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import MarkdownEditor from './MarkdownEditor';

interface AddRecordModalProps {
    onClose: () => void;
    onSave: (record: Record) => void;
}

const templates = {
    '晨间日记': `# 晨间日记\n\n## 😊 今天我感到感激的是...\n\n1. \n2. \n3. \n\n## ✨ 什么能让今天变得很棒？\n\n- \n\n## 📝 今天的积极自我肯定\n\n- `,
    '会议纪要': `# 会议纪要\n\n**日期:** ${new Date().toLocaleDateString('zh-CN')}\n**主题:** \n\n## 参会人员\n\n- \n\n## 议程\n\n1. \n\n## 讨论要点\n\n- \n\n## 行动项\n\n- [ ] 任务1 - @负责人 截止日期：明天`,
};

type View = 'editing' | 'analyzing' | 'approving' | 'saving';
const emotions: Emotion[] = ['😊', '😢', '😠', '😮', '🤔', '😐'];


const AddRecordModal: React.FC<AddRecordModalProps> = ({ onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [view, setView] = useState<View>('editing');
    const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
    const [approvedActionItems, setApprovedActionItems] = useState<Omit<ActionItem, 'id' | 'status' | 'subtasks' | 'recordId'>[]>([]);
    const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);

    const handleUseTemplate = (templateName: keyof typeof templates) => {
        setContent(prevContent => prevContent ? `${prevContent}\n\n${templates[templateName]}` : templates[templateName]);
    };

    const handleAnalyze = useCallback(async () => {
        if (!content.trim()) return;

        setView('analyzing');
        try {
            const analysis = await analyzeTextWithGemini(content);
            setAnalysisResult(analysis);
            if (analysis.actionItems.length > 0) {
                setApprovedActionItems(analysis.actionItems); // Initially, all are approved
                setView('approving');
            } else {
                handleSave(analysis);
            }
        } catch (error) {
            console.error("Failed to analyze text:", error);
            handleSave({ tags: [], actionItems: [] }); // Save without analysis on error
        }
    }, [content]);

    const handleActionItemToggle = (item: Omit<ActionItem, 'id' | 'status' | 'subtasks' | 'recordId'>, isChecked: boolean) => {
        setApprovedActionItems(prev => 
            isChecked ? [...prev, item] : prev.filter(i => i.task !== item.task)
        );
    };

    const handleSelectAllActionItems = () => {
        if (analysisResult) {
            setApprovedActionItems(analysisResult.actionItems);
        }
    };
    
    const handleDeselectAllActionItems = () => {
        setApprovedActionItems([]);
    };

    const handleSave = (currentAnalysis: GeminiAnalysisResult) => {
        setView('saving');
        const recordId = crypto.randomUUID();
        const newRecord: Record = {
            id: recordId,
            type: 'text',
            content: content,
            timestamp: new Date().toISOString(),
            tags: currentAnalysis.tags,
            actionItems: currentAnalysis.actionItems.map(item => ({
                id: crypto.randomUUID(),
                ...item,
                status: 'todo',
                subtasks: [],
                recordId: recordId,
                priority: item.priority || 'medium',
            })),
            emotion: selectedEmotion || currentAnalysis.emotion,
        };
        onSave(newRecord);
    };

    const finalSave = () => {
        if (!analysisResult) return;
        handleSave({ tags: analysisResult.tags, actionItems: approvedActionItems, emotion: analysisResult.emotion });
    };

    const isLoading = view === 'analyzing' || view === 'saving';

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 animate-slide-up border border-base-300 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-text-primary">创建新记录</h2>
                    <p className="text-sm text-text-secondary mt-1">
                        {view === 'editing' && '有什么新鲜事？AI 会帮你整理。'}
                        {view === 'approving' && '请勾选您希望创建的待办事项。'}
                    </p>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {view === 'editing' || view === 'analyzing' ? (
                        <div className="px-6 pb-6">
                            <div className="mb-2 flex justify-end gap-2">
                                {(Object.keys(templates) as Array<keyof typeof templates>).map(name => (
                                    <button key={name} onClick={() => handleUseTemplate(name)} className="px-3 py-1 text-xs bg-base-100 hover:bg-base-300/50 rounded-md border border-base-300 text-text-secondary hover:text-text-primary">
                                        使用模板: {name}
                                    </button>
                                ))}
                            </div>
                            <MarkdownEditor
                                value={content}
                                onChange={setContent}
                                placeholder="在这里输入您的笔记... 支持 Markdown 语法，如 - [ ] 待办事项。"
                                disabled={isLoading}
                                height="h-60"
                                accentColor="blue"
                            />
                             <div className="mt-4">
                                <label className="text-sm font-medium text-text-primary block mb-2">心情如何？</label>
                                <div className="flex justify-around bg-base-100 p-2 rounded-lg border border-base-300">
                                    {emotions.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setSelectedEmotion(emoji)}
                                            className={`text-2xl p-2 rounded-full transition-all duration-200 hover:scale-125 transform ${selectedEmotion === emoji ? 'bg-brand-accent scale-110' : ''}`}
                                            aria-label={`Select emotion: ${emoji}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 pb-2">
                            {analysisResult && analysisResult.actionItems.length > 0 && (
                                <div className="flex items-center justify-end gap-2 mb-3">
                                    <button onClick={handleSelectAllActionItems} className="px-3 py-1 text-xs bg-base-100 border border-base-300 hover:bg-base-300/50 rounded-md">全选</button>
                                    <button onClick={handleDeselectAllActionItems} className="px-3 py-1 text-xs bg-base-100 border border-base-300 hover:bg-base-300/50 rounded-md">全不选</button>
                                </div>
                            )}
                            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 pb-4">
                                {analysisResult && analysisResult.actionItems.length > 0 ? (
                                    analysisResult.actionItems.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                                            <input
                                                type="checkbox"
                                                id={`action-item-${index}`}
                                                className="mt-1 h-5 w-5 rounded bg-base-300 text-tag-blue-text focus:ring-tag-blue-text border-base-300"
                                                checked={approvedActionItems.some(i => i.task === item.task)}
                                                onChange={(e) => handleActionItemToggle(item, e.target.checked)}
                                            />
                                            <label htmlFor={`action-item-${index}`} className="flex-grow cursor-pointer">
                                                <p className="font-medium text-text-primary">{item.task}</p>
                                                {item.dueDate && (
                                                    <p className="text-sm text-brand-secondary">
                                                        截止日期: {new Date(item.dueDate).toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'short' })}
                                                    </p>
                                                )}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-text-secondary py-8">没有检测到待办事项。</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>


                <div className="bg-base-100/50 px-6 py-4 rounded-b-2xl flex justify-end items-center gap-4 border-t border-base-300">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-base-300/50 transition-colors"
                        disabled={isLoading}
                    >
                        取消
                    </button>
                    {view === 'approving' ? (
                        <button
                            onClick={finalSave}
                            className="px-6 py-2 text-sm font-medium text-tag-blue-text bg-tag-blue-bg rounded-lg shadow-md hover:bg-tag-blue-bg/80 transition-all"
                        >
                            {approvedActionItems.length > 0 ? `确认并保存 (${approvedActionItems.length})` : '保存笔记'}
                        </button>
                    ) : (
                        <button
                            onClick={handleAnalyze}
                            className="px-6 py-2 text-sm font-medium text-tag-blue-text bg-tag-blue-bg rounded-lg shadow-md hover:bg-tag-blue-bg/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={!content.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-tag-blue-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {view === 'analyzing' ? '分析中...' : '保存中...'}
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5"/>
                                    保存并分析
                                </>
                            )}
                        </button>
                    )}
                </div>
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
            `}</style>
        </div>
    );
};

export default AddRecordModal;


import React, { useState, useCallback, useEffect } from 'react';
import type { Record, GeminiLinkAnalysisResult, ActionItem } from '../types';
import { analyzeTextWithGemini, analyzeLinkWithGemini } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { LinkIcon } from './icons/LinkIcon';

interface AddLinkModalProps {
    onClose: () => void;
    onSave: (record: Record) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ onClose, onSave }) => {
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
    const [preview, setPreview] = useState<GeminiLinkAnalysisResult | null>(null);

    const isUrlValid = (str: string) => {
        try {
            new URL(str);
            return true;
        } catch (_) {
            return false;
        }
    };
    
    useEffect(() => {
        const checkClipboard = async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (isUrlValid(text)) {
                    setClipboardUrl(text);
                }
            } catch (err) {
                // Could be that permission is not granted. Fail silently.
                console.warn("Could not read from clipboard:", err);
            }
        };
        checkClipboard();
    }, []);

    const handleGeneratePreview = useCallback(async () => {
        if (!isUrlValid(url)) {
            setError('请输入一个有效的网址。');
            return;
        }
        setError(null);
        setIsLoading(true);
        setPreview(null);
        try {
            const result = await analyzeLinkWithGemini(url);
            setPreview(result);
        } catch (err) {
            setError('生成预览失败，请重试。');
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    const handleSave = useCallback(async () => {
        if (!preview) return;

        setIsLoading(true);
        try {
            const noteAnalysis = notes.trim() ? await analyzeTextWithGemini(notes) : { tags: [], actionItems: [] };
            
            const recordId = crypto.randomUUID();
            const newRecord: Record = {
                id: recordId,
                type: 'link',
                content: notes,
                timestamp: new Date().toISOString(),
                tags: [...new Set([...preview.tags, ...noteAnalysis.tags])], // Combine and deduplicate tags
                actionItems: noteAnalysis.actionItems.map((item) => ({
                    id: crypto.randomUUID(),
                    ...item,
                    status: 'todo',
                    subtasks: [],
                    recordId: recordId,
                    priority: item.priority || 'medium',
                })),
                linkDetails: {
                    url: url,
                    title: preview.title,
                    summary: preview.summary,
                },
            };
            onSave(newRecord);
        } catch (err) {
            console.error("Failed to save link record:", err);
        } finally {
            setIsLoading(false);
        }
    }, [notes, onSave, preview, url]);
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 animate-slide-up border border-base-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-base-300">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <LinkIcon className="w-6 h-6" />
                        保存新链接
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">AI 会为您总结和标记它。</p>
                </div>

                <div className="p-6 space-y-4">
                     {clipboardUrl && !url && (
                        <button 
                            onClick={() => {
                                setUrl(clipboardUrl);
                                setClipboardUrl(null);
                            }}
                            className="w-full text-left p-3 bg-base-100 border border-base-300 rounded-lg hover:border-tag-sky-text transition-colors text-sm"
                        >
                            <span className="font-medium text-tag-sky-text">从剪贴板粘贴:</span>
                            <span className="text-text-secondary ml-2 truncate">{clipboardUrl}</span>
                        </button>
                    )}
                    <div className="flex items-stretch gap-2">
                        <input
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="flex-grow p-3 bg-base-100 border border-base-300 rounded-lg text-text-primary focus:border-tag-sky-text focus:outline-none"
                            disabled={isLoading}
                        />
                         <button
                            onClick={handleGeneratePreview}
                            className="px-4 py-2 text-sm font-medium text-white bg-tag-sky-text rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                            disabled={!isUrlValid(url) || isLoading}
                        >
                            {isLoading && !preview ? '生成中...' : '生成预览'}
                        </button>
                    </div>
                   
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    {preview && (
                        <div className="border border-base-300 rounded-lg p-4 bg-base-100 space-y-2 animate-fade-in">
                            <h3 className="font-bold text-text-primary">{preview.title}</h3>
                            <p className="text-sm text-text-secondary">{preview.summary}</p>
                             <div className="flex flex-wrap items-center gap-2 pt-2">
                                {preview.tags.map(tag => (
                                    <span key={tag} className="bg-tag-sky-bg text-tag-sky-text text-xs font-medium px-2 py-0.5 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="在这里添加您的个人笔记..."
                        className="w-full h-24 p-4 bg-base-100 border border-base-300 rounded-lg text-text-primary focus:border-tag-sky-text focus:outline-none resize-none"
                        disabled={isLoading}
                    />
                </div>

                <div className="bg-base-100/50 px-6 py-4 rounded-b-2xl flex justify-end items-center gap-4 border-t border-base-300">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-base-300/50 transition-colors" disabled={isLoading}>
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 text-sm font-medium text-white bg-tag-sky-text rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={!preview || isLoading}
                    >
                        {isLoading ? (
                           <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                保存中...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5"/>
                                保存链接
                            </>
                        )}
                    </button>
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

export default AddLinkModal;
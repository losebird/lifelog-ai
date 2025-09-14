
import React, { useState, useCallback } from 'react';
import type { Record, GeminiFileAnalysisResult, ActionItem } from '../types';
import { analyzeFileContentWithGemini, analyzeImageWithGemini } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import * as pdfjsLib from 'pdfjs-dist';

// Setup the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.4.179/build/pdf.worker.mjs`;

interface AddFileModalProps {
    onClose: () => void;
    onSave: (record: Record) => void;
}

const AddFileModal: React.FC<AddFileModalProps> = ({ onClose, onSave }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<GeminiFileAnalysisResult | null>(null);
    const [fullText, setFullText] = useState<string | null>(null);

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            setFile(files[0]);
            setError(null);
            setAnalysisResult(null);
            setFullText(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files) {
            handleFileChange(e.dataTransfer.files);
        }
    };
    
    const getPdfTextContent = async (fileToRead: File): Promise<string> => {
        const arrayBuffer = await fileToRead.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n\n';
        }
        return fullText;
    };

    const getTextFileContent = (fileToRead: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    resolve(event.target.result);
                } else {
                    reject(new Error('无法读取文件内容。'));
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(fileToRead);
        });
    };

    const getImageBase64 = (fileToRead: File): Promise<{ base64: string, mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    resolve({ base64: event.target.result.split(',')[1], mimeType: fileToRead.type });
                } else {
                    reject(new Error('无法读取图片文件。'));
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(fileToRead);
        });
    };

    const handleAnalyze = useCallback(async () => {
        if (!file) return;

        setIsLoading(true);
        setError(null);
        try {
            let result: GeminiFileAnalysisResult;
            let extractedText = '';

            if (file.type.startsWith('text/')) {
                extractedText = await getTextFileContent(file);
                result = await analyzeFileContentWithGemini(extractedText);
            } else if (file.type.startsWith('image/')) {
                 const { base64, mimeType } = await getImageBase64(file);
                 const imageAnalysis = await analyzeImageWithGemini([base64], mimeType);
                 extractedText = imageAnalysis.ocrText;
                 result = {
                     summaryPoints: [extractedText], // Use OCR text as the main content
                     tags: imageAnalysis.tags,
                     actionItems: imageAnalysis.actionItems
                 };
            } else if (file.type === 'application/pdf') {
                extractedText = await getPdfTextContent(file);
                result = await analyzeFileContentWithGemini(extractedText);
            } else {
                setError(`不支持的内容分析文件类型: ${file.type}。请上传文本、图片或 PDF 文件。`);
                setIsLoading(false);
                return;
            }
            setFullText(extractedText);
            setAnalysisResult(result);

        } catch (err) {
            console.error(err);
            setError('AI分析失败，请重试。');
        } finally {
            setIsLoading(false);
        }

    }, [file]);


    const handleSave = useCallback(async () => {
        if (!file || !analysisResult) return;
        
        const summaryContent = analysisResult.summaryPoints.map(p => `• ${p}`).join('\n');
        const recordId = crypto.randomUUID();

        const newRecord: Record = {
            id: recordId,
            type: 'file',
            content: summaryContent,
            timestamp: new Date().toISOString(),
            tags: analysisResult.tags,
            actionItems: analysisResult.actionItems.map((item) => ({
                id: crypto.randomUUID(),
                ...item,
                status: 'todo',
                subtasks: [],
                recordId: recordId,
                priority: item.priority || 'medium',
            })),
            fileDetails: {
                name: file.name,
                type: file.type,
            },
            fullText: fullText || undefined,
        };
        onSave(newRecord);

    }, [file, analysisResult, fullText, onSave]);
    
    const isAnalyzable = file && (file.type.startsWith('text/') || file.type.startsWith('image/') || file.type === 'application/pdf');

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 animate-slide-up border border-base-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-base-300">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <DocumentIcon className="w-6 h-6" />
                        上传文件并生成摘要
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">上传文本、图片或 PDF，AI 会为您提炼要点。</p>
                </div>

                <div className="p-6 space-y-4">
                     <div 
                        className="w-full p-8 border-2 border-dashed border-base-300 rounded-lg text-center cursor-pointer hover:border-tag-peach-text transition-colors bg-base-100"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload-input')?.click()}
                     >
                        <input type="file" id="file-upload-input" className="hidden" onChange={e => handleFileChange(e.target.files)} />
                        {file ? (
                            <div>
                                <p className="font-semibold text-text-primary">{file.name}</p>
                                <p className="text-sm text-text-secondary">{Math.round(file.size / 1024)} KB</p>
                            </div>
                        ) : (
                            <p className="text-text-secondary">拖拽文件到这里，或点击选择</p>
                        )}
                     </div>

                    {file && !analysisResult && (
                        <div className="text-center">
                            <button
                                onClick={handleAnalyze}
                                className="px-6 py-2 text-sm font-medium text-white bg-tag-peach-text rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                                disabled={!isAnalyzable || isLoading}
                            >
                                {isLoading ? '分析中...' : '开始分析'}
                            </button>
                             {!isAnalyzable && <p className="text-xs text-amber-600 mt-2">此文件类型不支持内容分析，但仍可保存文件信息。</p>}
                        </div>
                    )}
                   
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    {analysisResult && (
                        <div className="border border-base-300 rounded-lg p-4 bg-base-100 space-y-2 animate-fade-in">
                            <h3 className="font-bold text-text-primary">AI 生成的摘要</h3>
                            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                                {analysisResult.summaryPoints.map((point, i) => <li key={i}>{point}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="bg-base-100/50 px-6 py-4 rounded-b-2xl flex justify-end items-center gap-4 border-t border-base-300">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-base-300/50 transition-colors" disabled={isLoading}>
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 text-sm font-medium text-white bg-tag-peach-text rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={!analysisResult || isLoading}
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
                                保存摘要
                            </>
                        )}
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

export default AddFileModal;
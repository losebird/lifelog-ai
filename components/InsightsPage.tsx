
import React, { useState, useCallback } from 'react';
import type { InsightTemplate, ProactiveSuggestion, Record, Habit } from '../types';
import { generateInsightReport } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useData } from '../contexts/DataProvider';

const GenerateReportModal: React.FC<{
    template: InsightTemplate;
    records: Record[];
    onClose: () => void;
}> = ({ template, records, onClose }) => {
    const [dateRange, setDateRange] = useState('7');
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setReport(null);
        try {
            const days = parseInt(dateRange, 10);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            const filteredRecords = records.filter(r => {
                const recordDate = new Date(r.timestamp);
                return recordDate >= startDate && recordDate <= endDate;
            });
            
            const generatedReport = await generateInsightReport(template, filteredRecords);
            setReport(generatedReport);
        } catch (error) {
            console.error(error);
            setReport("生成报告时出错，请稍后再试。");
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, records, template]);

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-base-background rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 border-b border-base-300">
                    <h2 className="text-lg font-bold text-text-primary">{template.name}</h2>
                    <p className="text-sm text-text-secondary">{template.description}</p>
                </header>

                <main className="flex-grow p-4 overflow-y-auto">
                    {isLoading ? (
                         <div className="flex flex-col items-center justify-center h-full">
                            <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="mt-4 text-text-secondary">AI 正在为您分析记录，请稍候...</p>
                        </div>
                    ) : report ? (
                        <div className="prose prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="date-range" className="text-sm font-medium text-text-primary">选择分析的时间范围</label>
                                <select id="date-range" value={dateRange} onChange={e => setDateRange(e.target.value)} className="mt-1 w-full p-2 bg-base-100 border border-base-300 rounded-lg">
                                    <option value="7">过去 7 天</option>
                                    <option value="30">过去 30 天</option>
                                    <option value="90">过去 90 天</option>
                                </select>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-text-primary mb-1">模板问题</h4>
                                <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                                    {template.questions.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </main>
                
                <footer className="flex-shrink-0 bg-base-100/50 p-4 border-t border-base-300 flex justify-end gap-4">
                     <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-text-secondary rounded-lg hover:bg-base-300/50">
                        {report ? '关闭' : '取消'}
                    </button>
                    {!report && (
                        <button onClick={handleGenerate} disabled={isLoading} className="px-5 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-brand-secondary disabled:opacity-50">
                            生成报告
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

const InsightsPage: React.FC = () => {
    const { 
        insightTemplates, 
        proactiveSuggestions, 
        records, 
        isCheckingSuggestions, 
        addHabit 
    } = useData();

    const [selectedTemplate, setSelectedTemplate] = useState<InsightTemplate | null>(null);

    const handleSuggestionAction = (suggestion: ProactiveSuggestion) => {
        if (suggestion.type === 'habit_suggestion' && suggestion.action) {
            addHabit(suggestion.action.data);
            alert(`已为你创建新习惯: "${suggestion.action.data.name}"!`);
        }
    };

    return (
        <div>
            <header className="sticky top-0 z-10 p-4 bg-base-background/80 backdrop-blur-sm border-b border-base-300">
                <h1 className="text-xl font-bold text-text-primary">AI 洞察</h1>
            </header>
            <main className="p-4 space-y-6">
                <section>
                    <h2 className="font-bold text-lg text-text-primary mb-3">AI 建议</h2>
                    {isCheckingSuggestions ? (
                        <p className="text-text-secondary">正在分析您的记录以寻找新洞见...</p>
                    // FIX: Cannot find name 'suggestions'.
                    ) : proactiveSuggestions.length > 0 ? (
                        <div className="space-y-3">
                            {/* FIX: Cannot find name 'suggestions'. */}
                            {proactiveSuggestions.map(s => (
                                <div key={s.id} className="p-3 bg-tag-sky-bg/30 border border-tag-sky-text/30 rounded-lg">
                                    <h3 className="font-semibold text-tag-sky-text">{s.title}</h3>
                                    <p className="text-sm text-text-secondary mt-1">{s.description}</p>
                                    {s.action && (
                                        <button onClick={() => handleSuggestionAction(s)} className="mt-2 px-3 py-1 text-xs font-semibold text-white bg-tag-sky-text rounded-full hover:opacity-80">
                                            {s.action.label}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-secondary text-sm">当 AI 发现您记录中的潜在模式时，建议将显示在此处。</p>
                    )}
                </section>
                <section>
                    <h2 className="font-bold text-lg text-text-primary mb-3">洞察模板库</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insightTemplates.map(template => (
                            <button key={template.id} onClick={() => setSelectedTemplate(template)} className="text-left p-4 bg-base-100 rounded-xl border border-base-300 shadow-sm hover:border-brand-primary hover:shadow-md transition-all">
                                <h3 className="font-semibold text-text-primary">{template.name}</h3>
                                <p className="text-sm text-text-secondary mt-1">{template.description}</p>
                            </button>
                        ))}
                    </div>
                </section>
            </main>
            {selectedTemplate && (
                <GenerateReportModal
                    template={selectedTemplate}
                    records={records}
                    onClose={() => setSelectedTemplate(null)}
                />
            )}
        </div>
    );
};

export default InsightsPage;
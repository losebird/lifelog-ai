import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BoldIcon } from './icons/BoldIcon';
import { ItalicIcon } from './icons/ItalicIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ListCheckIcon } from './icons/ListCheckIcon';
import { QuoteIcon } from './icons/QuoteIcon';
import { HighlightIcon } from './icons/HighlightIcon';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    height?: string;
    accentColor?: 'brand' | 'blue' | 'sky' | 'green' | 'peach';
}

const customMarkdownComponents: any = {
  mark: ({ children }: { children?: React.ReactNode }) => (
    <mark className="bg-amber-200 text-amber-900 px-1 rounded">{children}</mark>
  ),
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder,
    disabled,
    height = 'h-48',
    accentColor = 'brand',
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [view, setView] = useState<'edit' | 'preview'>('edit');

    const accentClassesMap = {
        brand: { border: 'focus-within:border-brand-primary', bg: 'bg-brand-primary', text: 'text-white' },
        blue: { border: 'focus-within:border-tag-blue-text', bg: 'bg-tag-blue-text', text: 'text-white' },
        sky: { border: 'focus-within:border-tag-sky-text', bg: 'bg-tag-sky-text', text: 'text-white' },
        green: { border: 'focus-within:border-tag-green-text', bg: 'bg-tag-green-text', text: 'text-white' },
        peach: { border: 'focus-within:border-tag-peach-text', bg: 'bg-tag-peach-text', text: 'text-white' },
    };
    const selectedAccent = accentClassesMap[accentColor] || accentClassesMap.brand;


    const applyStyle = (syntax: 'bold' | 'italic' | 'ul' | 'todo' | 'quote' | 'highlight') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        let newValue = '';
        let newCursorPos = start;

        switch (syntax) {
            case 'bold':
                newValue = `${value.substring(0, start)}**${selectedText}**${value.substring(end)}`;
                newCursorPos = start + 2;
                break;
            case 'italic':
                newValue = `${value.substring(0, start)}*${selectedText}*${value.substring(end)}`;
                newCursorPos = start + 1;
                break;
            case 'quote':
                 newValue = `${value.substring(0, start)}> ${selectedText}${value.substring(end)}`;
                 newCursorPos = start + 2;
                break;
            case 'ul':
                 newValue = `${value.substring(0, start)}- ${selectedText}${value.substring(end)}`;
                 newCursorPos = start + 2;
                break;
            case 'todo':
                 newValue = `${value.substring(0, start)}- [ ] ${selectedText}${value.substring(end)}`;
                 newCursorPos = start + 6;
                break;
             case 'highlight':
                newValue = `${value.substring(0, start)}==${selectedText}==${value.substring(end)}`;
                newCursorPos = start + 2;
                break;
        }
        
        onChange(newValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos + selectedText.length);
        }, 0);
    };

    const toolbarButtons = [
        { name: 'Bold', icon: <BoldIcon className="w-5 h-5" />, action: () => applyStyle('bold') },
        { name: 'Italic', icon: <ItalicIcon className="w-5 h-5" />, action: () => applyStyle('italic') },
        { name: 'Highlight', icon: <HighlightIcon className="w-5 h-5" />, action: () => applyStyle('highlight') },
        { name: 'Unordered List', icon: <ListBulletIcon className="w-5 h-5" />, action: () => applyStyle('ul') },
        { name: 'Todo List', icon: <ListCheckIcon className="w-5 h-5" />, action: () => applyStyle('todo') },
        { name: 'Quote', icon: <QuoteIcon className="w-5 h-5" />, action: () => applyStyle('quote') },
    ];
    
    return (
        <div className={`bg-base-100 border border-base-300 rounded-lg transition-shadow ${selectedAccent.border}`}>
            <div className="flex items-center justify-between p-2 border-b border-base-300">
                <div className="flex items-center gap-1">
                    {toolbarButtons.map(btn => (
                         <button
                            key={btn.name}
                            type="button"
                            onClick={btn.action}
                            disabled={disabled || view === 'preview'}
                            className="p-2 rounded-md text-text-secondary hover:bg-base-300/50 hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={btn.name}
                            title={btn.name}
                        >
                            {btn.icon}
                        </button>
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setView('edit')} className={`px-3 py-1 text-xs rounded-md ${view === 'edit' ? `${selectedAccent.bg} ${selectedAccent.text}` : 'bg-base-300/50 text-text-secondary'}`} disabled={disabled}>编辑</button>
                    <button onClick={() => setView('preview')} className={`px-3 py-1 text-xs rounded-md ${view === 'preview' ? `${selectedAccent.bg} ${selectedAccent.text}` : 'bg-base-300/50 text-text-secondary'}`} disabled={disabled}>预览</button>
                </div>
            </div>
            {view === 'edit' ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${height} p-4 bg-transparent text-text-primary resize-none border-none focus:ring-0`}
                    disabled={disabled}
                />
            ) : (
                <div className={`w-full ${height} p-4 overflow-y-auto prose prose-slate max-w-none`}>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={customMarkdownComponents}
                    >
                        {value || "没有内容可供预览。"}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default MarkdownEditor;

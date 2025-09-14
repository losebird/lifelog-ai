
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Record } from '../types';
import { TagIcon } from './icons/TagIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { AudioWaveIcon } from './icons/AudioWaveIcon';
import { TextIcon } from './icons/TextIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { LinkIcon } from './icons/LinkIcon';
import { CameraIcon } from './icons/CameraIcon';


interface RecordCardProps {
    record: Record;
    onSelectTag: (tag: string) => void;
}

const getTagColor = (tag: string): { bg: string, text: string } => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        { bg: 'bg-tag-peach-bg', text: 'text-tag-peach-text' },
        { bg: 'bg-tag-green-bg', text: 'text-tag-green-text' },
        { bg: 'bg-tag-sky-bg', text: 'text-tag-sky-text' },
        { bg: 'bg-tag-blue-bg', text: 'text-tag-blue-text' },
        { bg: 'bg-tag-orange-bg', text: 'text-tag-orange-text' },
    ];
    const index = Math.abs(hash % colors.length);
    return colors[index];
};

const getIconStyle = (type: Record['type']): { bg: string; icon: string } => {
  switch (type) {
    case 'text': return { bg: 'bg-tag-blue-bg', icon: 'text-tag-blue-text' };
    case 'voice': return { bg: 'bg-brand-primary', icon: 'text-white' };
    case 'link': return { bg: 'bg-tag-sky-bg', icon: 'text-tag-sky-text' };
    case 'scan': return { bg: 'bg-tag-green-bg', icon: 'text-tag-green-text' };
    case 'file': return { bg: 'bg-tag-peach-bg', icon: 'text-tag-peach-text' };
    default: return { bg: 'bg-gray-200', icon: 'text-gray-600' };
  }
};

const LinkPreviewCard: React.FC<{ record: Record }> = ({ record }) => {
    if (!record.linkDetails) return null;
    const { url, title, summary } = record.linkDetails;
    const domain = new URL(url).hostname;

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="group">
            <p className="font-bold text-lg text-text-primary group-hover:text-brand-primary transition-colors">{title}</p>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{summary}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary/80">
                <GlobeIcon className="w-4 h-4" />
                <span>{domain}</span>
            </div>
        </a>
    );
};

const ScanPreviewCard: React.FC<{ record: Record }> = ({ record }) => {
    if (!record.scanDetails) return null;
    const { imageUrl } = record.scanDetails;

    return (
        <img src={imageUrl} alt="Scanned document" className="rounded-lg max-h-40 w-auto" />
    );
};

const FilePreviewCard: React.FC<{ record: Record }> = ({ record }) => {
    if (!record.fileDetails) return null;
    const { name } = record.fileDetails;

    return (
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-text-secondary">
                <DocumentIcon className="w-8 h-8" />
            </div>
            <div>
                <p className="font-bold text-base text-text-primary">文件摘要</p>
                <p className="text-sm text-text-secondary truncate">{name}</p>
            </div>
        </div>
    );
};

const VoiceRecordPreview: React.FC<{ record: Record }> = ({ record }) => {
    return (
        <div>
            <div className="flex items-center gap-3">
                <AudioWaveIcon className="w-6 h-6 text-brand-primary" />
                <span className="font-mono text-text-primary text-sm">00:00</span>
                <span className="ml-auto text-sm text-text-secondary">
                    {record.audioUrl ? '已转录' : '转录中...'}
                </span>
            </div>
            {record.audioUrl && (
                 <div className="mt-2">
                    <audio controls src={record.audioUrl} className="w-full h-10">
                        您的浏览器不支持音频播放。
                    </audio>
                </div>
            )}
        </div>
    );
};


const customMarkdownComponents: any = {
  p: ({ children }: { children?: React.ReactNode }) => {
    if (!children) return <p></p>;
    const processChildren = (node: React.ReactNode): React.ReactNode => {
      if (typeof node === 'string') {
        const parts = node.split(/(==.*?==)/g);
        return parts.map((part, index) => {
          if (part.startsWith('==') && part.endsWith('==')) {
            return <mark key={index} className="bg-amber-200 text-amber-900 px-1 rounded">{part.substring(2, part.length - 2)}</mark>;
          }
          return part;
        });
      }
      if (Array.isArray(node)) {
        return node.map((child, index) => <React.Fragment key={index}>{processChildren(child)}</React.Fragment>);
      }
      return node;
    };
    return <p className="text-text-primary">{processChildren(children)}</p>;
  },
};

const RecordIcon: React.FC<{ type: Record['type']; iconClass: string }> = ({ type, iconClass }) => {
    const iconProps = { className: `w-4 h-4 ${iconClass}` };
    switch (type) {
        case 'text':
            return <TextIcon {...iconProps} />;
        case 'voice':
            return <MicrophoneIcon {...iconProps} />;
        case 'link':
            return <LinkIcon {...iconProps} />;
        case 'scan':
            return <CameraIcon {...iconProps} />;
        case 'file':
            return <DocumentIcon {...iconProps} />;
        default:
            return null;
    }
};

const RecordCard: React.FC<RecordCardProps> = ({ record, onSelectTag }) => {
    const formattedTime = new Date(record.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const contentParts = record.content.split('\n');
    const title = contentParts.length > 1 && record.type !== 'voice' ? contentParts[0] : null;
    const body = title ? contentParts.slice(1).join('\n') : record.content;
    
    const renderContent = () => {
        switch (record.type) {
            case 'voice':
                return <VoiceRecordPreview record={record} />;
            case 'link':
                return <LinkPreviewCard record={record} />;
            case 'scan':
                return <ScanPreviewCard record={record} />;
            case 'file':
                return <FilePreviewCard record={record} />;
            case 'text':
            default:
                return (
                    <div className="prose prose-slate max-w-none text-text-primary break-words prose-p:text-text-primary prose-headings:text-text-primary prose-strong:text-text-primary prose-a:text-brand-primary">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={customMarkdownComponents}>
                          {body}
                        </ReactMarkdown>
                    </div>
                );
        }
    };

    const { bg, icon } = getIconStyle(record.type);
    
    return (
        <div className="relative">
            <span className="absolute -left-[46px] top-0 w-8 text-center text-xs text-text-secondary" aria-label={`Record time: ${formattedTime}`}>
                {formattedTime}
            </span>
            <div 
                className={`absolute -left-[46px] top-5 w-8 h-8 ${bg} rounded-full flex items-center justify-center ring-4 ring-base-background`} 
                aria-hidden="true"
            >
                <RecordIcon type={record.type} iconClass={icon} />
            </div>

            <div className="pt-5">
                 <div className="flex items-center mb-1">
                    {title && <h3 className="font-semibold text-text-primary text-base">{title}</h3>}
                    {record.emotion && <span className={`text-lg ${title ? 'ml-2' : ''}`}>{record.emotion}</span>}
                 </div>

                <div className="bg-base-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4">
                        {renderContent()}
                    </div>
                    {(record.tags.length > 0 || record.actionItems.length > 0) && (
                        <div className="bg-gray-50 px-4 py-3 space-y-3 border-t border-gray-200">
                            {record.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <TagIcon className="w-4 h-4 text-text-secondary" />
                                    {record.tags.map(tag => {
                                        const { bg, text } = getTagColor(tag);
                                        return (
                                          <button 
                                              key={tag} 
                                              onClick={() => onSelectTag(tag)}
                                              className={`${bg} ${text} text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity`}
                                          >
                                              {tag}
                                          </button>
                                        )
                                    })}
                                </div>
                            )}

                            {record.actionItems.length > 0 && (
                                <div className="space-y-2">
                                    {record.actionItems.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CalendarIcon className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
                                            <div className="flex-grow">
                                                <p className="text-sm font-medium text-text-primary">{item.task}</p>
                                                {item.dueDate && (
                                                    <p className="text-xs text-brand-secondary">
                                                        截止日期: {new Date(item.dueDate).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecordCard;

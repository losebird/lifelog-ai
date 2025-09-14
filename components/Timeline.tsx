import React from 'react';
import type { Record } from '../types';
import RecordCard from './RecordCard';

interface TimelineProps {
    records: Record[];
    onSelectTag: (tag: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ records, onSelectTag }) => {
    if (!records || records.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v3.776" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-text-primary">没有找到记录。</h2>
                <p className="mt-2 text-text-secondary">请尝试不同的日期或清除标签过滤器。</p>
            </div>
        );
    }

    return (
        <div className="relative pl-[60px]">
            {/* The vertical timeline line has been removed as per the user's request. */}
            <div className="space-y-0">
                {records.map(record => (
                    <RecordCard key={record.id} record={record} onSelectTag={onSelectTag} />
                ))}
            </div>
        </div>
    );
};

export default Timeline;
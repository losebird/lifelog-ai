import React, { useState } from 'react';
import type { Record } from '../types';
import Timeline from './Timeline';
import SearchHeader from './SearchHeader';
import { SparklesIcon } from './icons/SparklesIcon';

interface SearchPageProps {
    onSearch: (query: string) => void;
    isSearching: boolean;
    searchActive: boolean;
    onClearSearch: () => void;
    records: Record[];
    onSelectTag: (tag: string) => void;
    onGoBack: () => void;
    searchSuggestions: string[];
    isLoadingSuggestions: boolean;
}

const SearchPage: React.FC<SearchPageProps> = ({
    onSearch,
    isSearching,
    searchActive,
    onClearSearch,
    records,
    onSelectTag,
    onGoBack,
    searchSuggestions,
    isLoadingSuggestions
}) => {
    const [localQuery, setLocalQuery] = useState('');

    const handleSuggestionClick = (suggestion: string) => {
        setLocalQuery(suggestion);
        onSearch(suggestion);
    };

    const handleClear = () => {
        setLocalQuery('');
        onClearSearch();
    };

    return (
        <div className="min-h-screen bg-base-background text-text-primary font-sans">
            <header className="sticky top-0 z-10 p-2 bg-base-background/80 backdrop-blur-sm border-b border-base-300">
                <SearchHeader
                    onGoBack={onGoBack}
                    onSearch={onSearch}
                    onClearSearch={handleClear}
                    isSearching={isSearching}
                    searchActive={searchActive}
                    value={localQuery}
                    onValueChange={setLocalQuery}
                />
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                 {searchActive ? (
                    <Timeline records={records} onSelectTag={onSelectTag} />
                 ) : (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 mx-auto text-brand-primary/50 mb-4">
                           <SparklesIcon />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary mb-2">智能搜索</h2>
                        <p className="text-text-secondary mb-8 max-w-md mx-auto">输入关键词搜索您的整个记录，或从下面的 AI 建议中选择一个开始。</p>
                        
                        {isLoadingSuggestions ? (
                            <div className="flex justify-center items-center gap-2 text-text-secondary">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>正在生成建议...</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap justify-center gap-3">
                                {searchSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="bg-base-200 text-text-primary px-4 py-2 rounded-full border border-base-300 hover:bg-brand-primary/10 hover:border-brand-primary/80 transition-all duration-200 text-sm shadow-sm"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                        { !isLoadingSuggestions && searchSuggestions.length === 0 && (
                            <p className="text-text-secondary mt-4">没有可用的建议。请在上方开始输入。</p>
                        )}
                    </div>
                 )}
            </main>
        </div>
    );
};

export default SearchPage;
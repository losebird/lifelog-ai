import React from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

interface SearchHeaderProps {
    onSearch: (query: string) => void;
    onClearSearch: () => void;
    isSearching: boolean;
    searchActive: boolean;
    value: string;
    onValueChange: (value: string) => void;
    onGoBack: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ 
    onSearch, 
    onClearSearch, 
    isSearching, 
    searchActive,
    value,
    onValueChange,
    onGoBack
}) => {
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(value);
    };

    return (
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full">
            <button
                type="button"
                onClick={onGoBack} 
                className="flex-shrink-0 h-10 w-10 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-gray-200/50 transition-colors"
                aria-label="Back to timeline"
            >
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            
            <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {isSearching ? (
                         <svg className="animate-spin h-5 w-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <SearchIcon className="h-5 w-5 text-text-secondary" />
                    )}
                </div>
                <input
                    type="search"
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    placeholder="在所有记录中进行 AI 智能搜索..."
                    className="w-full h-10 pl-11 pr-4 text-base bg-base-100 border border-base-300 rounded-full focus:border-brand-primary focus:outline-none"
                />
            </div>
            {searchActive && (
                 <button
                    type="button"
                    onClick={onClearSearch} 
                    className="flex-shrink-0 h-10 px-4 text-sm text-text-secondary rounded-full hover:bg-gray-200/80 transition-colors whitespace-nowrap border border-gray-300"
                >
                    清除搜索
                </button>
            )}
        </form>
    );
};

export default SearchHeader;
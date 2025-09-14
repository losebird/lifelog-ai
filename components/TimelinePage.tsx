
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Record } from '../types';
import Timeline from './Timeline';
import AddRecordModal from './AddRecordModal';
import AddVoiceRecordModal from './AddVoiceRecordModal';
import AddLinkModal from './AddLinkModal';
import AddScanModal from './AddScanModal';
import AddFileModal from './AddFileModal';
import FloatingActionButton from './FloatingActionButton';
import DateFilter from './DateFilter';
import SearchPage from './SearchPage';
import { searchRecordsWithGemini, generateSearchSuggestions } from '../services/geminiService';
import { useData } from '../contexts/DataProvider';

const TimelinePage: React.FC = () => {
    const { records, addRecord, initialTimelineDate, onDateChange } = useData();
    
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    
    // FIX: Cannot find name 'initialDate'.
    const [selectedDate, setSelectedDate] = useState<Date | null>(initialTimelineDate || new Date());
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedRecordIds, setSearchedRecordIds] = useState<string[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [view, setView] = useState<'timeline' | 'search'>('timeline');

    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // FIX: Cannot find name 'initialDate'.
    useEffect(() => {
        if (initialTimelineDate) {
            // FIX: Cannot find name 'initialDate'.
            setSelectedDate(initialTimelineDate);
            onDateChange(); // Signal that the initial date has been consumed
        }
    // FIX: Cannot find name 'initialDate'.
    }, [initialTimelineDate, onDateChange]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (view === 'search' && records.length > 0) {
                setIsLoadingSuggestions(true);
                setSearchSuggestions([]);
                try {
                    const suggestions = await generateSearchSuggestions(records);
                    setSearchSuggestions(suggestions);
                } catch (error) {
                    console.error("Failed to fetch search suggestions:", error);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            }
        };
        fetchSuggestions();
    }, [view, records]);

    const handleSaveRecord = (newRecord: Record) => {
        addRecord(newRecord);
        setIsTextModalOpen(false);
        setIsVoiceModalOpen(false);
        setIsLinkModalOpen(false);
        setIsScanModalOpen(false);
        setIsFileModalOpen(false);
    };
    
    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            handleClearSearch();
            return;
        }
        setIsSearching(true);
        setSearchQuery(query);
        try {
            const ids = await searchRecordsWithGemini(query, records);
            setSearchedRecordIds(ids);
        } catch (error) {
            console.error("Search failed:", error);
            setSearchedRecordIds([]);
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchedRecordIds(null);
    };
    
    const handleShowAll = useCallback(() => {
        setSelectedDate(null);
        setSelectedTag(null);
        handleClearSearch();
        setView('timeline');
    }, []);

    const handleGoToSearch = useCallback(() => {
        setView('search');
    }, []);

    const handleGoBack = useCallback(() => {
        setView('timeline');
        handleClearSearch();
    }, []);

    const handleDateSelect = useCallback((date: Date | null) => {
        setSelectedDate(date);
        setSelectedTag(null);
        handleClearSearch();
        if (view !== 'timeline') {
            setView('timeline');
        }
    }, [view]);

    const filteredRecords = useMemo(() => {
        if (searchedRecordIds) {
            const searchIdSet = new Set(searchedRecordIds);
            const searchResults = records
                .filter(record => searchIdSet.has(record.id))
                .sort((a, b) => searchedRecordIds.indexOf(a.id) - searchedRecordIds.indexOf(b.id));
            return searchResults;
        }

        return records.filter(record => {
            const recordDate = new Date(record.timestamp);
            const dateMatch = !selectedDate || (
                recordDate.getFullYear() === selectedDate.getFullYear() &&
                recordDate.getMonth() === selectedDate.getMonth() &&
                recordDate.getDate() === selectedDate.getDate()
            );
            const tagMatch = !selectedTag || record.tags.includes(selectedTag);
            return dateMatch && tagMatch;
        });
    }, [records, selectedDate, selectedTag, searchedRecordIds]);

    const handleSelectTag = (tag: string) => {
        setSelectedTag(prevTag => prevTag === tag ? null : tag);
        handleClearSearch();
        setSelectedDate(null);
        setView('timeline');
    };

    const openTextModal = useCallback(() => setIsTextModalOpen(true), []);
    const closeTextModal = useCallback(() => setIsTextModalOpen(false), []);
    const openVoiceModal = useCallback(() => setIsVoiceModalOpen(true), []);
    const closeVoiceModal = useCallback(() => setIsVoiceModalOpen(false), []);
    const openLinkModal = useCallback(() => setIsLinkModalOpen(true), []);
    const closeLinkModal = useCallback(() => setIsLinkModalOpen(false), []);
    const openScanModal = useCallback(() => setIsScanModalOpen(true), []);
    const closeScanModal = useCallback(() => setIsScanModalOpen(false), []);
    const openFileModal = useCallback(() => setIsFileModalOpen(true), []);
    const closeFileModal = useCallback(() => setIsFileModalOpen(false), []);
    
    if (view === 'search') {
        return (
            <SearchPage
                onSearch={handleSearch}
                isSearching={isSearching}
                searchActive={!!searchedRecordIds}
                onClearSearch={handleClearSearch}
                records={filteredRecords}
                onSelectTag={handleSelectTag}
                onGoBack={handleGoBack}
                searchSuggestions={searchSuggestions}
                isLoadingSuggestions={isLoadingSuggestions}
            />
        );
    }

    return (
        <div className="h-full">
            <header className="sticky top-0 z-10 p-2 bg-base-background/80 backdrop-blur-sm border-b border-base-300">
                <DateFilter
                    selectedDate={selectedDate}
                    setSelectedDate={handleDateSelect}
                    onGoToSearch={handleGoToSearch}
                    onShowAll={handleShowAll}
                />
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                 {selectedTag && (
                    <div className="my-4 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-base-200 p-2 rounded-xl shadow-sm border border-base-300">
                            <span className="text-sm text-text-secondary">筛选标签:</span>
                            <span className="bg-brand-primary/10 text-brand-primary text-sm font-medium px-2.5 py-1 rounded-full">
                                {selectedTag}
                            </span>
                            <button
                                onClick={() => setSelectedTag(null)}
                                className="ml-1 text-text-secondary hover:text-text-primary p-1 rounded-full bg-base-300/50 hover:bg-base-300"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )}
               
                <Timeline records={filteredRecords} onSelectTag={handleSelectTag} />
            </main>
            
            <FloatingActionButton 
                onAddText={openTextModal} 
                onAddVoice={openVoiceModal} 
                onAddLink={openLinkModal}
                onAddScan={openScanModal}
                onAddFile={openFileModal}
            />

            {isTextModalOpen && <AddRecordModal onClose={closeTextModal} onSave={handleSaveRecord} />}
            {isVoiceModalOpen && <AddVoiceRecordModal onClose={closeVoiceModal} onSave={handleSaveRecord} />}
            {isLinkModalOpen && <AddLinkModal onClose={closeLinkModal} onSave={handleSaveRecord} />}
            {isScanModalOpen && <AddScanModal onClose={closeScanModal} onSave={handleSaveRecord} />}
            {isFileModalOpen && <AddFileModal onClose={closeFileModal} onSave={handleSaveRecord} />}
        </div>
    );
};

export default TimelinePage;
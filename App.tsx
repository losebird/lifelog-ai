
import React from 'react';
import { useData } from './contexts/DataProvider';
import TimelinePage from './components/TimelinePage';
import TodosPage from './components/TodosPage';
import HabitsPage from './components/HabitsPage';
import BottomNavBar from './components/BottomNavBar';
import ReviewPage from './components/ReviewPage';
import InsightsPage from './components/InsightsPage';

const App: React.FC = () => {
    const { activeView, setActiveView, isLoading } = useData();

    const renderView = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            );
        }

        switch (activeView) {
            case 'todos':
                return <TodosPage />;
            case 'habits':
                return <HabitsPage />;
            case 'review':
                return <ReviewPage />;
            case 'insights':
                return <InsightsPage />;
            case 'timeline':
            default:
                return <TimelinePage />;
        }
    };

    return (
        <div className="min-h-screen bg-base-background text-text-primary font-sans flex flex-col h-screen">
            <main className="flex-grow overflow-y-auto pb-20">
                {renderView()}
            </main>
            <BottomNavBar activeView={activeView} onViewChange={setActiveView} />
        </div>
    );
};

export default App;

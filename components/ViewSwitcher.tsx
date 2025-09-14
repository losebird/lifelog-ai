
import React from 'react';

type ViewMode = 'list' | 'day' | 'week';

interface ViewSwitcherProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
    const views: { id: ViewMode; label: string }[] = [
        { id: 'list', label: '列表' },
        { id: 'day', label: '按天分组' },
        { id: 'week', label: '按周分组' },
    ];

    return (
        <div className="flex items-center bg-base-100 p-1 rounded-lg border border-base-300">
            {views.map(({ id, label }) => (
                <button
                    key={id}
                    onClick={() => onViewChange(id)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        currentView === id
                            ? 'bg-base-200 text-brand-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

export default ViewSwitcher;

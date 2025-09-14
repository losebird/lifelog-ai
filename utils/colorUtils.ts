
export const habitColors: Record<string, { bg: string, text: string, border: string, ring: string }> = {
    orange: { 
        bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500', ring: 'ring-orange-500'
    },
    red: { 
        bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500', ring: 'ring-red-500'
    },
    amber: { 
        bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-500', ring: 'ring-amber-500'
    },
    green: {
        bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500', ring: 'ring-green-500'
    },
    sky: { 
        bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-500', ring: 'ring-sky-500'
    },
    indigo: {
        bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500', ring: 'ring-indigo-500'
    },
    purple: {
        bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500', ring: 'ring-purple-500'
    },
    pink: {
        bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-500', ring: 'ring-pink-500'
    },
};

export const getHabitColor = (colorKey: string) => {
    return habitColors[colorKey] || habitColors.orange;
};

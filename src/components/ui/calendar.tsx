"use client";

import React, { useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
    selected?: Date;
    onSelect: (date: Date) => void;
    minDate?: Date;
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect, minDate = new Date() }) => {
    const [currentMonth, setCurrentMonth] = React.useState<Date>(() => selected || new Date());

    React.useEffect(() => {
        if (selected) {
            setCurrentMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
        }
    }, [selected]);

    const handlePrevMonth = useCallback(() => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const handleDateClick = useCallback((day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        if (minDate) {
            const minCopy = new Date(minDate);
            minCopy.setHours(0, 0, 0, 0);
            if (newDate < minCopy) return;
        }
        onSelect(newDate);
    }, [currentMonth, minDate, onSelect]);

    const days = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay();

        const minTimestamp = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime() : null;
        const selectedTimestamp = selected ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()).getTime() : null;
        const todayTimestamp = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();

        const cells = [];
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="w-8 h-8" />);
        }

        for (let day = 1; day <= totalDays; day++) {
            const thisDateTimestamp = new Date(year, month, day).getTime();
            const isSelected = selectedTimestamp !== null && thisDateTimestamp === selectedTimestamp;
            const isDisabled = minTimestamp !== null && thisDateTimestamp < minTimestamp;
            const isToday = thisDateTimestamp === todayTimestamp;

            cells.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    disabled={isDisabled}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors
                        ${isSelected ? 'bg-brand-primary text-white font-semibold shadow-sm' : ''}
                        ${!isSelected && !isDisabled ? 'hover:bg-gray-100 text-gray-700' : ''}
                        ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
                        ${isToday && !isSelected ? 'border border-brand-primary text-brand-primary font-medium' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }
        return cells;
    }, [currentMonth, selected, minDate, handleDateClick]);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="p-2 sm:p-4 w-full mx-auto select-none">
            <div className="flex justify-between items-center mb-4">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </button>
                <span className="font-bold text-gray-800 dark:text-slate-200 text-sm sm:text-base">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    aria-label="Next month"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-400 dark:text-slate-500">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>
        </div>
    );
};

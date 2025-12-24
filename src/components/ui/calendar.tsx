"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
    selected?: Date;
    onSelect: (date: Date) => void;
    minDate?: Date;
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect, minDate = new Date() }) => {
    const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

        // Fix: Create a copy of minDate to avoid mutation
        const minDateCopy = minDate ? new Date(minDate) : null;
        if (minDateCopy) {
            minDateCopy.setHours(0, 0, 0, 0);
            if (newDate < minDateCopy) return;
        }

        onSelect(newDate);
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const isSelected = selected && date.toDateString() === selected.toDateString();

            // Fix: Create a copy of minDate to avoid mutation
            const minDateCopy = minDate ? new Date(minDate) : null;
            if (minDateCopy) minDateCopy.setHours(0, 0, 0, 0);

            // Ensure isDisabled is a boolean
            const isDisabled = !!(minDateCopy && date < minDateCopy);
            const isToday = date.toDateString() === new Date().toDateString();

            days.push(
                <button
                    key={i}
                    onClick={() => handleDateClick(i)}
                    disabled={isDisabled}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors
                        ${isSelected ? 'bg-brand-primary text-white' : ''}
                        ${!isSelected && !isDisabled ? 'hover:bg-gray-100 text-gray-700' : ''}
                        ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
                        ${isToday && !isSelected ? 'border border-brand-primary text-brand-primary' : ''}
                    `}
                >
                    {i}
                </button>
            );
        }

        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="p-2 sm:p-4 w-full mx-auto">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="font-bold text-gray-800 text-sm sm:text-base">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>
        </div>
    );
};

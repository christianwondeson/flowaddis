"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangeCalendarProps {
    checkIn?: string;
    checkOut?: string;
    onRangeChange: (checkIn: string, checkOut: string) => void;
    minDate?: Date;
}

function parseDate(str: string): Date {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function MonthGrid({
    month,
    checkInDate,
    checkOutDate,
    minDate,
    onDateClick,
}: {
    month: Date;
    checkInDate: Date | null;
    checkOutDate: Date | null;
    minDate: Date;
    onDateClick: (date: Date) => void;
}) {
    const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const firstDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    const totalDays = daysInMonth(month);
    const startDay = firstDay(month);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);

    const days: React.ReactNode[] = [];
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`e-${i}`} className="w-8 h-8" />);
    }
    for (let i = 1; i <= totalDays; i++) {
        const date = new Date(month.getFullYear(), month.getMonth(), i);
        const isDisabled = date < min;
        const isCheckIn = checkInDate && date.toDateString() === checkInDate.toDateString();
        const isCheckOut = checkOutDate && date.toDateString() === checkOutDate.toDateString();
        const isInRange =
            checkInDate &&
            checkOutDate &&
            date > checkInDate &&
            date < checkOutDate;
        const isToday = date.toDateString() === new Date().toDateString();

        days.push(
            <button
                key={i}
                type="button"
                onClick={() => onDateClick(date)}
                disabled={isDisabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${isCheckIn || isCheckOut ? 'bg-teal-600 text-white' : ''}
                    ${isInRange ? 'bg-teal-100 text-teal-800' : ''}
                    ${!isCheckIn && !isCheckOut && !isInRange && !isDisabled ? 'hover:bg-gray-100 text-gray-700' : ''}
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${isToday && !isCheckIn && !isCheckOut ? 'ring-1 ring-teal-500 text-teal-600' : ''}
                `}
            >
                {i}
            </button>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="text-center font-semibold text-gray-800 text-sm mb-3">
                {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
    );
}

export const DateRangeCalendar: React.FC<DateRangeCalendarProps> = ({
    checkIn,
    checkOut,
    onRangeChange,
    minDate = new Date(),
}) => {
    const checkInDate = checkIn ? parseDate(checkIn) : null;
    const checkOutDate = checkOut ? parseDate(checkOut) : null;
    const startMonth = checkInDate || checkOutDate || minDate;
    const [leftMonth, setLeftMonth] = React.useState(startMonth);

    const rightMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1);

    const handleDateClick = (clicked: Date) => {
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        if (clicked < min) return;

        if (!checkInDate || (checkInDate && checkOutDate)) {
            onRangeChange(formatDate(clicked), formatDate(new Date(clicked.getTime() + 86400000)));
        } else if (clicked <= checkInDate) {
            onRangeChange(formatDate(clicked), formatDate(new Date(clicked.getTime() + 86400000)));
        } else {
            onRangeChange(checkIn!, formatDate(clicked));
        }
    };

    const goPrev = () => {
        setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() - 1));
    };

    const goNext = () => {
        setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1));
    };

    const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const canGoPrev = leftMonth.getTime() > minMonth.getTime();

    return (
        <div className="p-4 w-full">
            <div className="flex justify-between items-center mb-4">
                <button
                    type="button"
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-medium text-gray-500">
                    Select check-in and check-out
                </span>
                <button
                    type="button"
                    onClick={goNext}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    aria-label="Next month"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <MonthGrid
                    month={leftMonth}
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    minDate={minDate}
                    onDateClick={handleDateClick}
                />
                <MonthGrid
                    month={rightMonth}
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    minDate={minDate}
                    onDateClick={handleDateClick}
                />
            </div>
        </div>
    );
};

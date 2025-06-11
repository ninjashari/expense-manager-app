'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface MonthPickerProps {
    date: Date;
    onDateChange: (date: Date) => void;
}

export const MonthPicker = ({ date, onDateChange }: MonthPickerProps) => {
    const onPrevMonth = () => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() - 1);
        onDateChange(newDate);
    };

    const onNextMonth = () => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + 1);
        onDateChange(newDate);
    };

    return (
        <div className="flex items-center gap-x-2">
            <Button onClick={onPrevMonth} variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-bold text-sm">
                {format(date, 'MMMM yyyy')}
            </div>
            <Button onClick={onNextMonth} variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}; 
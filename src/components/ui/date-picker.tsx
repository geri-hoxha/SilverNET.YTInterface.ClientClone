import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", disabled, fromDate, toDate, className }: DatePickerProps) {
  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn("h-8 min-w-0 flex-1 justify-start gap-2 px-2.5 font-normal active:scale-100", !value && "text-muted-foreground", className)}
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <span className="truncate">{value ? format(value, "dd MMM yyyy") : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            defaultMonth={value}
            captionLayout="dropdown"
            fromDate={fromDate}
            toDate={toDate}
            disabled={(date) => {
              const day = startOfDay(date);
              if (fromDate && isBefore(day, startOfDay(fromDate))) return true;
              if (toDate && isAfter(day, startOfDay(toDate))) return true;
              return false;
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 shrink-0" onClick={() => onChange(undefined)} aria-label="Clear date">
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

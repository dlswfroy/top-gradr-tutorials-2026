"use client"

import * as React from "react"
import { format } from "date-fns"
import { bn } from 'date-fns/locale'
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  triggerClassName?: string;
  placeholder?: string;
}

export function DatePicker({ value, onChange, triggerClassName, placeholder = "একটি তারিখ নির্বাচন করুন" }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  // Internal state for the picker before 'Set' is clicked
  const [displayDate, setDisplayDate] = React.useState<Date | undefined>(value)

  // When the popover opens, sync the display date with the external value
  React.useEffect(() => {
    if (open) {
      setDisplayDate(value);
    }
  }, [value, open]);

  const handleSet = () => {
    onChange(displayDate);
    setOpen(false);
  }
  
  const handleCancel = () => {
    setOpen(false); // Just close, don't revert internal state until next open
  }

  const handleClear = () => {
    onChange(undefined);
    setOpen(false);
  }
  
  const headerDate = displayDate || value || new Date();
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            triggerClassName
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP", { locale: bn }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="bg-primary text-primary-foreground p-4 rounded-t-md">
            <div className="text-lg font-semibold">{format(headerDate, "yyyy", { locale: bn })}</div>
            <div className="text-3xl font-bold">{format(headerDate, "E, MMM d", { locale: bn })}</div>
        </div>
        <Calendar
          mode="single"
          selected={displayDate}
          onSelect={setDisplayDate}
          initialFocus
          locale={bn}
          fromYear={1950}
          toYear={new Date().getFullYear() + 5}
        />
        <div className="flex justify-end gap-2 p-2 border-t">
          <Button variant="ghost" onClick={handleClear}>মুছুন</Button>
          <Button variant="ghost" onClick={handleCancel}>বাতিল</Button>
          <Button onClick={handleSet}>সেট</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface BirthdayPickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function BirthdayPicker({
  date,
  onDateChange,
  placeholder = "Select your birthday",
  disabled = false,
  className,
}: BirthdayPickerProps) {
  // Convert Date to YYYY-MM-DD format for HTML date input
  const dateValue = date ? date.toISOString().split('T')[0] : ''

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value) {
      // Create date with explicit time to avoid timezone issues
      const newDate = new Date(value + 'T12:00:00')
      onDateChange?.(newDate)
    } else {
      onDateChange?.(undefined)
    }
  }

  return (
    <Input
      type="date"
      value={dateValue}
      onChange={handleDateChange}
      disabled={disabled}
      placeholder={placeholder}
      min="1920-01-01"
      max={new Date().toISOString().split('T')[0]}
      className={cn(
        !date && "text-muted-foreground",
        className
      )}
    />
  )
}
import { logLevelSchema, logSourceSchema, type LogLevel, type LogSource } from '@pc-monitor/shared';
import { CalendarDays, X } from 'lucide-react';
import { useId } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/core/components/ui/button';
import { Calendar } from '@/core/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/core/components/ui/toggle-group';
import { DEFAULT_FILTERS, type ArchivedFilter, type LogFilters } from '../filters';
import { LEVEL_LABELS, SOURCE_LABELS } from '../labels';

const ARCHIVED_OPTIONS: { value: ArchivedFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

const dayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

function rangeLabel({ from, to }: LogFilters) {
  if (!from) return 'Any date';
  if (!to || to.getTime() === from.getTime()) return dayFormat.format(from);
  return `${dayFormat.format(from)} – ${dayFormat.format(to)}`;
}

// Native selects: accessible and touch-friendly as they are, and the list is short.
const selectClass = 'h-11 rounded-md border border-input bg-background px-2 text-sm sm:h-9';

/** Level, source, archived and date filters for the log list. Any change goes back to page 1. */
export function LogFiltersBar({ filters, onChange }: { filters: LogFilters; onChange: (patch: Partial<LogFilters>) => void }) {
  const id = useId();
  const isDefault =
    !filters.level && !filters.source && !filters.from && filters.archived === DEFAULT_FILTERS.archived;

  return (
    <div role="group" aria-label="Log filters" className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1">
        <label htmlFor={`${id}-level`} className="text-xs text-muted-foreground">
          Level
        </label>
        <select
          id={`${id}-level`}
          className={selectClass}
          value={filters.level ?? ''}
          onChange={(e) => onChange({ level: (e.target.value || undefined) as LogLevel | undefined })}
        >
          <option value="">All levels</option>
          {logLevelSchema.options.map((level) => (
            <option key={level} value={level}>
              {LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <label htmlFor={`${id}-source`} className="text-xs text-muted-foreground">
          Source
        </label>
        <select
          id={`${id}-source`}
          className={selectClass}
          value={filters.source ?? ''}
          onChange={(e) => onChange({ source: (e.target.value || undefined) as LogSource | undefined })}
        >
          <option value="">All sources</option>
          {logSourceSchema.options.map((source) => (
            <option key={source} value={source}>
              {SOURCE_LABELS[source]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <span id={`${id}-dates`} className="text-xs text-muted-foreground">
          Dates
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-labelledby={`${id}-dates ${id}-dates-value`} className="justify-start font-normal">
              <CalendarDays aria-hidden="true" />
              <span id={`${id}-dates-value`}>{rangeLabel(filters)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto">
            <Calendar
              mode="range"
              selected={filters.from ? ({ from: filters.from, to: filters.to } satisfies DateRange) : undefined}
              onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
              disabled={{ after: new Date() }}
              {...(filters.from ? { defaultMonth: filters.from } : {})}
            />
            {filters.from && (
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => onChange({ from: undefined, to: undefined })}>
                Any date
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="Show"
        value={filters.archived}
        onValueChange={(value) => value && onChange({ archived: value as ArchivedFilter })}
      >
        {ARCHIVED_OPTIONS.map(({ value, label }) => (
          <ToggleGroupItem key={value} value={value} className="h-11 px-3 sm:h-9">
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {!isDefault && (
        <Button variant="ghost" onClick={() => onChange({ ...DEFAULT_FILTERS, level: undefined, source: undefined, from: undefined, to: undefined })}>
          <X aria-hidden="true" />
          Reset filters
        </Button>
      )}
    </div>
  );
}

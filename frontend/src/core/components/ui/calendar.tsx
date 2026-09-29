import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { buttonVariants } from "@/core/components/ui/button"
import { cn } from "@/core/lib/utils"

// shadcn/ui calendar, written by hand for react-day-picker v10 (same class keys as v9).
// DayPicker brings the grid semantics, keyboard navigation and day labels; this only styles it.
function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("p-1", className)}
      classNames={{
        months: "relative flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex h-9 items-center justify-center text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon" }), "z-10"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon" }), "z-10"),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 text-center text-xs font-normal text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative flex-1 p-0 text-center text-sm",
        day_button:
          "inline-flex size-10 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        range_start: "rounded-l-md bg-accent",
        range_middle: "bg-accent [&>button]:bg-transparent! [&>button]:text-foreground!",
        range_end: "rounded-r-md bg-accent",
        today: "[&>button]:font-semibold [&>button]:underline",
        outside: "text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft aria-hidden="true" className="size-4" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-4" />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }

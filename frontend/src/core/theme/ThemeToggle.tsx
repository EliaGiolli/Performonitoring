import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/core/components/ui/toggle-group';
import type { ThemePreference } from './theme';
import { useTheme } from './useTheme';

const OPTIONS: { value: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { value: 'dark', label: 'Dark theme', Icon: Moon },
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'system', label: 'System theme', Icon: Monitor },
];

/** Dark / light / system switch. Arrow keys move between options (Radix roving focus). */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={preference}
      // Radix emits "" when the active item is clicked again; keep the current choice.
      onValueChange={(value) => value && setPreference(value as ThemePreference)}
      aria-label="Color theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={label} title={label} className="size-11 px-0">
          <Icon aria-hidden="true" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

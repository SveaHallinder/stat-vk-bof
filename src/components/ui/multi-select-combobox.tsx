import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "./button";
import { X } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectComboboxProps {
  options: Option[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}

export const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [internalValue, setInternalValue] = React.useState<string[]>(value);

  React.useEffect(() => {
    if (!open) setInternalValue(value);
  }, [open, value]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(val: string) {
    if (internalValue.includes(val)) {
      setInternalValue(internalValue.filter(v => v !== val));
    } else {
      setInternalValue([...internalValue, val]);
    }
  }

  function isChecked(val: string) {
    return internalValue.includes(val);
  }

  function displayText() {
    if (value.length === 0) return placeholder || "Alla";
    if (value.length === 1) return options.find(o => o.value === value[0])?.label || "";
    if (value.length > 1) return `${value.length} valda`;
    return placeholder || "Alla";
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      onChange(internalValue);
    }
  }

  function handleDeselectAll() {
    setInternalValue([]);
    onChange([]); // uppdatera direkt för snabb UX
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {displayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-[260px]">
        <button
          type="button"
          className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 mb-2 ml-1 text-gray-700 transition-colors"
          onClick={handleDeselectAll}
        >
          <X size={14} className="text-gray-400 mr-1" />
          Avmarkera alla
        </button>
        <input
          type="text"
          className="border rounded px-2 py-1 w-full mb-2 text-sm"
          placeholder="Sök..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="max-h-48 overflow-auto flex flex-col gap-1">
          {filtered.length === 0 && <div className="text-gray-400 px-2 py-1 text-sm">Inga alternativ</div>}
          {filtered.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent rounded">
              <input
                type="checkbox"
                checked={isChecked(opt.value)}
                onChange={() => toggle(opt.value)}
                className="accent-green-600"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}; 
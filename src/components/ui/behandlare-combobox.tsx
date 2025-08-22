import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/apiClient";

interface Handler {
  id: number;
  name: string;
  email: string;
}

interface BehandlareComboboxProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const BehandlareCombobox: React.FC<BehandlareComboboxProps> = ({ value, onChange, label }) => {
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api(`/handlers`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHandlers(data.filter((h: any) => h.active !== false));
      } catch {
        setHandlers([]);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const match = handlers.find(h => h.id.toString() === value);
    if (match) setDisplayValue(match.name);
    else setDisplayValue("");
  }, [handlers, value]);

  const filtered = handlers.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.email.toLowerCase().includes(search.toLowerCase())
  );

  // Hantera klick utanför
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        className="border rounded px-3 py-2 w-full"
        value={displayValue || search}
        onFocus={() => setOpen(true)}
        onChange={e => {
          setSearch(e.target.value);
          setOpen(true);
          onChange("");
        }}
        placeholder="Välj behandlare"
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-400">Inga behandlare</div>
          )}
          {filtered.map(h => (
            <div
              key={h.id}
              className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${h.id.toString() === value ? "bg-green-50" : ""}`}
              onMouseDown={() => {
                onChange(h.id.toString());
                setSearch("");
                setOpen(false);
              }}
            >
              <div className="font-medium">{h.name}</div>
              <div className="text-xs text-gray-500">{h.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 
'use client';
import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, subDays as subDaysFn } from 'date-fns';
import { pt } from 'date-fns/locale';

export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset: DateRangePreset;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7days', label: 'Últimos 7 dias' },
  { value: 'last30days', label: 'Últimos 30 dias' },
  { value: 'custom', label: 'Data personalizada' },
];

function getPresetDates(preset: DateRangePreset): { startDate: Date; endDate: Date } {
  const today = new Date();
  switch (preset) {
    case 'today':
      return { startDate: startOfDay(today), endDate: endOfDay(today) };
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
    case 'last7days':
      return { startDate: startOfDay(subDays(today, 6)), endDate: endOfDay(today) };
    case 'last30days':
      return { startDate: startOfDay(subDays(today, 29)), endDate: endOfDay(today) };
    default:
      return { startDate: startOfDay(subDays(today, 29)), endDate: endOfDay(today) };
  }
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetChange = (preset: DateRangePreset) => {
    const dates = getPresetDates(preset);
    const presetLabel = presets.find(p => p.value === preset)?.label || '';
    onChange({ ...dates, preset, label: presetLabel });
    setIsOpen(false);
  };

  const handleCustomDateApply = () => {
    if (customStart && customEnd) {
      const startDate = startOfDay(new Date(customStart));
      const endDate = endOfDay(new Date(customEnd));
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      onChange({
        startDate,
        endDate,
        preset: 'custom',
        label: `${format(startDate, 'dd MMM', { locale: pt })} - ${format(endDate, 'dd MMM', { locale: pt })}`
      });
      setIsOpen(false);
    }
  };

  const displayLabel = value.preset === 'custom' ? value.label : presets.find(p => p.value === value.preset)?.label || 'Últimos 30 dias';

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
      >
        <Calendar className="w-4 h-4" />
        {displayLabel}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-[var(--color-border)] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  value.preset === preset.value
                    ? 'bg-[var(--color-shopify-green)] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {value.preset === 'custom' && (
            <div className="p-4 border-t border-[var(--color-border)] bg-gray-50">
              <p className="text-xs font-bold text-gray-500 mb-3">Selecionar datas</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">De</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-shopify-green)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Até</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-shopify-green)]"
                  />
                </div>
                <button
                  onClick={handleCustomDateApply}
                  disabled={!customStart || !customEnd}
                  className="w-full py-2 bg-[var(--color-shopify-green)] text-white text-sm font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}

          {value.preset !== 'custom' && (
            <div className="p-4 border-t border-[var(--color-border)] bg-gray-50">
              <p className="text-xs font-bold text-gray-500 mb-3">Data personalizada</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">De</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-shopify-green)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Até</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-shopify-green)]"
                  />
                </div>
                <button
                  onClick={handleCustomDateApply}
                  disabled={!customStart || !customEnd}
                  className="w-full py-2 bg-[var(--color-shopify-green)] text-white text-sm font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
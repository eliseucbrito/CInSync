'use client';

import { CalendarGrid } from '@/components/CalendarGrid';
import { ExportButton } from '@/components/ExportButton';
import { OptionsPanel } from '@/components/OptionsPanel';
import { useCalendarState } from '@/hooks/use-calendar-state';
import { fetchAndParseAllCSV } from '@/lib/csv-parser';
import { Subject } from '@/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoadingCSV, setIsLoadingCSV] = useState(true);
  
  const { selectedSubjects, isLoaded: isStateLoaded, addSubject, removeSubject, checkConflicts } = useCalendarState();

  const [hoveredSubject, setHoveredSubject] = useState<Subject | null>(null);
  
  // Options Panel State
  const [panelSlot, setPanelSlot] = useState<{ dayId: string; start: string; end: string } | null>(null);

  useEffect(() => {
    async function init() {
      const data = await fetchAndParseAllCSV();
      setAllSubjects(data);
      setIsLoadingCSV(false);
    }
    init();
  }, []);

  const handleCellClick = (dayId: string, slotStart?: string, slotEnd?: string) => {
    setPanelSlot({ dayId, start: slotStart || '', end: slotEnd || '' });
  };

  if (!isStateLoaded || isLoadingCSV) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Carregando disciplinas...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden">
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CinSync
            </h1>
            <p className="text-sm text-slate-500 font-medium">Gerador de Grade Curricular</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton />
          </div>
        </header>

        <main className="p-8 flex-1 w-full max-w-[1400px] mx-auto">
          <CalendarGrid
            selectedSubjects={selectedSubjects}
            onRemoveSubject={removeSubject}
            onCellClick={handleCellClick}
            hoveredSubject={hoveredSubject}
          />
        </main>
      </div>

      {/* Side Panel Drawer */}
      <OptionsPanel
        isOpen={true}
        onClose={() => setPanelSlot(null)}
        dayId={panelSlot?.dayId}
        slotStart={panelSlot?.start}
        slotEnd={panelSlot?.end}
        allSubjects={allSubjects}
        selectedSubjects={selectedSubjects}
        onHoverSubject={setHoveredSubject}
        onSelectSubject={addSubject}
        checkConflicts={checkConflicts}
      />
    </div>
  );
}

import { cn } from '@/lib/utils';
import { Subject } from '@/types';
import { SubjectCard } from './SubjectCard';

interface TimeSlot {
  label: string;
  start: string;
  end: string;
  shift: 'Matutino' | 'Vespertino' | 'Noturno';
}

const CONSTANT_TIME_SLOTS: TimeSlot[] = [
  { label: '08:00 - 09:50', start: '08:00', end: '09:50', shift: 'Matutino' },
  { label: '10:00 - 11:50', start: '10:00', end: '11:50', shift: 'Matutino' },
  { label: '13:00 - 14:50', start: '13:00', end: '14:50', shift: 'Vespertino' },
  { label: '15:00 - 16:50', start: '15:00', end: '16:50', shift: 'Vespertino' },
  { label: '17:00 - 18:50', start: '17:00', end: '18:50', shift: 'Noturno' },
  { label: '18:50 - 20:30', start: '18:50', end: '20:30', shift: 'Noturno' },
];

const DAYS = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
];

interface CalendarGridProps {
  selectedSubjects: Subject[];
  onRemoveSubject: (id: string) => void;
  onCellClick: (dayId: string, slotStart?: string, slotEnd?: string) => void;
  hoveredSubject?: Subject | null;
  conflictingSubjectsIds?: string[]; // IDs of subjects in the grid that conflict with hovered
}

export function CalendarGrid({
  selectedSubjects,
  onRemoveSubject,
  onCellClick,
  hoveredSubject,
  conflictingSubjectsIds = [],
}: CalendarGridProps) {
  
  // Helper to find all subjects occupying a specific cell
  const getSubjectsForCell = (dayId: string, slotStart: string, slotEnd: string) => {
    return selectedSubjects.filter((subject) =>
      subject.blocks.some(
        (b) => b.day === dayId && b.startTime === slotStart && b.endTime === slotEnd
      )
    );
  };

  // Helper to check if hovered subject would occupy this cell
  const isHoveredInCell = (dayId: string, slotStart: string, slotEnd: string) => {
    if (!hoveredSubject) return false;
    return hoveredSubject.blocks.some(
      (b) => b.day === dayId && b.startTime === slotStart && b.endTime === slotEnd
    );
  };

  return (
    <div className="w-full flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white" id="calendar-export-node">
      {/* Grid Header */}
      <div className="grid grid-cols-[100px_repeat(5,minmax(140px,1fr))] border-b border-slate-200 bg-slate-50">
        <div className="p-3 border-r border-slate-200 flex items-center justify-center">
          <span className="font-semibold text-slate-500 text-sm">Horário</span>
        </div>
        {DAYS.map((day) => (
          <div 
            key={day.id} 
            className="p-3 border-r last:border-r-0 border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
            onClick={() => onCellClick(day.id)}
            title={`Ver todas as disciplinas de ${day.label}`}
          >
            <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{day.label}</span>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="flex flex-col">
        {CONSTANT_TIME_SLOTS.map((slot, index) => {
          // Add extra border to separate shifts
          const isNewShift = index > 0 && CONSTANT_TIME_SLOTS[index - 1].shift !== slot.shift;
          
          return (
            <div
              key={slot.label}
              className={cn(
                "grid grid-cols-[100px_repeat(5,minmax(140px,1fr))] border-b last:border-b-0 border-slate-100",
                isNewShift && "border-t-4 border-t-slate-200"
              )}
            >
              {/* Time Column header */}
              <div className="p-2 border-r border-slate-200 bg-slate-50 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-semibold text-slate-600">{slot.shift}</span>
                <span className="text-[11px] text-slate-500 mt-1 font-medium">{slot.start}<br/>-<br/>{slot.end}</span>
              </div>

              {/* Day Cells */}
              {DAYS.map((day) => {
                const cellSubjects = getSubjectsForCell(day.id, slot.start, slot.end);
                const isHoveredHere = isHoveredInCell(day.id, slot.start, slot.end);
                const hasConflict = isHoveredHere && cellSubjects.length > 0;

                return (
                  <div
                    key={`${day.id}-${slot.start}`}
                    onClick={() => onCellClick(day.id, slot.start, slot.end)}
                    className={cn(
                      "relative p-1.5 border-r last:border-r-0 border-slate-100 min-h-[100px] transition-colors cursor-pointer group",
                      !cellSubjects.length && "hover:bg-blue-50/50" // Hover over empty cells
                    )}
                  >
                    <div className="w-full h-full flex flex-col gap-1">
                      {/* Render pinned subjects (splits space if multiples due to conflicts ignored by user) */}
                      {cellSubjects.map((sub) => {
                        const blockInfo = sub.blocks.find(
                          (b) => b.day === day.id && b.startTime === slot.start
                        );
                        return (
                          <div key={sub.id} className="flex-1 min-h-[80px]">
                            <SubjectCard
                              subject={sub}
                              room={blockInfo?.room}
                              onRemove={() => onRemoveSubject(sub.id)}
                            />
                          </div>
                        );
                      })}
                      
                      {/* Render Ghost / Hover shadow */}
                      {isHoveredHere && (
                        <div
                          className={cn(
                            "absolute inset-1 rounded-md border-2 border-dashed pointer-events-none z-10 opacity-80 flex flex-col p-2",
                            hasConflict
                              ? "bg-red-100/80 border-red-500 text-red-900 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                              : "bg-blue-100/80 border-blue-400 text-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                          )}
                        >
                          <span className="font-bold text-xs">{hoveredSubject?.name}</span>
                          <span className="text-[10px] font-medium mt-1 uppercase tracking-wider opacity-80">
                            {hasConflict ? '⚠️ Conflito!' : 'Pré-visualização'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

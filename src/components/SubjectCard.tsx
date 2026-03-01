import { cn } from '@/lib/utils';
import { Subject } from '@/types';
import { X } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  room?: string | null;
  showSchedule?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function SubjectCard({ subject, room, showSchedule, onRemove, className }: SubjectCardProps) {
  // Determine course color palette and icon based on PRD origin rules
  const isNight = subject.courseOrigin === 'SI';
  const isElective = subject.courseOrigin === 'Eletiva' || !subject.isMandatory;

  // Let's create a beautiful gradient or solid color based on course type
  const bgClass = isElective 
    ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 text-amber-900 shadow-amber-900/10'
    : subject.courseOrigin === 'CC'
      ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 text-blue-900 shadow-blue-900/10'
      : subject.courseOrigin === 'EC'
        ? 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300 text-purple-900 shadow-purple-900/10'
        : subject.courseOrigin === 'IA'
          ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-900 shadow-emerald-900/10'
          : subject.courseOrigin === 'SI'
            ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300 text-indigo-900 shadow-indigo-900/10'
            : 'bg-gray-100 text-gray-900 border-gray-300'; // Fallback

  // Calculate unique time blocks to show (e.g. "SEG 08:00 - 09:50")
  const timeBlocksArray = subject.blocks.map(b => `${b.day.toUpperCase()} ${b.startTime} - ${b.endTime}`);
  const uniqueTimes = Array.from(new Set(timeBlocksArray));

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between p-2 rounded-md border h-full w-full shadow-sm transition-all text-xs overflow-hidden',
        bgClass,
        className
      )}
    >
      <div className="flex justify-between items-start gap-1">
        <span className="font-semibold leading-tight line-clamp-2" title={`${subject.code} - ${subject.name}`}>
          <span className="opacity-70 font-mono text-[10px] mr-1 tracking-tighter">{subject.code}</span>
          {subject.name}
        </span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 hover:bg-black/10 rounded-full transition-colors shrink-0 cursor-pointer z-20"
            title="Remover"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-col mt-2 space-y-0.5 empty:hidden opacity-90">
        {subject.professor && subject.professor !== 'A Definir' && (
          <span className="truncate" title={subject.professor}>🧑‍🏫 {subject.professor}</span>
        )}
        {room && (
          <span className="truncate" title={room}>🚪 {room}</span>
        )}
      </div>

      <div className="flex flex-col mt-2 pt-1 border-t border-black/10 gap-1">
        <div className="flex items-center justify-between">
          <span className="font-medium tracking-wide opacity-80 uppercase text-[10px]">
            {isElective ? 'ELETIVA' : subject.courseOrigin} 
            {subject.period ? ` • ${subject.period}º Período` : ''}
          </span>
        </div>
        
        {showSchedule && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            {uniqueTimes.map(timeStr => (
              <span key={timeStr} className="text-[10px] font-semibold opacity-75">
                🕒 {timeStr}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

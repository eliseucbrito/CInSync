import { CourseOrigin, Subject } from '@/types';
import { Filter, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SubjectCard } from './SubjectCard';

interface OptionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dayId?: string;
  slotStart?: string;
  slotEnd?: string;
  allSubjects: Subject[];
  selectedSubjects: Subject[];
  onHoverSubject: (subject: Subject | null) => void;
  onSelectSubject: (subject: Subject) => void;
  checkConflicts: (subject: Subject) => Subject[];
}

export function OptionsPanel({
  isOpen,
  onClose,
  dayId,
  slotStart,
  slotEnd,
  allSubjects,
  selectedSubjects,
  onHoverSubject,
  onSelectSubject,
  checkConflicts,
}: OptionsPanelProps) {
  const [filterSituation, setFilterSituation] = useState<'ALL' | 'NO_CONFLICT' | 'ELETIVAS' | 'OBRIGATORIAS'>('ALL');
  const [filterCourse, setFilterCourse] = useState<CourseOrigin | 'ALL'>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter by Slot or Day (Default to all subjects if no day/slot is clicked)
  const slotSubjects = useMemo(() => {
    if (!dayId) return allSubjects;
    
    // If only Day is provided (no specific start/end slot), filter by any block on that day
    if (!slotStart || !slotEnd) {
      return allSubjects.filter(sub => 
        sub.blocks.some(b => b.day === dayId)
      );
    }

    // Filter by specific Day + Slot
    return allSubjects.filter(sub => 
      sub.blocks.some(b => b.day === dayId && b.startTime === slotStart && b.endTime === slotEnd)
    );
  }, [allSubjects, dayId, slotStart, slotEnd]);

  // 2. Apply user filters & remove already selected
  const filteredOptions = useMemo(() => {
    return slotSubjects.filter(sub => {
      // Exclude already selected subjects
      if (selectedSubjects.some(s => s.id === sub.id)) return false;

      // Filter by Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        if (!sub.name.toLowerCase().includes(query) && !sub.code.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Filter Course
      if (filterCourse !== 'ALL' && sub.courseOrigin !== filterCourse) return false;
      
      // Filter Period
      if (filterPeriod && sub.period?.toString() !== filterPeriod) return false;

      // Filter Situation
      if (filterSituation === 'ELETIVAS' && sub.isMandatory) return false;
      if (filterSituation === 'OBRIGATORIAS' && !sub.isMandatory) return false;
      if (filterSituation === 'NO_CONFLICT') {
        const conflicts = checkConflicts(sub);
        if (conflicts.length > 0) return false;
      }
      
      return true;
    });
  }, [slotSubjects, filterCourse, filterPeriod, filterSituation, checkConflicts, selectedSubjects, searchQuery]);


  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shadow-lg z-20 overflow-hidden shrink-0">
      <div className="p-4 border-b border-slate-200 flex flex-col gap-2 bg-slate-50">
        <h2 className="font-bold text-slate-800">Catálogo de Disciplinas</h2>
        
        {dayId ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-medium shadow-sm animate-in fade-in zoom-in-95">
              Filtro Ativo: {slotStart && slotEnd ? `${dayId.toUpperCase()} • ${slotStart} às ${slotEnd}` : dayId.toUpperCase()}
              <button 
                onClick={onClose} 
                className="hover:bg-blue-200/80 rounded-full p-0.5 transition-colors cursor-pointer"
                title="Remover filtro de horário"
              >
                <X size={12} />
              </button>
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Mostrando todas as opções</p>
        )}
      </div>

      <div className="p-4 border-b border-slate-200 space-y-4 bg-slate-50/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter size={16} /> Filtros e Busca
        </div>
        
        <div className="space-y-3 text-sm">
          {/* Search Filter */}
          <div className="flex flex-col gap-1">
            <input 
              type="text" 
              placeholder="Buscar por nome ou código..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400 text-slate-800 bg-white shadow-sm transition-all"
            />
          </div>

          {/* Situation Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Situação</label>
            <select 
              value={filterSituation} 
              onChange={e => setFilterSituation(e.target.value as any)}
              className="w-full p-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="ALL">Todas as Disciplinas</option>
              <option value="NO_CONFLICT">Sem Conflito (Recomendadas)</option>
              <option value="ELETIVAS">Apenas Eletivas</option>
              <option value="OBRIGATORIAS">Apenas Obrigatórias</option>
            </select>
          </div>

          <div className="flex gap-2">
            {/* Course Filter */}
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-slate-500">Curso</label>
              <select 
                value={filterCourse} 
                onChange={e => setFilterCourse(e.target.value as any)}
                className="w-full p-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
              >
                <option value="ALL">Todos os Cursos</option>
                <option value="CC">CC</option>
                <option value="EC">EC</option>
                <option value="SI">SI</option>
                <option value="IA">IA</option>
                <option value="Eletiva">Eletivas</option>
              </select>
            </div>

            {/* Period Filter */}
            <div className="flex flex-col gap-1 w-20">
              <label className="text-xs font-medium text-slate-500">Período</label>
              <input 
                type="number" 
                placeholder="Ex. 3"
                value={filterPeriod}
                onChange={e => setFilterPeriod(e.target.value)}
                className="w-full p-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400 bg-white font-medium text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50 relative">
        {filteredOptions.length === 0 ? (
          <div className="text-center text-slate-500 text-sm mt-10">
            Nenhuma disciplina encontrada para este horário com os filtros atuais.
          </div>
        ) : (
          filteredOptions.map((sub) => {
            const hasConflict = checkConflicts(sub).length > 0;
            return (
              <div
                key={sub.id}
                onMouseEnter={() => onHoverSubject(sub)}
                onMouseLeave={() => onHoverSubject(null)}
                onClick={() => {
                  onSelectSubject(sub);
                  onHoverSubject(null);
                  onClose();
                }}
                className={`cursor-pointer transition-all duration-200 hover:-translate-y-1 animate-in fade-in zoom-in-95 ${hasConflict ? 'opacity-60 grayscale-[0.3]' : ''}`}
                style={{ animationDelay: `${Math.min(filteredOptions.indexOf(sub) * 30, 300)}ms`, animationFillMode: 'both' }}
              >
                <SubjectCard subject={sub} showSchedule={true} />
                {hasConflict && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 text-center bg-red-50 rounded-b p-1">⚠️ Causa Conflito</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

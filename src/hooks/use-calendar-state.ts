import { ParsedClassBlock, Subject } from '@/types';
import { useCallback, useEffect, useState } from 'react';

// Utility to check if two time blocks overlap
function doBlocksOverlap(a: ParsedClassBlock, b: ParsedClassBlock): boolean {
  if (a.day !== b.day) return false;
  
  // Convert HH:MM to minutes for easier comparison
  const aStart = parseTime(a.startTime);
  const aEnd = parseTime(a.endTime);
  const bStart = parseTime(b.startTime);
  const bEnd = parseTime(b.endTime);

  // Overlap condition: A starts before B ends, and B starts before A ends
  return aStart < bEnd && bStart < aEnd;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function useCalendarState() {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cinsync-schedule');
      if (saved) {
        setSelectedSubjects(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load schedule from local storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage whenever selections change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cinsync-schedule', JSON.stringify(selectedSubjects));
    }
  }, [selectedSubjects, isLoaded]);

  const addSubject = useCallback((subject: Subject) => {
    setSelectedSubjects((prev) => {
      // Prevent duplicates
      if (prev.some((s) => s.id === subject.id)) return prev;
      return [...prev, subject];
    });
  }, []);

  const removeSubject = useCallback((id: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const checkConflicts = useCallback(
    (subject: Subject): Subject[] => {
      const conflictingSubjects: Subject[] = [];
      
      for (const block of subject.blocks) {
        for (const selected of selectedSubjects) {
          if (selected.id === subject.id) continue;
          
          for (const selectedBlock of selected.blocks) {
            if (doBlocksOverlap(block, selectedBlock)) {
              if (!conflictingSubjects.find(s => s.id === selected.id)) {
                 conflictingSubjects.push(selected);
              }
            }
          }
        }
      }
      
      return conflictingSubjects;
    },
    [selectedSubjects]
  );

  return {
    selectedSubjects,
    isLoaded,
    addSubject,
    removeSubject,
    checkConflicts,
  };
}

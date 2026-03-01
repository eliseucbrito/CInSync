import { CourseOrigin, ParsedClassBlock, Subject } from '@/types';
import Papa from 'papaparse';

export function parseScheduleString(rawString: string): ParsedClassBlock[] {
  if (!rawString) return [];

  const regex = /(seg|ter|qua|qui|sex)\.?\s*(\d{2}:\d{2})-(\d{2}:\d{2})\s*(?:\(([^)]+)\))?/gi;
  const results: ParsedClassBlock[] = [];
  let match;

  while ((match = regex.exec(rawString)) !== null) {
    const day = match[1].toLowerCase();
    const startTime = match[2];
    const endTime = match[3];
    const room = match[4] ? match[4].trim() : null;

    // Horário fantasma ignored
    if (startTime === '12:00' && endTime === '12:50') {
      continue;
    }

    results.push({ day, startTime, endTime, room });
  }

  return results;
}

function processCsvArrays(rows: string[][], filename: string): Subject[] {
  let courseOrigin: CourseOrigin = 'CC';
  const nameLower = filename.toLowerCase();
  
  if (nameLower.includes('eletivas')) courseOrigin = 'Eletiva';
  else if (nameLower.includes('- cc')) courseOrigin = 'CC';
  else if (nameLower.includes('- ec')) courseOrigin = 'EC';
  else if (nameLower.includes('- ia')) courseOrigin = 'IA';
  else if (nameLower.includes('- si')) courseOrigin = 'SI';

  const isEletivasFile = courseOrigin === 'Eletiva';
  
  let currentPeriod: number | null = null;
  let idxOrgao = -1, idxTurma = -1, idxDisciplina = -1, idxDocente = -1, idxHorario = -1, idxPeriodoCol = -1;

  const subjects: Subject[] = [];

  for (const row of rows) {
    if (!row || row.length === 0 || !row[0]) continue;
    
    // Header for period
    if (row[0].startsWith('Período:')) {
       currentPeriod = parseInt(row[0].replace('Período:', '').trim(), 10);
       continue;
    }

    // Header for table columns
    if (row.some(cell => cell && typeof cell === 'string' && cell.includes('Disciplina'))) {
       idxOrgao = row.findIndex(c => c && c.includes('Órgão'));
       idxTurma = row.findIndex(c => c && c.includes('Turma'));
       idxDisciplina = row.findIndex(c => c && c.includes('Disciplina'));
       idxDocente = row.findIndex(c => c && c.includes('Docente'));
       idxHorario = row.findIndex(c => c && c.includes('Horário'));
       idxPeriodoCol = row.findIndex(c => c && c.includes('Período'));
       continue;
    }

    if (idxDisciplina === -1 || idxHorario === -1) continue;

    const rawDisciplina = row[idxDisciplina];
    if (!rawDisciplina) continue;

    let code = '';
    let name = rawDisciplina;
    if (rawDisciplina.includes('-')) {
        const parts = rawDisciplina.split('-');
        code = parts[0].trim();
        name = parts.slice(1).join('-').trim();
    }

    const turma = idxTurma !== -1 && row[idxTurma] ? row[idxTurma].trim() : 'U';
    
    let period = currentPeriod;
    if (isEletivasFile && idxPeriodoCol !== -1 && row[idxPeriodoCol]) {
       const p = parseInt(row[idxPeriodoCol], 10);
       if (!isNaN(p)) period = p;
    }

    const isMandatory = !isEletivasFile && period !== null;
    const professor = idxDocente !== -1 && row[idxDocente] ? row[idxDocente].trim() : 'A Definir';
    const rawSchedule = row[idxHorario] || '';
    
    const blocks = parseScheduleString(rawSchedule);
    if (blocks.length === 0) continue;

    subjects.push({
        id: `${code}-${turma}-${name.substring(0, 10)}`.replace(/\s+/g, ''),
        code,
        name,
        classCode: turma,
        professor,
        isMandatory,
        period,
        courseOrigin,
        blocks,
    });
  }
  return subjects;
}

export async function fetchAndParseAllCSV(): Promise<Subject[]> {
  const files = [
    'Publicação Oferta Graduação 26.1 - CC 26.1.csv',
    'Publicação Oferta Graduação 26.1 - EC 26.1.csv',
    'Publicação Oferta Graduação 26.1 - IA 26.1.csv',
    'Publicação Oferta Graduação 26.1 - SI 26.1.csv',
    'Publicação Oferta Graduação 26.1 - Eletivas 26.1.csv',
  ];

  const allSubjects: Subject[] = [];

  for (const filename of files) {
    try {
      const response = await fetch(`/data/${filename}`);
      if (!response.ok) {
        console.error(`Failed to fetch ${filename}`);
        continue;
      }
      const csvText = await response.text();
      
      const parsed = Papa.parse<string[]>(csvText, {
        header: false,
        skipEmptyLines: true,
      });

      const subjects = processCsvArrays(parsed.data, filename);
      allSubjects.push(...subjects);
    } catch (e) {
      console.error(`Error processing ${filename}`, e);
    }
  }

  // Deduplicate based on ID, taking the first occurrence
  const uniqueSubjects = Array.from(new Map(allSubjects.map(s => [s.id, s])).values());
  return uniqueSubjects;
}

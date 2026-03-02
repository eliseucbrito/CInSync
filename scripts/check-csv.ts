import * as fs from 'fs';
import Papa from 'papaparse';
import * as path from 'path';

// Actually, let's copy the logic to avoid ts-node configuration issues.
type ParsedClassBlock = any;
type Subject = any;
type CourseOrigin = any;

function parseScheduleString(rawString: string): ParsedClassBlock[] {
  if (!rawString) return [];
  const regex = /(seg|ter|qua|qui|sex|sáb|sab)\.?\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s*(?:\(([^)]+)\))?/gi;
  const results: ParsedClassBlock[] = [];
  let match;
  while ((match = regex.exec(rawString)) !== null) {
    const day = match[1].toLowerCase();
    const startTime = match[2];
    const endTime = match[3];
    const room = match[4] ? match[4].trim() : null;
    if (startTime === '12:00' && endTime === '12:50') continue;
    results.push({ day, startTime, endTime, room });
  }
  return results;
}

function processCsvArraysLogic(rows: string[][], filename: string): any[] {
  let courseOrigin = 'CC';
  const nameLower = filename.toLowerCase();
  if (nameLower.includes('eletivas')) courseOrigin = 'Eletiva';
  else if (nameLower.includes('- cc')) courseOrigin = 'CC';
  else if (nameLower.includes('- ec')) courseOrigin = 'EC';
  else if (nameLower.includes('- ia')) courseOrigin = 'IA';
  else if (nameLower.includes('- si')) courseOrigin = 'SI';

  const isEletivasFile = courseOrigin === 'Eletiva';
  let currentPeriod: number | null = null;
  let idxOrgao = -1, idxTurma = -1, idxDisciplina = -1, idxDocente = -1, idxHorario = -1, idxPeriodoCol = -1;
  const subjects: any[] = [];

  for (const row of rows) {
    if (!row || row.length === 0 || !row[0]) continue;
    if (row[0].startsWith('Período:')) {
       currentPeriod = parseInt(row[0].replace('Período:', '').trim(), 10);
       continue;
    }
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
    
    // DEBUG: check rows that have empty schedule or fail to parse
    const blocks = parseScheduleString(rawSchedule);
    if (blocks.length === 0) {
        console.log(`[SKIPPED] File: ${filename} | Name: ${name} | Raw Schedule: "${rawSchedule}"`);
        continue;
    }

    subjects.push({
        id: `${courseOrigin}-${code}-${turma}-${name.substring(0, 10)}`.replace(/\s+/g, ''),
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

const dir = path.join(__dirname, '../public/data');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

const allSubjects: any[] = [];
let totalRowsWithContent = 0;

for (const filename of files) {
  const content = fs.readFileSync(path.join(dir, filename), 'utf8');
  const parsed = Papa.parse<string[]>(content, { header: false, skipEmptyLines: true });
  
  let validDataRows = 0;
  for (const row of parsed.data) {
     if (row && row.length > 0 && row[0] && !row[0].startsWith('Período:') && !row.some(c => c && c.includes('Disciplina'))) {
         // rough heuristic for a data row
         if (row.some(c => c && c.trim().length > 0)) {
             validDataRows++;
         }
     }
  }

  const subjects = processCsvArraysLogic(parsed.data, filename);
  console.log(`${filename}:`);
  console.log(`  - Total CSV Lines (non-empty): ${parsed.data.length}`);
  console.log(`  - Estimated Data Rows: ${validDataRows}`);
  console.log(`  - Parsed Subjects: ${subjects.length}`);
  allSubjects.push(...subjects);
  totalRowsWithContent += validDataRows;
}

const uniqueSubjectsMap = new Map<string, any>();
const collisions: Array<{ original: any, new: any }> = [];

for (const s of allSubjects) {
  if (uniqueSubjectsMap.has(s.id)) {
    const original = uniqueSubjectsMap.get(s.id);
    if (original.courseOrigin !== s.courseOrigin) {
      collisions.push({ original, new: s });
    }
  } else {
    uniqueSubjectsMap.set(s.id, s);
  }
}

console.log(`\n--- Cross-Course Collisions (${collisions.length}) ---`);
for (const c of collisions.slice(0, 10)) {
  console.log(`ID: ${c.original.id}`);
  console.log(`  Keeping: ${c.original.name} (${c.original.courseOrigin})`);
  console.log(`  Dropping: ${c.new.name} (${c.new.courseOrigin})`);
}
if (collisions.length > 10) console.log(`... and ${collisions.length - 10} more.`);

console.log(`\nTotal Subjects Appended: ${allSubjects.length}`);
console.log(`Unique Subjects: ${uniqueSubjectsMap.size}`);


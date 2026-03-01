export type CourseOrigin = 'CC' | 'EC' | 'IA' | 'SI' | 'Eletiva';

export type ParsedClassBlock = {
  day: string;       // 'seg', 'ter', 'qua', 'qui', 'sex'
  startTime: string; // '08:00', '10:00', '13:00', '15:00', '17:00', '19:00'
  endTime: string;   // '09:50', '11:50', '14:50', '16:50', '18:50', '20:30'
  room: string | null; // Ex: 'E112', 'Grad05'
};

export type CsvRow = {
  'Cod.': string;
  'Disciplina': string;
  'Turma': string;
  'Téórica': string;
  'Prática': string;
  'Horário (Sala/Lab)': string;
  'Professor': string;
  'Período': string;
};

export type Subject = {
  id: string; // e.g. "IF669-1" (code + class)
  code: string;
  name: string;
  classCode: string;
  professor: string;
  isMandatory: boolean;
  period: number | null;
  courseOrigin: CourseOrigin;
  blocks: ParsedClassBlock[]; // Original string parsed into individual blocks
};

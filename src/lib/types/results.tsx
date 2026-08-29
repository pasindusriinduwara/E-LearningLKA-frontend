export interface StudentResult {
  id: string;
  rank: number;
  studentName: string;
  studentId: string;
  term1: number;
  term2: number;
  assignment: number;
  total: number;
  grade: string;
}

export interface ResultStatsData {
  classAverage: string;
  highestScore: string;
  passRate: string;
  studentsRanked: number;
}
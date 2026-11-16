export type ClassroomName = '3م / أ' | '3م / ب' | '3م / ج';

export const CLASSROOM_OPTIONS: ClassroomName[] = ['3م / أ', '3م / ب', '3م / ج'];

export type RubricGrade = 'ممتاز' | 'جيد جداً' | 'مقبول' | 'يحتاج دعم';

export interface TeacherReaction {
  id: string;
  emoji: string;
  label: string;
  byTeacher: string;
  createdAt: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  classroom: ClassroomName;
  joinedAt: string;
  lastActiveAt: string;
  rulesAccepted: boolean;
  videoWatched: boolean;
  completedStations: string[];
  thinkPairShare?: {
    myIdea: string;
    partnerIdea: string;
    groupSummary: string;
    submittedAt: string;
  };
  compareImportStar?: {
    pros: string;
    cons: string;
    submittedAt: string;
  };
  tryYourselfMath?: {
    ceilAns: string;
    floorAns: string;
    isCorrect: boolean;
    submittedAt: string;
  };
  formativeAnswers: Record<
    string,
    {
      selectedIndex: number;
      isCorrect: boolean;
    }
  >;
  performanceTask?: {
    selectedTopic: string;
    code: string;
    notes: string;
    submittedAt: string;
    teacherGrade?: RubricGrade;
  };
  summativeQuiz?: {
    answers: Record<string, number>;
    score: number;
    total: number;
    submittedAt: string;
  };
  selfAssessment?: {
    ratings: Record<string, number>;
    reflection: string;
    submittedAt: string;
  };
  peerAssessment?: {
    peerName: string;
    star1: string;
    star2: string;
    wish: string;
    rating: number;
    submittedAt: string;
  };
  exitTicket?: {
    learned: string;
    favoriteLib: string;
    question: string;
    moodIcon: string;
    submittedAt: string;
  };
  teacherReactions: TeacherReaction[];
}

export interface ClassRatingEvent {
  id: string;
  classroom: ClassroomName | 'الكل';
  emoji: string;
  label: string;
  note?: string;
  teacherName: string;
  createdAt: string;
}

export interface RandomPickEvent {
  id: string;
  studentId: string;
  studentName: string;
  classroom: ClassroomName;
  teacherName: string;
  createdAt: string;
}

export interface LessonTimerState {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt?: number;
}

export interface ClassroomState {
  students: StudentRecord[];
  classRatings: ClassRatingEvent[];
  randomPicks: RandomPickEvent[];
  lessonTimer: LessonTimerState;
  activeTeacher?: {
    name: string;
    classroom: ClassroomName | 'الكل';
    activeAt: string;
  };
}

export interface SessionIdentity {
  role: 'student' | 'teacher';
  name: string;
  classroom: ClassroomName | 'الكل';
  studentId?: string;
}

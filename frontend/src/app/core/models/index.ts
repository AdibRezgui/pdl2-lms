export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TRAINER' | 'STUDENT';
  avatar?: string;
  bio?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  durationHours: number;
  studentsCount: number;
  rating: number;
  tags: string[];
  published: boolean;
  trainer: { id: string; name: string; avatar?: string };
}

export interface Enrollment {
  id: string;
  course: Course;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  lastAccessedAt: string | null;
  certificateUrl: string | null;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  questionsCount: number;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  attemptsCount: number;
  lastScore: number;
  passed: boolean;
  questions: Question[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  avgProgress: number;
  coursesCount: number;
  joinedAt: string;
  enrollments: {
    courseId: string;
    courseTitle: string;
    progress: number;
    completed: boolean;
    lastAccessedAt: string | null;
  }[];
}

export interface TrainerAnalytics {
  totalStudents: number;
  avgRating: number;
  totalCourses: number;
  publishedCourses: number;
  totalHours: number;
  totalQuizAttempts: number;
  courseStats: {
    id: string;
    title: string;
    studentsCount: number;
    rating: number;
    published: boolean;
    avgProgress: number;
    completedCount: number;
  }[];
}

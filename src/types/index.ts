export type UserRole = 'admin' | 'trainer' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  duration: number; // in hours
  lessonsCount: number;
  studentsCount: number;
  rating: number;
  ratingsCount: number;
  trainerId: string;
  trainerName: string;
  trainerAvatar?: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  price: number; // 0 for free
  language: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'quiz' | 'text';
  duration: number; // in minutes
  order: number;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  isCompleted?: boolean;
  isFree: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number; // 0-100
  lastAccessedAt: string;
  completedLessons: string[];
  isCompleted: boolean;
  completedAt?: string;
  certificateUrl?: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  timeLimit: number; // in minutes
  passingScore: number; // percentage
  questions: Question[];
  maxAttempts: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  answers: Record<string, string | string[]>;
  startedAt: string;
  completedAt: string;
  timeTaken: number; // in seconds
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  isVerified: boolean;
}

export interface Analytics {
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  totalHoursWatched: number;
  monthlyGrowth: {
    students: number;
    courses: number;
    revenue: number;
  };
  topCourses: { courseId: string; title: string; students: number }[];
  recentEnrollments: Enrollment[];
}

export interface AIRecommendation {
  courseId: string;
  title: string;
  reason: string;
  matchScore: number;
  thumbnail: string;
  category: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

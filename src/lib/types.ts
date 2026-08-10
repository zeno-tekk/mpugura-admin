export type Language = 'en' | 'fr' | 'rw';

export interface MultiLang {
  en: string;
  fr: string;
  rw: string;
}

export interface QuestionOption {
  text: MultiLang;
  isCorrect: boolean;
  imageUrl?: string;
}

export interface Question {
  id: string;
  question: MultiLang;
  options: QuestionOption[];
  explanation: MultiLang;
}

export interface Category {
  id: string;
  icon: string;
  color: string;
  bgColor: string;
  title: MultiLang;
  description: MultiLang;
  order: number;
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Lesson {
  id: string;
  categoryId: string;
  order: number;
  duration: number;
  icon: string;
  title: MultiLang;
  content: MultiLang;
  questions: Question[];
  premiumOnly: boolean;
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  isPremium: boolean;
  role: string;
  disabled?: boolean;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  updatedAt?: string | null;
}

export interface AttemptAnswer {
  questionId: string;
  question: MultiLang;
  options: QuestionOption[];
  selectedIndex: number | null;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  score: number;
  total: number;
  timeUsed: number;
  answers: AttemptAnswer[];
  createdAt?: string | null;
  platform?: 'web' | 'app' | null;
}

export interface ExamQuestion {
  id: string;
  question: MultiLang;
  options: QuestionOption[];
  explanation: MultiLang;
  categoryId?: string;
  imageUrl?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type PaymentStatus = 'completed' | 'failed' | 'pending';

export interface PaymentRecord {
  id: string;
  userId?: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  currency: string;
  plan: string;
  status: PaymentStatus;
  method: string;
  note?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  paidAt?: string | null;
}


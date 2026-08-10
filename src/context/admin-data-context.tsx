'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { Category, ExamAttempt, ExamQuestion, Lesson, PaymentRecord, PaymentStatus, Question, StudentProfile } from '@/lib/types';

type CategoryInput = Omit<Category, 'createdAt' | 'updatedAt'>;
type LessonInput = Omit<Lesson, 'createdAt' | 'updatedAt'>;
type ExamQuestionInput = Omit<ExamQuestion, 'createdAt' | 'updatedAt'>;
type PaymentInput = Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt' | 'paidAt'> & { id?: string; grantPremium?: boolean };
type StudentUpdateInput = Partial<Pick<StudentProfile, 'name' | 'email' | 'isPremium'>>;

interface AdminDataContextValue {
  categories: Category[];
  lessons: Lesson[];
  examQuestions: ExamQuestion[];
  students: StudentProfile[];
  payments: PaymentRecord[];
  isLoading: boolean;
  saveCategory: (category: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveLesson: (lesson: LessonInput) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  saveExamQuestion: (question: ExamQuestionInput) => Promise<void>;
  deleteExamQuestion: (id: string) => Promise<void>;
  importExamQuestions: (questions: ExamQuestionInput[]) => Promise<number>;
  savePayment: (payment: PaymentInput) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  setStudentPremium: (userId: string, isPremium: boolean) => Promise<void>;
  updateStudent: (userId: string, updates: StudentUpdateInput) => Promise<void>;
  deleteStudent: (userId: string) => Promise<void>;
  restoreStudent: (userId: string) => Promise<void>;
  fetchStudentAttempts: (userId: string) => Promise<ExamAttempt[]>;
  seedDefaultContent: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue>({
  categories: [],
  lessons: [],
  examQuestions: [],
  students: [],
  payments: [],
  isLoading: true,
  saveCategory: async () => {},
  deleteCategory: async () => {},
  saveLesson: async () => {},
  deleteLesson: async () => {},
  saveExamQuestion: async () => {},
  deleteExamQuestion: async () => {},
  importExamQuestions: async () => 0,
  savePayment: async () => {},
  deletePayment: async () => {},
  setStudentPremium: async () => {},
  updateStudent: async () => {},
  deleteStudent: async () => {},
  restoreStudent: async () => {},
  fetchStudentAttempts: async () => [],
  seedDefaultContent: async () => {},
});

function timestampToIso(value: unknown) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const timestamp = value as { toDate: () => Date };
    return timestamp.toDate().toISOString();
  }

  return null;
}

function sortCategories(categories: Category[]) {
  return [...categories].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
}

function sortLessons(lessons: Lesson[]) {
  return [...lessons].sort((left, right) => {
    if (left.categoryId !== right.categoryId) {
      return left.categoryId.localeCompare(right.categoryId);
    }
    return left.order - right.order || left.id.localeCompare(right.id);
  });
}

function sortStudents(students: StudentProfile[]) {
  return [...students].sort((left, right) => {
    const leftDate = left.lastLoginAt ?? left.createdAt ?? '';
    const rightDate = right.lastLoginAt ?? right.createdAt ?? '';
    return rightDate.localeCompare(leftDate) || left.name.localeCompare(right.name);
  });
}

function sortPayments(payments: PaymentRecord[]) {
  return [...payments].sort((left, right) => {
    const leftDate = left.createdAt ?? '';
    const rightDate = right.createdAt ?? '';
    return rightDate.localeCompare(leftDate);
  });
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthorized } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAuthorized) {
      setCategories([]);
      setLessons([]);
      setExamQuestions([]);
      setStudents([]);
      setPayments([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let readyCount = 0;

    const markReady = () => {
      readyCount += 1;
      if (isMounted && readyCount >= 5) {
        setIsLoading(false);
      }
    };

    const unsubscribeCategories = onSnapshot(
      collection(firebaseDb, 'categories'),
      (snapshot) => {
        if (!isMounted) return;

        setCategories(sortCategories(snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            icon: data.icon ?? 'book',
            color: data.color ?? '#1E3A8A',
            bgColor: data.bgColor ?? '#EFF6FF',
            title: data.title ?? { en: '', fr: '', rw: '' },
            description: data.description ?? { en: '', fr: '', rw: '' },
            order: data.order ?? 0,
            published: data.published ?? true,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
          } satisfies Category;
        })));
        markReady();
      },
      () => markReady()
    );

    const unsubscribeLessons = onSnapshot(
      collection(firebaseDb, 'lessons'),
      (snapshot) => {
        if (!isMounted) return;

        setLessons(sortLessons(snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            categoryId: data.categoryId ?? '',
            order: data.order ?? 0,
            duration: data.duration ?? 0,
            icon: data.icon ?? 'book',
            title: data.title ?? { en: '', fr: '', rw: '' },
            content: data.content ?? { en: '', fr: '', rw: '' },
            questions: Array.isArray(data.questions) ? data.questions as Question[] : [],
            premiumOnly: data.premiumOnly ?? false,
            published: data.published ?? true,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
          } satisfies Lesson;
        })));
        markReady();
      },
      () => markReady()
    );

    const unsubscribeExamQuestions = onSnapshot(
      collection(firebaseDb, 'examQuestions'),
      (snapshot) => {
        if (!isMounted) return;
        setExamQuestions(snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            question: data.question ?? { en: '', fr: '', rw: '' },
            options: Array.isArray(data.options) ? data.options : [],
            explanation: data.explanation ?? { en: '', fr: '', rw: '' },
            categoryId: data.categoryId ?? undefined,
            imageUrl: data.imageUrl ?? undefined,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
          } satisfies ExamQuestion;
        }));
        markReady();
      },
      () => markReady()
    );

    const unsubscribeStudents = onSnapshot(
      collection(firebaseDb, 'users'),
      (snapshot) => {
        if (!isMounted) return;

        setStudents(sortStudents(snapshot.docs
          .map((item) => {
            const data = item.data();
            return {
              id: item.id,
              name: data.name ?? 'Student',
              email: data.email ?? '',
              photoURL: data.photoURL ?? null,
              isPremium: data.isPremium ?? false,
              role: data.role ?? 'student',
              disabled: data.disabled ?? false,
              createdAt: timestampToIso(data.createdAt),
              lastLoginAt: timestampToIso(data.lastLoginAt),
              updatedAt: timestampToIso(data.updatedAt),
            } satisfies StudentProfile;
          })
          // Admins manage the platform, not learners — keep them out of the student roster.
          .filter((student) => student.role !== 'admin')));
        markReady();
      },
      () => markReady()
    );

    const unsubscribePayments = onSnapshot(
      collection(firebaseDb, 'payments'),
      (snapshot) => {
        if (!isMounted) return;

        setPayments(sortPayments(snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            userId: data.userId,
            studentName: data.studentName ?? 'Unknown',
            studentEmail: data.studentEmail ?? '',
            amount: Number(data.amount ?? 0),
            currency: data.currency ?? 'RWF',
            plan: data.plan ?? 'premium',
            status: (data.status ?? 'pending') as PaymentStatus,
            method: data.method ?? 'Manual',
            note: data.note ?? '',
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
            paidAt: timestampToIso(data.paidAt),
          } satisfies PaymentRecord;
        })));
        markReady();
      },
      () => markReady()
    );

    return () => {
      isMounted = false;
      unsubscribeCategories();
      unsubscribeLessons();
      unsubscribeExamQuestions();
      unsubscribeStudents();
      unsubscribePayments();
    };
  }, [user, isAuthorized]);

  const saveCategory = async (category: CategoryInput) => {
    const id = category.id.trim();
    const isExisting = categories.some((item) => item.id === id);

    await setDoc(
      doc(firebaseDb, 'categories', id),
      {
        icon: category.icon,
        color: category.color,
        bgColor: category.bgColor,
        title: category.title,
        description: category.description,
        order: Number(category.order),
        published: category.published,
        updatedAt: serverTimestamp(),
        ...(isExisting ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );
  };

  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(firebaseDb, 'categories', id));
  };

  const saveLesson = async (lesson: LessonInput) => {
    const id = lesson.id.trim();
    const isExisting = lessons.some((item) => item.id === id);

    await setDoc(
      doc(firebaseDb, 'lessons', id),
      {
        categoryId: lesson.categoryId,
        order: Number(lesson.order),
        duration: Number(lesson.duration),
        icon: lesson.icon,
        title: lesson.title,
        content: lesson.content,
        questions: lesson.questions,
        premiumOnly: lesson.premiumOnly,
        published: lesson.published,
        updatedAt: serverTimestamp(),
        ...(isExisting ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );
  };

  const deleteLesson = async (id: string) => {
    await deleteDoc(doc(firebaseDb, 'lessons', id));
  };

  const saveExamQuestion = async (question: ExamQuestionInput) => {
    const id = question.id.trim();
    const isExisting = examQuestions.some((q) => q.id === id);
    await setDoc(
      doc(firebaseDb, 'examQuestions', id),
      {
        question: question.question,
        options: question.options,
        explanation: question.explanation,
        ...(question.categoryId ? { categoryId: question.categoryId } : {}),
        ...(question.imageUrl ? { imageUrl: question.imageUrl } : {}),
        updatedAt: serverTimestamp(),
        ...(isExisting ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );
  };

  const deleteExamQuestion = async (id: string) => {
    await deleteDoc(doc(firebaseDb, 'examQuestions', id));
  };

  const importExamQuestions = async (questions: ExamQuestionInput[]): Promise<number> => {
    const batch = writeBatch(firebaseDb);
    questions.forEach((question) => {
      const id = question.id.trim();
      const isExisting = examQuestions.some((q) => q.id === id);
      batch.set(
        doc(firebaseDb, 'examQuestions', id),
        {
          question: question.question,
          options: question.options,
          explanation: question.explanation,
          ...(question.categoryId ? { categoryId: question.categoryId } : {}),
          ...(question.imageUrl ? { imageUrl: question.imageUrl } : {}),
          updatedAt: serverTimestamp(),
          ...(isExisting ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      );
    });
    await batch.commit();
    return questions.length;
  };

  const setStudentPremium = async (userId: string, isPremium: boolean) => {
    await setDoc(
      doc(firebaseDb, 'users', userId),
      {
        isPremium,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const updateStudent = async (userId: string, updates: StudentUpdateInput) => {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.email !== undefined) payload.email = updates.email.trim();
    if (updates.isPremium !== undefined) payload.isPremium = updates.isPremium;

    await setDoc(doc(firebaseDb, 'users', userId), payload, { merge: true });
  };

  // There is no Firebase Admin SDK configured in this project, so we can't delete the
  // underlying Auth account from the client. Instead we flag the profile as disabled:
  // it disappears from the roster here, and the app/web sign the user out on their
  // next auth check (see AuthContext's disabled check) until an admin restores them.
  const deleteStudent = async (userId: string) => {
    await setDoc(
      doc(firebaseDb, 'users', userId),
      { disabled: true, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const restoreStudent = async (userId: string) => {
    await setDoc(
      doc(firebaseDb, 'users', userId),
      { disabled: false, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const fetchStudentAttempts = async (userId: string): Promise<ExamAttempt[]> => {
    // Sorted client-side (rather than an `orderBy` in the query) to avoid requiring
    // a composite Firestore index — matches the mobile/web app's own attempts query.
    const snapshot = await getDocs(
      query(collection(firebaseDb, 'examAttempts'), where('userId', '==', userId))
    );

    const attempts = snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        userId: data.userId ?? userId,
        score: Number(data.score ?? 0),
        total: Number(data.total ?? 0),
        timeUsed: Number(data.timeUsed ?? 0),
        answers: Array.isArray(data.answers) ? data.answers : [],
        createdAt: timestampToIso(data.createdAt),
      } satisfies ExamAttempt;
    });

    return attempts.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  };

  const savePayment = async (payment: PaymentInput) => {
    const payload = {
      userId: payment.userId || null,
      studentName: payment.studentName,
      studentEmail: payment.studentEmail,
      amount: Number(payment.amount),
      currency: payment.currency,
      plan: payment.plan,
      status: payment.status,
      method: payment.method,
      note: payment.note ?? '',
      updatedAt: serverTimestamp(),
      ...(payment.status === 'completed' ? { paidAt: serverTimestamp() } : {}),
    };

    if (payment.id) {
      await setDoc(doc(firebaseDb, 'payments', payment.id), payload, { merge: true });
    } else {
      await addDoc(collection(firebaseDb, 'payments'), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    if (payment.grantPremium && payment.userId) {
      await setStudentPremium(payment.userId, true);
    }
  };

  const deletePayment = async (id: string) => {
    await deleteDoc(doc(firebaseDb, 'payments', id));
  };

  const seedDefaultContent = async () => {
    const [{ default: categorySeed }, { default: lessonSeed }, { default: questionSeed }] = await Promise.all([
      import('@/lib/seed/categories.json'),
      import('@/lib/seed/lessons.json'),
      import('@/lib/seed/exam-questions.json'),
    ]);

    const batch = writeBatch(firebaseDb);

    (categorySeed as Category[]).forEach((category) => {
      batch.set(
        doc(firebaseDb, 'categories', category.id),
        {
          icon: category.icon,
          color: category.color,
          bgColor: category.bgColor,
          title: category.title,
          description: category.description,
          order: category.order,
          published: category.published,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    (lessonSeed as Lesson[]).forEach((lesson) => {
      batch.set(
        doc(firebaseDb, 'lessons', lesson.id),
        {
          categoryId: lesson.categoryId,
          order: lesson.order,
          duration: lesson.duration,
          icon: lesson.icon,
          title: lesson.title,
          content: lesson.content,
          questions: lesson.questions,
          premiumOnly: lesson.premiumOnly,
          published: lesson.published,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    (questionSeed as Question[]).forEach((question) => {
      batch.set(
        doc(firebaseDb, 'examQuestions', question.id),
        {
          question: question.question,
          options: question.options,
          explanation: question.explanation,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  };

  return (
    <AdminDataContext.Provider
      value={{
        categories,
        lessons,
        examQuestions,
        students,
        payments,
        isLoading,
        saveCategory,
        deleteCategory,
        saveLesson,
        deleteLesson,
        saveExamQuestion,
        deleteExamQuestion,
        importExamQuestions,
        savePayment,
        deletePayment,
        setStudentPremium,
        updateStudent,
        deleteStudent,
        restoreStudent,
        fetchStudentAttempts,
        seedDefaultContent,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  return useContext(AdminDataContext);
}

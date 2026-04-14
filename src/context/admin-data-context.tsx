'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { Category, Lesson, PaymentRecord, PaymentStatus, Question, StudentProfile } from '@/lib/types';

type CategoryInput = Omit<Category, 'createdAt' | 'updatedAt'>;
type LessonInput = Omit<Lesson, 'createdAt' | 'updatedAt'>;
type PaymentInput = Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt' | 'paidAt'> & { id?: string; grantPremium?: boolean };

interface AdminDataContextValue {
  categories: Category[];
  lessons: Lesson[];
  students: StudentProfile[];
  payments: PaymentRecord[];
  isLoading: boolean;
  saveCategory: (category: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveLesson: (lesson: LessonInput) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  savePayment: (payment: PaymentInput) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  setStudentPremium: (userId: string, isPremium: boolean) => Promise<void>;
  seedDefaultContent: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue>({
  categories: [],
  lessons: [],
  students: [],
  payments: [],
  isLoading: true,
  saveCategory: async () => {},
  deleteCategory: async () => {},
  saveLesson: async () => {},
  deleteLesson: async () => {},
  savePayment: async () => {},
  deletePayment: async () => {},
  setStudentPremium: async () => {},
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
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAuthorized) {
      setCategories([]);
      setLessons([]);
      setStudents([]);
      setPayments([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let readyCount = 0;

    const markReady = () => {
      readyCount += 1;
      if (isMounted && readyCount >= 4) {
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

    const unsubscribeStudents = onSnapshot(
      collection(firebaseDb, 'users'),
      (snapshot) => {
        if (!isMounted) return;

        setStudents(sortStudents(snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: data.name ?? 'Student',
            email: data.email ?? '',
            photoURL: data.photoURL ?? null,
            isPremium: data.isPremium ?? false,
            role: data.role ?? 'student',
            createdAt: timestampToIso(data.createdAt),
            lastLoginAt: timestampToIso(data.lastLoginAt),
            updatedAt: timestampToIso(data.updatedAt),
          } satisfies StudentProfile;
        })));
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
        students,
        payments,
        isLoading,
        saveCategory,
        deleteCategory,
        saveLesson,
        deleteLesson,
        savePayment,
        deletePayment,
        setStudentPremium,
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

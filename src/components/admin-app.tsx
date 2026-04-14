'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAdminData } from '@/context/admin-data-context';
import type { Category, Lesson, MultiLang, PaymentRecord, PaymentStatus, Question, StudentProfile } from '@/lib/types';

type TabId = 'dashboard' | 'categories' | 'lessons' | 'students' | 'payments';
type NoticeTone = 'error' | 'success';

interface NoticeState {
  tone: NoticeTone;
  text: string;
}

interface CategoryDraft {
  id: string;
  icon: string;
  color: string;
  bgColor: string;
  title: MultiLang;
  description: MultiLang;
  order: number;
  published: boolean;
}

interface LessonDraft {
  id: string;
  categoryId: string;
  order: number;
  duration: number;
  icon: string;
  title: MultiLang;
  content: MultiLang;
  questionsJson: string;
  premiumOnly: boolean;
  published: boolean;
}

interface PaymentDraft {
  id?: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  amount: string;
  currency: string;
  plan: string;
  status: PaymentStatus;
  method: string;
  note: string;
  grantPremium: boolean;
}

const TABS: Array<{ id: TabId; label: string; hint: string }> = [
  { id: 'dashboard', label: 'Dashboard', hint: 'Overview and quick actions' },
  { id: 'categories', label: 'Categories', hint: 'Manage course groups' },
  { id: 'lessons', label: 'Lessons', hint: 'Create and edit content' },
  { id: 'students', label: 'Students', hint: 'Manage learners and premium access' },
  { id: 'payments', label: 'Payments', hint: 'Track manual payment records' },
];

const EMPTY_MULTILANG: MultiLang = {
  en: '',
  fr: '',
  rw: '',
};

function cloneMultiLang(value?: MultiLang): MultiLang {
  return {
    en: value?.en ?? '',
    fr: value?.fr ?? '',
    rw: value?.rw ?? '',
  };
}

function createCategoryDraft(order = 1): CategoryDraft {
  return {
    id: '',
    icon: 'book',
    color: '#1E3A8A',
    bgColor: '#EFF6FF',
    title: cloneMultiLang(),
    description: cloneMultiLang(),
    order,
    published: true,
  };
}

function createLessonDraft(categoryId = '', order = 1): LessonDraft {
  return {
    id: '',
    categoryId,
    order,
    duration: 5,
    icon: 'book',
    title: cloneMultiLang(),
    content: cloneMultiLang(),
    questionsJson: '[]',
    premiumOnly: false,
    published: true,
  };
}

function createPaymentDraft(): PaymentDraft {
  return {
    userId: '',
    studentName: '',
    studentEmail: '',
    amount: '2500',
    currency: 'RWF',
    plan: 'premium',
    status: 'completed',
    method: 'Manual',
    note: '',
    grantPremium: true,
  };
}

function parseQuestions(raw: string) {
  if (!raw.trim()) return [] as Question[];

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Questions must be a JSON array.');
  }

  return parsed as Question[];
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function formatMoney(amount: number, currency: string) {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)} ${currency}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';
}

function MultiLangFields({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: MultiLang;
  onChange: (language: keyof MultiLang, nextValue: string) => void;
  multiline?: boolean;
}) {
  const labels: Array<{ key: keyof MultiLang; title: string }> = [
    { key: 'en', title: 'English' },
    { key: 'rw', title: 'Kinyarwanda' },
    { key: 'fr', title: 'French' },
  ];

  return (
    <div className="stack">
      <div className="section-header-row">
        <h3>{label}</h3>
      </div>
      <div className="language-grid">
        {labels.map((item) => (
          <label key={item.key} className="field">
            <span>{item.title}</span>
            {multiline ? (
              <textarea
                value={value[item.key]}
                onChange={(event) => onChange(item.key, event.target.value)}
                rows={6}
              />
            ) : (
              <input
                value={value[item.key]}
                onChange={(event) => onChange(item.key, event.target.value)}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

export function AdminApp() {
  const { user, isLoading: isAuthLoading, isAuthorized, login, loginWithGoogle, logout } = useAuth();
  const {
    categories,
    lessons,
    students,
    payments,
    isLoading: isDataLoading,
    saveCategory,
    deleteCategory,
    saveLesson,
    deleteLesson,
    savePayment,
    deletePayment,
    setStudentPremium,
    seedDefaultContent,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [loginState, setLoginState] = useState({
    email: '',
    password: '',
    error: '',
    isSubmitting: false,
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(createCategoryDraft());
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(createLessonDraft());
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(createPaymentDraft());

  useEffect(() => {
    if (!lessonDraft.categoryId && categories[0]?.id) {
      setLessonDraft((current) => ({
        ...current,
        categoryId: categories[0]?.id ?? '',
      }));
    }
  }, [categories, lessonDraft.categoryId]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const currentTab = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  const totalRevenue = payments
    .filter((payment) => payment.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const premiumStudents = students.filter((student) => student.isPremium).length;
  const publishedLessons = lessons.filter((lesson) => lesson.published).length;
  const pendingPayments = payments.filter((payment) => payment.status === 'pending').length;

  const recentStudents = students.slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  const runAction = async (action: () => Promise<void>, successMessage: string, failurePrefix: string) => {
    try {
      await action();
      setNotice({ tone: 'success', text: successMessage });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setNotice({ tone: 'error', text: `${failurePrefix}: ${message}` });
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryDraft(createCategoryDraft(categories.length + 1));
  };

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonDraft(createLessonDraft(categories[0]?.id ?? '', lessons.length + 1));
  };

  const handleCategorySave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: Category = {
      id: categoryDraft.id.trim(),
      icon: categoryDraft.icon.trim(),
      color: categoryDraft.color.trim(),
      bgColor: categoryDraft.bgColor.trim(),
      title: cloneMultiLang(categoryDraft.title),
      description: cloneMultiLang(categoryDraft.description),
      order: Number(categoryDraft.order),
      published: categoryDraft.published,
    };

    await runAction(
      async () => {
        await saveCategory(payload);
        resetCategoryForm();
      },
      'Category saved.',
      'Could not save category'
    );
  };

  const handleLessonSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction(
      async () => {
        const payload: Lesson = {
          id: lessonDraft.id.trim(),
          categoryId: lessonDraft.categoryId,
          order: Number(lessonDraft.order),
          duration: Number(lessonDraft.duration),
          icon: lessonDraft.icon.trim(),
          title: cloneMultiLang(lessonDraft.title),
          content: cloneMultiLang(lessonDraft.content),
          questions: parseQuestions(lessonDraft.questionsJson),
          premiumOnly: lessonDraft.premiumOnly,
          published: lessonDraft.published,
        };

        await saveLesson(payload);
        resetLessonForm();
      },
      'Lesson saved.',
      'Could not save lesson'
    );
  };

  const handlePaymentSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction(
      async () => {
        await savePayment({
          id: paymentDraft.id,
          userId: paymentDraft.userId || undefined,
          studentName: paymentDraft.studentName.trim(),
          studentEmail: paymentDraft.studentEmail.trim(),
          amount: Number(paymentDraft.amount),
          currency: paymentDraft.currency.trim(),
          plan: paymentDraft.plan.trim(),
          status: paymentDraft.status,
          method: paymentDraft.method.trim(),
          note: paymentDraft.note.trim(),
          grantPremium: paymentDraft.grantPremium,
        });

        setPaymentDraft(createPaymentDraft());
      },
      paymentDraft.id ? 'Payment updated.' : 'Payment recorded.',
      'Could not save payment'
    );
  };

  const startCategoryEdit = (category: Category) => {
    setActiveTab('categories');
    setEditingCategoryId(category.id);
    setCategoryDraft({
      id: category.id,
      icon: category.icon,
      color: category.color,
      bgColor: category.bgColor,
      title: cloneMultiLang(category.title),
      description: cloneMultiLang(category.description),
      order: category.order,
      published: category.published,
    });
  };

  const startLessonEdit = (lesson: Lesson) => {
    setActiveTab('lessons');
    setEditingLessonId(lesson.id);
    setLessonDraft({
      id: lesson.id,
      categoryId: lesson.categoryId,
      order: lesson.order,
      duration: lesson.duration,
      icon: lesson.icon,
      title: cloneMultiLang(lesson.title),
      content: cloneMultiLang(lesson.content),
      questionsJson: JSON.stringify(lesson.questions, null, 2),
      premiumOnly: lesson.premiumOnly,
      published: lesson.published,
    });
  };

  const startPaymentEdit = (payment: PaymentRecord) => {
    setActiveTab('payments');
    setPaymentDraft({
      id: payment.id,
      userId: payment.userId ?? '',
      studentName: payment.studentName,
      studentEmail: payment.studentEmail,
      amount: String(payment.amount),
      currency: payment.currency,
      plan: payment.plan,
      status: payment.status,
      method: payment.method,
      note: payment.note ?? '',
      grantPremium: payment.status === 'completed',
    });
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginState((current) => ({ ...current, error: '', isSubmitting: true }));

    try {
      await login(loginState.email.trim(), loginState.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not sign in.';
      setLoginState((current) => ({ ...current, error: message, isSubmitting: false }));
      return;
    }

    setLoginState((current) => ({ ...current, isSubmitting: false }));
  };

  const handleGoogleLogin = async () => {
    setLoginState((current) => ({ ...current, error: '', isSubmitting: true }));

    try {
      await loginWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not sign in with Google.';
      setLoginState((current) => ({ ...current, error: message, isSubmitting: false }));
      return;
    }

    setLoginState((current) => ({ ...current, isSubmitting: false }));
  };

  const handleSeed = async () => {
    if (!window.confirm('Seed the current mobile app catalog into Firestore? Existing matching docs will be updated.')) {
      return;
    }

    await runAction(
      seedDefaultContent,
      'Default content seeded into Firebase.',
      'Could not seed the catalog'
    );
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.title.en || category.id}"?`)) {
      return;
    }

    await runAction(
      () => deleteCategory(category.id),
      'Category deleted.',
      'Could not delete category'
    );
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!window.confirm(`Delete lesson "${lesson.title.en || lesson.id}"?`)) {
      return;
    }

    await runAction(
      () => deleteLesson(lesson.id),
      'Lesson deleted.',
      'Could not delete lesson'
    );
  };

  const handleDeletePayment = async (payment: PaymentRecord) => {
    if (!window.confirm(`Delete payment for "${payment.studentName}"?`)) {
      return;
    }

    await runAction(
      () => deletePayment(payment.id),
      'Payment deleted.',
      'Could not delete payment'
    );
  };

  const handleStudentPick = (studentId: string) => {
    const student = students.find((item) => item.id === studentId);
    setPaymentDraft((current) => ({
      ...current,
      userId: studentId,
      studentName: student?.name ?? '',
      studentEmail: student?.email ?? '',
    }));
  };

  const toggleStudentPremium = async (student: StudentProfile) => {
    await runAction(
      () => setStudentPremium(student.id, !student.isPremium),
      student.isPremium ? 'Premium access removed.' : 'Premium access granted.',
      'Could not update premium access'
    );
  };

  const renderDashboard = () => (
    <div className="stack">
      <div className="stats-grid">
        <StatCard label="Categories" value={String(categories.length)} hint="Cloud-managed content groups" />
        <StatCard label="Published Lessons" value={String(publishedLessons)} hint={`${lessons.length} total lessons`} />
        <StatCard label="Students" value={String(students.length)} hint={`${premiumStudents} premium learners`} />
        <StatCard label="Revenue" value={formatMoney(totalRevenue, 'RWF')} hint={`${pendingPayments} pending payments`} />
      </div>

      <div className="panel">
        <div className="section-header-row">
          <div>
            <h2>Quick actions</h2>
            <p>Seed the existing catalog or jump directly into the main admin flows.</p>
          </div>
        </div>
        <div className="button-row">
          <button className="button button-primary" type="button" onClick={handleSeed}>
            Seed Mobile Catalog
          </button>
          <button className="button button-secondary" type="button" onClick={() => setActiveTab('categories')}>
            Add Category
          </button>
          <button className="button button-secondary" type="button" onClick={() => setActiveTab('lessons')}>
            Add Lesson
          </button>
          <button className="button button-secondary" type="button" onClick={() => setActiveTab('payments')}>
            Record Payment
          </button>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="panel">
          <div className="section-header-row">
            <div>
              <h2>Recent students</h2>
              <p>Newest activity from Firebase Auth user profiles.</p>
            </div>
          </div>
          {recentStudents.length ? (
            <div className="list">
              {recentStudents.map((student) => (
                <div key={student.id} className="list-item">
                  <div className="list-item-main">
                    <div className="avatar-chip">{getInitials(student.name)}</div>
                    <div>
                      <strong>{student.name}</strong>
                      <p>{student.email || 'No email recorded'}</p>
                    </div>
                  </div>
                  <div className="chip-row">
                    <span className={`status-pill ${student.isPremium ? 'success' : 'muted'}`}>
                      {student.isPremium ? 'Premium' : 'Free'}
                    </span>
                    <span className="meta-text">{formatDate(student.lastLoginAt || student.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No students yet" body="Student records will appear here after people sign into the mobile app." />
          )}
        </div>

        <div className="panel">
          <div className="section-header-row">
            <div>
              <h2>Recent payments</h2>
              <p>Manual payment records you have added from the admin side.</p>
            </div>
          </div>
          {recentPayments.length ? (
            <div className="list">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="list-item">
                  <div>
                    <strong>{payment.studentName}</strong>
                    <p>{formatMoney(payment.amount, payment.currency)} · {payment.method}</p>
                  </div>
                  <div className="chip-row">
                    <span className={`status-pill ${payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}`}>
                      {payment.status}
                    </span>
                    <span className="meta-text">{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No payments yet" body="Record payments here whenever you start collecting premium subscriptions manually." />
          )}
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="two-column-grid">
      <form className="panel stack" onSubmit={handleCategorySave}>
        <div className="section-header-row">
          <div>
            <h2>{editingCategoryId ? 'Edit category' : 'Create category'}</h2>
            <p>Each category becomes a content bucket inside the mobile app.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Category ID</span>
            <input
              value={categoryDraft.id}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, id: event.target.value }))}
              placeholder="road-signs"
              disabled={Boolean(editingCategoryId)}
              required
            />
          </label>
          <label className="field">
            <span>Order</span>
            <input
              type="number"
              value={categoryDraft.order}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, order: Number(event.target.value) }))}
              min={1}
              required
            />
          </label>
          <label className="field">
            <span>Icon</span>
            <input
              value={categoryDraft.icon}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, icon: event.target.value }))}
              placeholder="book"
              required
            />
          </label>
          <label className="field">
            <span>Accent color</span>
            <input
              value={categoryDraft.color}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, color: event.target.value }))}
              placeholder="#1E3A8A"
              required
            />
          </label>
          <label className="field">
            <span>Background color</span>
            <input
              value={categoryDraft.bgColor}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, bgColor: event.target.value }))}
              placeholder="#EFF6FF"
              required
            />
          </label>
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={categoryDraft.published}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, published: event.target.checked }))}
            />
            <span>Published</span>
          </label>
        </div>

        <MultiLangFields
          label="Category title"
          value={categoryDraft.title}
          onChange={(language, nextValue) => {
            setCategoryDraft((current) => ({
              ...current,
              title: { ...current.title, [language]: nextValue },
            }));
          }}
        />

        <MultiLangFields
          label="Category description"
          value={categoryDraft.description}
          onChange={(language, nextValue) => {
            setCategoryDraft((current) => ({
              ...current,
              description: { ...current.description, [language]: nextValue },
            }));
          }}
          multiline
        />

        <div className="button-row">
          <button className="button button-primary" type="submit">
            {editingCategoryId ? 'Update category' : 'Save category'}
          </button>
          <button className="button button-secondary" type="button" onClick={resetCategoryForm}>
            Reset
          </button>
        </div>
      </form>

      <div className="panel stack">
        <div className="section-header-row">
          <div>
            <h2>Existing categories</h2>
            <p>Current category documents stored in Firestore.</p>
          </div>
        </div>
        {categories.length ? (
          <div className="list">
            {categories.map((category) => (
              <div key={category.id} className="list-item">
                <div>
                  <strong>{category.title.en || category.id}</strong>
                  <p>{category.id} · order {category.order}</p>
                </div>
                <div className="chip-row">
                  <span className={`status-pill ${category.published ? 'success' : 'muted'}`}>
                    {category.published ? 'Published' : 'Hidden'}
                  </span>
                  <button className="button button-ghost" type="button" onClick={() => startCategoryEdit(category)}>
                    Edit
                  </button>
                  <button className="button button-danger" type="button" onClick={() => handleDeleteCategory(category)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No cloud categories yet" body="Create one here or use the seed action from the dashboard to import the current mobile app catalog." />
        )}
      </div>
    </div>
  );

  const renderLessons = () => (
    <div className="two-column-grid">
      <form className="panel stack" onSubmit={handleLessonSave}>
        <div className="section-header-row">
          <div>
            <h2>{editingLessonId ? 'Edit lesson' : 'Create lesson'}</h2>
            <p>Lessons are what the mobile app displays to learners in each category.</p>
          </div>
        </div>

        {!categories.length ? (
          <EmptyState title="Create a category first" body="Lessons need a category before they can be saved." />
        ) : (
          <>
            <div className="form-grid">
              <label className="field">
                <span>Lesson ID</span>
                <input
                  value={lessonDraft.id}
                  onChange={(event) => setLessonDraft((current) => ({ ...current, id: event.target.value }))}
                  placeholder="rs1"
                  disabled={Boolean(editingLessonId)}
                  required
                />
              </label>
              <label className="field">
                <span>Category</span>
                <select
                  value={lessonDraft.categoryId}
                  onChange={(event) => setLessonDraft((current) => ({ ...current, categoryId: event.target.value }))}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title.en || category.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Order</span>
                <input
                  type="number"
                  value={lessonDraft.order}
                  onChange={(event) => setLessonDraft((current) => ({ ...current, order: Number(event.target.value) }))}
                  min={1}
                  required
                />
              </label>
              <label className="field">
                <span>Duration in minutes</span>
                <input
                  type="number"
                  value={lessonDraft.duration}
                  onChange={(event) => setLessonDraft((current) => ({ ...current, duration: Number(event.target.value) }))}
                  min={1}
                  required
                />
              </label>
              <label className="field">
                <span>Icon</span>
                <input
                  value={lessonDraft.icon}
                  onChange={(event) => setLessonDraft((current) => ({ ...current, icon: event.target.value }))}
                  placeholder="alert-circle"
                  required
                />
              </label>
              <div className="toggle-cluster">
                <label className="toggle-field">
                  <input
                    type="checkbox"
                    checked={lessonDraft.published}
                    onChange={(event) => setLessonDraft((current) => ({ ...current, published: event.target.checked }))}
                  />
                  <span>Published</span>
                </label>
                <label className="toggle-field">
                  <input
                    type="checkbox"
                    checked={lessonDraft.premiumOnly}
                    onChange={(event) => setLessonDraft((current) => ({ ...current, premiumOnly: event.target.checked }))}
                  />
                  <span>Premium only</span>
                </label>
              </div>
            </div>

            <MultiLangFields
              label="Lesson title"
              value={lessonDraft.title}
              onChange={(language, nextValue) => {
                setLessonDraft((current) => ({
                  ...current,
                  title: { ...current.title, [language]: nextValue },
                }));
              }}
            />

            <MultiLangFields
              label="Lesson content"
              value={lessonDraft.content}
              onChange={(language, nextValue) => {
                setLessonDraft((current) => ({
                  ...current,
                  content: { ...current.content, [language]: nextValue },
                }));
              }}
              multiline
            />

            <label className="field">
              <span>Questions JSON</span>
              <textarea
                value={lessonDraft.questionsJson}
                onChange={(event) => setLessonDraft((current) => ({ ...current, questionsJson: event.target.value }))}
                rows={14}
              />
              <small>Use an array of question objects with `id`, `question`, `options`, and `explanation`.</small>
            </label>

            <div className="button-row">
              <button className="button button-primary" type="submit">
                {editingLessonId ? 'Update lesson' : 'Save lesson'}
              </button>
              <button className="button button-secondary" type="button" onClick={resetLessonForm}>
                Reset
              </button>
            </div>
          </>
        )}
      </form>

      <div className="panel stack">
        <div className="section-header-row">
          <div>
            <h2>Existing lessons</h2>
            <p>Every lesson here is instantly available for the mobile app to consume.</p>
          </div>
        </div>
        {lessons.length ? (
          <div className="list">
            {lessons.map((lesson) => {
              const category = categories.find((item) => item.id === lesson.categoryId);
              return (
                <div key={lesson.id} className="list-item">
                  <div>
                    <strong>{lesson.title.en || lesson.id}</strong>
                    <p>
                      {category?.title.en || lesson.categoryId} · {lesson.duration} min · {lesson.questions.length} questions
                    </p>
                  </div>
                  <div className="chip-row">
                    <span className={`status-pill ${lesson.published ? 'success' : 'muted'}`}>
                      {lesson.published ? 'Published' : 'Hidden'}
                    </span>
                    {lesson.premiumOnly ? <span className="status-pill warning">Premium</span> : null}
                    <button className="button button-ghost" type="button" onClick={() => startLessonEdit(lesson)}>
                      Edit
                    </button>
                    <button className="button button-danger" type="button" onClick={() => handleDeleteLesson(lesson)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No cloud lessons yet" body="Create a lesson or seed the current catalog from the dashboard." />
        )}
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="panel stack">
      <div className="section-header-row">
        <div>
          <h2>Students</h2>
          <p>These records come from the mobile app whenever someone signs in.</p>
        </div>
      </div>
      {students.length ? (
        <div className="list">
          {students.map((student) => (
            <div key={student.id} className="list-item">
              <div className="list-item-main">
                <div className="avatar-chip">{getInitials(student.name)}</div>
                <div>
                  <strong>{student.name}</strong>
                  <p>{student.email || 'No email recorded'}</p>
                </div>
              </div>
              <div className="chip-row">
                <span className="meta-text">{student.role}</span>
                <span className={`status-pill ${student.isPremium ? 'success' : 'muted'}`}>
                  {student.isPremium ? 'Premium' : 'Free'}
                </span>
                <span className="meta-text">{formatDate(student.lastLoginAt || student.createdAt)}</span>
                <button className="button button-secondary" type="button" onClick={() => toggleStudentPremium(student)}>
                  {student.isPremium ? 'Remove Premium' : 'Grant Premium'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No student profiles yet" body="Once the mobile app users log in, they’ll start appearing here automatically." />
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="two-column-grid">
      <form className="panel stack" onSubmit={handlePaymentSave}>
        <div className="section-header-row">
          <div>
            <h2>Record payment</h2>
            <p>Use this for manual premium tracking until a full payment gateway is added.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Student</span>
            <select value={paymentDraft.userId} onChange={(event) => handleStudentPick(event.target.value)}>
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Student name</span>
            <input
              value={paymentDraft.studentName}
              onChange={(event) => setPaymentDraft((current) => ({ ...current, studentName: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Student email</span>
            <input
              value={paymentDraft.studentEmail}
              onChange={(event) => setPaymentDraft((current) => ({ ...current, studentEmail: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Amount</span>
            <input
              type="number"
              value={paymentDraft.amount}
              onChange={(event) => setPaymentDraft((current) => ({ ...current, amount: event.target.value }))}
              min={0}
              required
            />
          </label>
          <label className="field">
            <span>Currency</span>
            <input
              value={paymentDraft.currency}
              onChange={(event) => setPaymentDraft((current) => ({ ...current, currency: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Plan</span>
            <input
              value={paymentDraft.plan}
              onChange={(event) => setPaymentDraft((current) => ({ ...current, plan: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={paymentDraft.status}
              onChange={(event) => setPaymentDraft((current) => ({ ...current, status: event.target.value as PaymentStatus }))}
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="field">
            <span>Method</span>
            <input
              value={paymentDraft.method}
              onChange={(event) => setPaymentDraft((current) => ({ ...current, method: event.target.value }))}
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Note</span>
          <textarea
            value={paymentDraft.note}
            onChange={(event) => setPaymentDraft((current) => ({ ...current, note: event.target.value }))}
            rows={5}
          />
        </label>

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={paymentDraft.grantPremium}
            onChange={(event) => setPaymentDraft((current) => ({ ...current, grantPremium: event.target.checked }))}
          />
          <span>Grant premium access when this payment is saved</span>
        </label>

        <div className="button-row">
          <button className="button button-primary" type="submit">
            {paymentDraft.id ? 'Update payment' : 'Save payment'}
          </button>
          <button className="button button-secondary" type="button" onClick={() => setPaymentDraft(createPaymentDraft())}>
            Reset
          </button>
        </div>
      </form>

      <div className="panel stack">
        <div className="section-header-row">
          <div>
            <h2>Payment history</h2>
            <p>Simple manual records tied to your Firebase project.</p>
          </div>
        </div>
        {payments.length ? (
          <div className="list">
            {payments.map((payment) => (
              <div key={payment.id} className="list-item">
                <div>
                  <strong>{payment.studentName}</strong>
                  <p>{formatMoney(payment.amount, payment.currency)} · {payment.plan} · {payment.method}</p>
                </div>
                <div className="chip-row">
                  <span className={`status-pill ${payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}`}>
                    {payment.status}
                  </span>
                  <span className="meta-text">{formatDate(payment.paidAt || payment.createdAt)}</span>
                  <button className="button button-ghost" type="button" onClick={() => startPaymentEdit(payment)}>
                    Edit
                  </button>
                  <button className="button button-danger" type="button" onClick={() => handleDeletePayment(payment)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No payments recorded" body="Add your first manual payment on the left to start tracking premium access." />
        )}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    if (isDataLoading) {
      return (
        <div className="panel">
          <div className="loading-state">Loading admin data from Firebase…</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'categories':
        return renderCategories();
      case 'lessons':
        return renderLessons();
      case 'students':
        return renderStudents();
      case 'payments':
        return renderPayments();
      default:
        return renderDashboard();
    }
  };

  if (isAuthLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Mpugura Admin</h1>
          <p>Checking your Firebase session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-block">
            <span className="brand-pill">Admin MVP</span>
            <h1>Manage Mpugura from the web</h1>
            <p>
              Sign in with the same Firebase project used by the mobile app, then manage categories,
              lessons, students, and payments from one place.
            </p>
          </div>

          <form className="stack" onSubmit={handleLogin}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={loginState.email}
                onChange={(event) => setLoginState((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={loginState.password}
                onChange={(event) => setLoginState((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </label>
            {loginState.error ? <div className="notice notice-error">{loginState.error}</div> : null}
            <button className="button button-primary button-block" type="submit" disabled={loginState.isSubmitting}>
              {loginState.isSubmitting ? 'Signing in…' : 'Sign in with email'}
            </button>
            <button
              className="button button-secondary button-block"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loginState.isSubmitting}
            >
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-block">
            <span className="brand-pill">Access blocked</span>
            <h1>This account is not allowed into the admin.</h1>
            <p>
              Add your email to <code>NEXT_PUBLIC_ADMIN_EMAILS</code> in the admin project if you want a simple allowlist.
            </p>
          </div>
          <button className="button button-primary button-block" type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-block">
            <span className="brand-pill">Firebase Only</span>
            <h1>Mpugura Admin</h1>
            <p>Simple content and operations dashboard for your mobile app.</p>
          </div>
          <nav className="nav-list">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <strong>{tab.label}</strong>
                <span>{tab.hint}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="avatar-chip large">{getInitials(user.name)}</div>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
            </div>
          </div>
          <button className="button button-secondary button-block" type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <span className="topbar-eyebrow">Admin workspace</span>
            <h2>{currentTab.label}</h2>
            <p>{currentTab.hint}</p>
          </div>
        </header>

        {notice ? <div className={`notice notice-${notice.tone}`}>{notice.text}</div> : null}

        {renderActiveTab()}
      </main>
    </div>
  );
}


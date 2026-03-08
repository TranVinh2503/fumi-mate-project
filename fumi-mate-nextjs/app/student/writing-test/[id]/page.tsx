'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/apiConfig';

type Question = {
  id: number;
  questionText: string;
  questionType: string;
  hint?: string;
  sampleAnswer?: string;
};

type Task = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  dueDate: string | null;
  createdAt: string | null;
  isDone: boolean;
  questions: Question[];
  teacherId?: string;
  submission?: {
    id: number;
    content: string;
    status: string;
  };
};

export default function WritingTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const taskId = params.id;
  
  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<{id: number; content: string; status: string;} | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    if (!token) {
      setMessage('Please login first');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch task details from student API
        const taskResponse = await fetch(`${API_ENDPOINTS.STUDENT_TASKS}/${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!taskResponse.ok) {
          throw new Error('Failed to load task');
        }

        const taskData = await taskResponse.json();
        setTask(taskData.task);

        // If there's an existing submission, load it
        if (taskData.task.submission) {
          setSubmission(taskData.task.submission);
          setContent(taskData.task.submission.content || '');
        }
      } catch (error) {
        console.error('Error fetching task:', error);
        setMessage('Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirm('Are you sure you want to submit your test? Once submitted, you cannot edit it.')) {
      return;
    }

    if (!token) {
      setMessage('Please login first');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINTS.STUDENT_SUBMIT_TEST(Number(taskId)), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          action: 'submit'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('✅ Your test has been submitted successfully!');
        setSubmission(data.submission);
        setTimeout(() => router.push('/student/submissions'), 2000);
      } else {
        const error = await response.json();
        setMessage(`❌ Submission failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!token) {
      setMessage('Please login first');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.STUDENT_SUBMIT_TEST(Number(taskId)), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          action: 'save'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('💾 Draft saved successfully!');
        if (data.submission) {
          setSubmission(data.submission);
        }
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ Failed to save draft: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save draft error:', error);
      setMessage('❌ Failed to save draft. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto section-padding text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-xl text-gray-600 mt-4">Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto section-padding text-center">
        <p className="text-xl text-red-600">Task not found</p>
        <Link href="/student/tasks" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  const isSubmitted = submission?.status === 'submitted';
  const questions = task.questions || [];

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-4xl font-title font-bold mb-8">Writing Test</h2>

        {/* Flash messages */}
        {message && (
          <div className={`alert mb-4 ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {message}
            <button
              onClick={() => setMessage('')}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Task Information */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <h3 className="font-semibold mb-3 text-lg">{task.title}</h3>
          <p className="text-gray-700 mb-4">{task.description}</p>
          
          {questions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Questions:</h4>
              {questions.map((q, index) => (
                <div key={q.id} className="mb-3 p-3 bg-white rounded">
                  <p className="text-gray-700">
                    <span className="font-semibold">Q{index + 1}:</span> {q.questionText}
                  </p>
                  {q.hint && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-semibold">Hint:</span> {q.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-sm text-gray-600">
            <span className="font-semibold">Difficulty: </span>
            <span>{task.difficulty || 'N/A'}</span>
          </div>
          {task.dueDate && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Due: </span>
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {submission && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Status: </span>
              <span className={isSubmitted ? 'text-green-600 font-semibold' : 'text-yellow-600'}>
                {isSubmitted ? 'Submitted' : 'Draft'}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="content" className="block text-lg font-semibold mb-3">
              Your Writing
            </label>
            <textarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="custom-textarea"
              rows={15}
              required
              placeholder="Start writing your answer here..."
              disabled={isSubmitted}
            />
            <p className="text-sm text-gray-500 mt-2">
              Character count: {content.length}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || isSubmitted || !content.trim()}
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors btn-hover-scale disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : isSubmitted ? 'Already Submitted' : 'Submit Test'}
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || isSubmitted || !content.trim()}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <Link
              href="/student/tasks"
              className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}


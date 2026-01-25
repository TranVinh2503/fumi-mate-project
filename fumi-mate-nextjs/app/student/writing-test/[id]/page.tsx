'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Question = {
  id: number;
  questionText: string;
  questionType: string;
  hint?: string;
  sampleAnswer?: string;
};

type TaskData = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  dueDate: string | null;
  createdAt: string | null;
  questions: Question[];
  submission: {
    id: number;
    content: string;
    status: string;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
};

export default function WritingTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const taskId = params.id;
  
  const [task, setTask] = useState<TaskData | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchTask = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Not authenticated. Please login first.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/student/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch task');
        }

        const data = await res.json();
        setTask(data.task);
        
        // If there's an existing submission, load its content
        if (data.task.submission) {
          setContent(data.task.submission.content || '');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirm('Are you sure you want to submit your test? Once submitted, you cannot edit it.')) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/student/submit-test/${taskId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          action: 'submit',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Submission failed');
      }

      setMessage('✅ Your test has been submitted successfully!');
      
      // Update task with new submission status
      if (task) {
        setTask({
          ...task,
          submission: {
            ...task.submission!,
            status: 'submitted',
            content,
          },
        });
      }

      setTimeout(() => router.push('/student/submissions'), 2000);
    } catch (err: any) {
      console.error(err);
      setMessage('❌ Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/student/submit-test/${taskId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          action: 'save',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save draft');
      }

      setMessage('💾 Draft saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage('❌ Failed to save draft: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto section-padding text-center">
        <p className="text-xl text-gray-600">Loading task...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto section-padding text-center">
        <p className="text-xl text-red-600">{error}</p>
        <Link href="/student/tasks" className="text-blue-500 hover:underline mt-4 inline-block">
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto section-padding text-center">
        <p className="text-xl text-gray-600">Task not found</p>
        <Link href="/student/tasks" className="text-blue-500 hover:underline mt-4 inline-block">
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  const isSubmitted = task.submission?.status === 'submitted';

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-4xl font-title font-bold mb-8">Writing Test</h2>
        <h3 className="text-xl font-semibold mb-4 text-gray-700">{task.title}</h3>

        {/* Flash messages */}
        {message && (
          <div className={`alert mb-4 ${message.includes('✅') ? 'alert-success' : message.includes('❌') ? 'alert-error' : 'alert-info'}`}>
            {message}
            <button
              onClick={() => setMessage('')}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Task info */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <h3 className="font-semibold mb-3">Questions:</h3>
          {task.questions && task.questions.length > 0 ? (
            task.questions.map((q, index) => (
              <div key={q.id} className="mb-4 pb-4 border-b border-blue-200 last:border-b-0 last:mb-0 last:pb-0">
                <p className="text-gray-700 font-medium">Q{index + 1}: {q.questionText}</p>
                {q.hint && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold">Hint:</span> {q.hint}
                  </p>
                )}
                {q.sampleAnswer && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold">Sample Answer:</span> {q.sampleAnswer}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No questions available</p>
          )}
          
          <div className="mt-4 pt-3 border-t border-blue-200 text-sm text-gray-600">
            <div className="flex flex-wrap gap-4">
              <span><span className="font-semibold">Difficulty:</span> {task.difficulty || 'N/A'}</span>
              <span><span className="font-semibold">Due:</span> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          {task.submission && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Status: </span>
              <span className={isSubmitted ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                {isSubmitted ? 'Submitted' : 'Draft (not yet submitted)'}
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

          <div className="flex gap-4 flex-wrap">
            <button
              type="submit"
              disabled={submitting || isSubmitted || !content.trim()}
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors btn-hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : isSubmitted ? 'Already Submitted' : 'Submit Test'}
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || isSubmitted || !content.trim()}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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


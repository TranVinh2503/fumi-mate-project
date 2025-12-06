'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockTasks, mockSubmissions } from '@/lib/mockData';
import { Task, Submission } from '@/lib/types';

export default function WritingTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const taskId = parseInt(params.id);
  
  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    // TODO: Fetch task from Flask API
    // const response = await fetch(`/api/student/tasks/${taskId}`);
    // const data = await response.json();
    // setTask(data);
    
    const foundTask = mockTasks.find(t => t.id === taskId);
    setTask(foundTask || null);
    
    // TODO: Fetch existing submission if any
    const existingSubmission = mockSubmissions.find(
      s => s.taskId === taskId && s.studentId === 1
    );
    if (existingSubmission) {
      setSubmission(existingSubmission);
      setContent(existingSubmission.content);
    }
  }, [taskId]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to submit your test? Once submitted, you cannot edit it.')) {
      return;
    }
    
    // TODO: Submit to Flask API
    // const response = await fetch(`/api/student/submit-test/${taskId}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ content }),
    // });
    
    console.log('Submitting test:', {
      taskId,
      content,
      timestamp: new Date().toISOString(),
    });
    
    alert('✅ Your test has been submitted successfully!');
    router.push('/student/submissions');
  };

  if (!task) {
    return (
      <div className="container mx-auto section-padding text-center">
        <p className="text-xl text-gray-600">Loading task...</p>
      </div>
    );
  }

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-4">{task.title}</h2>
        <p className="text-gray-600 mb-6">{task.description}</p>

        <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-red-600 font-semibold text-lg">
            <span id="timer">⏰ {formatTime(timeLeft)}</span> left
          </div>
          <small className="text-gray-600">
            Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'No deadline'}
          </small>
        </div>

        {task.questions && task.questions.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="font-semibold mb-3">Questions:</h3>
            <ol className="list-decimal list-inside space-y-2">
              {task.questions.map((q, index) => (
                <li key={q.id} className="text-gray-700">
                  {q.questionText}
                  {q.hint && (
                    <p className="text-sm text-gray-500 ml-6 mt-1">
                      💡 Hint: {q.hint}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

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
            />
            <p className="text-sm text-gray-500 mt-2">
              Character count: {content.length}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors btn-hover-scale"
            >
              Submit Test
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Draft saved:', { taskId, content });
                alert('💾 Draft saved successfully!');
              }}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
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

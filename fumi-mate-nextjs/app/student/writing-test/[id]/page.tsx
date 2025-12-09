'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTaskById, getQuestionById, getSubmissionsForStudent } from '@/lib/mockData';
import { Task, Submission } from '@/lib/types';

export default function WritingTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const taskId = params.id;
  const studentId = 'student1'; // TODO: Get from auth context

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // TODO: Fetch task and submission from Flask API
    // const taskResponse = await fetch(`/api/tasks/${taskId}`);
    // const taskData = await taskResponse.json();
    // setTask(taskData);
    //
    // const submissionResponse = await fetch(`/api/submissions?task_id=${taskId}&student_id=${studentId}`);
    // const submissionData = await submissionResponse.json();
    // if (submissionData.length > 0) {
    //   setSubmission(submissionData[0]);
    //   setContent(submissionData[0].content);
    // }

    // Mock data for now
    const foundTask = getTaskById(taskId);
    setTask(foundTask || null);

    const submissions = getSubmissionsForStudent(studentId);
    const foundSubmission = submissions.find(sub => sub.task_id === taskId);
    if (foundSubmission) {
      setSubmission(foundSubmission);
      setContent(foundSubmission.content);
    }
  }, [taskId, studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirm('Are you sure you want to submit your test? Once submitted, you cannot edit it.')) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Submit to Flask API
      // const response = await fetch('/api/submissions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     task_id: taskId,
      //     student_id: studentId,
      //     content
      //   }),
      // });
      // if (response.ok) {
      //   setMessage('Submission successful!');
      //   setSubmission(await response.json());
      // } else {
      //   setMessage('Submission failed.');
      // }

      // Mock success for now
      setMessage('✅ Your test has been submitted successfully!');
      // Update local submission status
      if (submission) {
        setSubmission({ ...submission, status: 1, submission_time: new Date().toISOString() });
      } else {
        // Create new submission
        const newSubmission: Submission = {
          id: `sub${Date.now()}`,
          task_id: taskId,
          student_id: studentId,
          content,
          status: 1,
          submission_time: new Date().toISOString(),
        };
        setSubmission(newSubmission);
      }
      setTimeout(() => router.push('/student/submissions'), 2000);
    } catch (error) {
      setMessage('❌ Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    // TODO: Save draft to Flask API
    console.log('Draft saved:', { taskId, content });
    setMessage('💾 Draft saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!task) {
    return (
      <div className="container mx-auto section-padding text-center">
        <p className="text-xl text-gray-600">Loading task...</p>
      </div>
    );
  }

  const question = getQuestionById(task.question_id);

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Writing Test</h2>

        {/* Flash messages */}
        {message && (
          <div className="alert alert-success mb-4">
            {message}
            <button
              onClick={() => setMessage('')}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <h3 className="font-semibold mb-3">Question:</h3>
          <p className="text-gray-700">{question?.question_text || 'N/A'}</p>
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-semibold">Difficulty: </span>
            <span>{question?.difficulty_level || 'N/A'}</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-semibold">Due: </span>
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-semibold">Teacher: </span>
            <span>{task.teacher_id}</span>
          </div>
          {submission && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Status: </span>
              <span>
                {submission.status === 0 && 'Draft'}
                {submission.status === 1 && 'Submitted'}
                {submission.status >= 2 && 'Graded'}
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
              disabled={submission?.status === 1}
            />
            <p className="text-sm text-gray-500 mt-2">
              Character count: {content.length}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || submission?.status === 1}
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors btn-hover-scale disabled:opacity-50"
            >
              {loading ? 'Submitting...' : submission?.status === 1 ? 'Already Submitted' : 'Submit Test'}
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submission?.status === 1}
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

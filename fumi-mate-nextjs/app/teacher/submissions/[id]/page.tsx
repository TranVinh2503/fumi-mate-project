'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSubmissionById } from '@/lib/mockData';
import { Submission } from '@/lib/types';
import { parseJSON } from '@/lib/utils';

interface FeedbackData {
  grade?: string;
  feedbackText?: string;
  actionPlan?: string[];
  practiceExercises?: Array<{
    title: string;
    description: string;
    example?: string;
  }>;
  detailedAnalysis?: {
    grammar?: { score: number; issues?: string[]; suggestions?: string[] };
    vocabulary?: { score: number; strengths?: string[]; improvements?: string[] };
    structure?: { score: number; comments?: string };
    fluency?: { score: number; feedback?: string };
    content?: { score: number; feedback?: string };
  };
  overallScore?: number;
}

export default function TeacherGradeSubmissionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const submissionId = parseInt(params.id);
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [aiFeedback, setAiFeedback] = useState<FeedbackData>({});
  const [teacherScore, setTeacherScore] = useState('');
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // TODO: Fetch submission from Flask API
    // const response = await fetch(`/api/teacher/submissions/${submissionId}`);
    // const data = await response.json();
    // setSubmission(data);
    
    const foundSubmission = getSubmissionById(submissionId);
    setSubmission(foundSubmission || null);
    
    if (foundSubmission) {
      setTeacherScore(foundSubmission.teacherScore?.toString() || '');
      setTeacherFeedback(foundSubmission.teacherFeedback || '');
      
      if (foundSubmission.aiFeedback) {
        const parsed = parseJSON<FeedbackData>(foundSubmission.aiFeedback, {});
        setAiFeedback(parsed);
      }
    }
  }, [submissionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const score = parseInt(teacherScore);
    if (isNaN(score) || score < 0 || score > 100) {
      setMessage('Please enter a valid score between 0 and 100');
      return;
    }
    
    // TODO: Submit grade to Flask API
    // const response = await fetch(`/api/teacher/grade-submission/${submissionId}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ teacherScore: score, teacherFeedback }),
    // });
    
    console.log('Grading submission:', {
      submissionId,
      teacherScore: score,
      teacherFeedback,
      timestamp: new Date().toISOString(),
    });
    
    setMessage('✅ Grade submitted successfully!');
    setTimeout(() => {
      router.push('/teacher/submissions');
    }, 1500);
  };

  if (!submission) {
    return (
      <div className="container mx-auto section-padding text-center">
        <p className="text-xl text-gray-600">Loading submission...</p>
      </div>
    );
  }

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold">Grade Submission</h2>
          <Link
            href="/teacher/submissions"
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Submissions
          </Link>
        </div>

        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'} mb-6`}>
            {message}
          </div>
        )}

        {/* Student Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student</p>
              <p className="font-semibold text-lg">
                {submission.student?.username || `Student ${submission.studentId}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Task</p>
              <p className="font-semibold text-lg">{submission.task?.title || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Score</p>
              <p className="font-semibold text-lg text-blue-600">
                {submission.aiScore || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Student's Writing */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h5 className="text-2xl font-semibold mb-4">Student's Writing</h5>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {submission.content}
            </p>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Character count: {submission.content.length}
          </div>
        </div>

        {/* AI Feedback Reference */}
        {aiFeedback.feedbackText && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
            <h5 className="text-xl font-semibold mb-3">🤖 AI Feedback (Reference)</h5>
            <p className="text-gray-700 mb-4">{aiFeedback.feedbackText}</p>
            {aiFeedback.grade && (
              <p className="text-sm text-gray-600">AI Grade: <span className="font-semibold">{aiFeedback.grade}</span></p>
            )}
          </div>
        )}

        {/* Grading Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <h5 className="text-2xl font-semibold mb-6">Your Grading</h5>
          
          <div className="mb-6">
            <label htmlFor="teacherScore" className="block text-lg font-semibold mb-3">
              Score (0-100) *
            </label>
            <input
              type="number"
              id="teacherScore"
              value={teacherScore}
              onChange={(e) => setTeacherScore(e.target.value)}
              className="custom-input"
              min="0"
              max="100"
              placeholder="Enter score (0-100)"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              AI suggested score: {submission.aiScore || 'N/A'}
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="teacherFeedback" className="block text-lg font-semibold mb-3">
              Your Feedback *
            </label>
            <textarea
              id="teacherFeedback"
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
              className="custom-textarea"
              rows={10}
              placeholder="Provide detailed feedback to help the student improve..."
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Be specific and constructive. Highlight both strengths and areas for improvement.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors btn-hover-scale"
            >
              Submit Grade
            </button>
            <Link
              href="/teacher/submissions"
              className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* AI Detailed Analysis (Collapsible) */}
        {aiFeedback.detailedAnalysis && (
          <details className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <summary className="text-xl font-semibold cursor-pointer hover:text-primary">
              📊 View AI Detailed Analysis
            </summary>
            <div className="mt-4 space-y-4">
              {aiFeedback.detailedAnalysis.grammar && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h6 className="font-semibold mb-2">Grammar: {aiFeedback.detailedAnalysis.grammar.score}</h6>
                  {aiFeedback.detailedAnalysis.grammar.issues && (
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {aiFeedback.detailedAnalysis.grammar.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {aiFeedback.detailedAnalysis.vocabulary && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h6 className="font-semibold mb-2">Vocabulary: {aiFeedback.detailedAnalysis.vocabulary.score}</h6>
                  {aiFeedback.detailedAnalysis.vocabulary.strengths && (
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {aiFeedback.detailedAnalysis.vocabulary.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}

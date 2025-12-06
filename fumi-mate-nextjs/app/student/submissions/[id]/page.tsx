'use client';

import { useState, useEffect } from 'react';
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

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const submissionId = parseInt(params.id);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData>({});

  useEffect(() => {
    // TODO: Fetch submission from Flask API
    // const response = await fetch(`/api/student/submissions/${submissionId}`);
    // const data = await response.json();
    // setSubmission(data);
    
    const foundSubmission = getSubmissionById(submissionId);
    setSubmission(foundSubmission || null);
    
    if (foundSubmission?.aiFeedback) {
      const parsedFeedback = parseJSON<FeedbackData>(foundSubmission.aiFeedback, {});
      setFeedback(parsedFeedback);
    }
  }, [submissionId]);

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
          <h2 className="text-4xl font-bold">
            {submission.task?.title || 'Submission Detail'}
          </h2>
          <Link
            href="/student/submissions"
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Submissions
          </Link>
        </div>

        {/* Your Writing */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h5 className="text-2xl font-semibold mb-4">Your Writing</h5>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {submission.content}
            </p>
          </div>
        </div>

        {/* Scores */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h5 className="text-2xl font-semibold mb-4">Scores & Feedback</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">AI Score</p>
              <p className="text-3xl font-bold text-blue-600">
                {submission.aiScore || '—'}
              </p>
              {feedback.grade && (
                <p className="text-lg text-gray-700 mt-2">Grade: {feedback.grade}</p>
              )}
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Teacher Score</p>
              <p className="text-3xl font-bold text-green-600">
                {submission.teacherScore || '—'}
              </p>
            </div>
          </div>

          {/* AI Feedback */}
          {feedback.feedbackText && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h6 className="font-semibold text-lg mb-2">📣 AI Feedback</h6>
              <p className="text-gray-700 leading-relaxed">{feedback.feedbackText}</p>
            </div>
          )}

          {/* Teacher Feedback */}
          {submission.teacherFeedback && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h6 className="font-semibold text-lg mb-2">👨‍🏫 Teacher Feedback</h6>
              <p className="text-gray-700 leading-relaxed">{submission.teacherFeedback}</p>
            </div>
          )}
        </div>

        {/* Action Plan */}
        {feedback.actionPlan && feedback.actionPlan.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h5 className="text-2xl font-semibold mb-4">✅ Action Plan</h5>
            <ul className="space-y-3">
              {feedback.actionPlan.map((step, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Practice Exercises */}
        {feedback.practiceExercises && feedback.practiceExercises.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h5 className="text-2xl font-semibold mb-4">🧠 Practice Exercises</h5>
            <div className="space-y-4">
              {feedback.practiceExercises.map((exercise, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg">
                  <h6 className="font-semibold text-lg mb-2">{exercise.title}</h6>
                  <p className="text-gray-700 mb-2">{exercise.description}</p>
                  {exercise.example && (
                    <pre className="bg-white p-3 rounded border border-blue-200 text-sm overflow-x-auto">
                      <code>{exercise.example}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Analysis */}
        {feedback.detailedAnalysis && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h5 className="text-2xl font-semibold mb-4">🔍 Detailed Analysis</h5>
            <div className="space-y-6">
              {/* Grammar */}
              {feedback.detailedAnalysis.grammar && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-semibold text-lg">Grammar</h6>
                    <span className="text-2xl font-bold text-purple-600">
                      {feedback.detailedAnalysis.grammar.score}
                    </span>
                  </div>
                  {feedback.detailedAnalysis.grammar.issues && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-gray-700">Issues:</p>
                      <ul className="list-disc list-inside text-gray-600 text-sm">
                        {feedback.detailedAnalysis.grammar.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.detailedAnalysis.grammar.suggestions && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-gray-700">Suggestions:</p>
                      <ul className="list-disc list-inside text-gray-600 text-sm">
                        {feedback.detailedAnalysis.grammar.suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Vocabulary */}
              {feedback.detailedAnalysis.vocabulary && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-semibold text-lg">Vocabulary</h6>
                    <span className="text-2xl font-bold text-green-600">
                      {feedback.detailedAnalysis.vocabulary.score}
                    </span>
                  </div>
                  {feedback.detailedAnalysis.vocabulary.strengths && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-gray-700">Strengths:</p>
                      <ul className="list-disc list-inside text-gray-600 text-sm">
                        {feedback.detailedAnalysis.vocabulary.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.detailedAnalysis.vocabulary.improvements && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-gray-700">Areas for Improvement:</p>
                      <ul className="list-disc list-inside text-gray-600 text-sm">
                        {feedback.detailedAnalysis.vocabulary.improvements.map((improvement, i) => (
                          <li key={i}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Structure, Fluency, Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {feedback.detailedAnalysis.structure && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h6 className="font-semibold mb-2">Structure</h6>
                    <p className="text-2xl font-bold text-yellow-600 mb-2">
                      {feedback.detailedAnalysis.structure.score}
                    </p>
                    {feedback.detailedAnalysis.structure.comments && (
                      <p className="text-sm text-gray-600">{feedback.detailedAnalysis.structure.comments}</p>
                    )}
                  </div>
                )}

                {feedback.detailedAnalysis.fluency && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h6 className="font-semibold mb-2">Fluency</h6>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {feedback.detailedAnalysis.fluency.score}
                    </p>
                    {feedback.detailedAnalysis.fluency.feedback && (
                      <p className="text-sm text-gray-600">{feedback.detailedAnalysis.fluency.feedback}</p>
                    )}
                  </div>
                )}

                {feedback.detailedAnalysis.content && (
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <h6 className="font-semibold mb-2">Content</h6>
                    <p className="text-2xl font-bold text-pink-600 mb-2">
                      {feedback.detailedAnalysis.content.score}
                    </p>
                    {feedback.detailedAnalysis.content.feedback && (
                      <p className="text-sm text-gray-600">{feedback.detailedAnalysis.content.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

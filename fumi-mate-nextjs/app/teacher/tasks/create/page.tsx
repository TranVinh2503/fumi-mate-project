'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';

interface Question {
  id: number;
  questionText: string;
  questionType: string;
  hint: string;
  sampleAnswer: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'N5',
    dueDate: '',
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [message, setMessage] = useState('');

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      questionText: '',
      questionType: 'writing',
      hint: '',
      sampleAnswer: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: number, field: keyof Question, value: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Submit to Flask API
    // const response = await fetch('/api/teacher/tasks', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ...formData, questions }),
    // });
    
    console.log('Creating task:', {
      ...formData,
      questions,
      createdAt: new Date().toISOString(),
    });
    
    setMessage('✅ Task created successfully!');
    setTimeout(() => {
      router.push('/teacher/tasks');
    }, 1500);
  };

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold">Create New Task</h2>
          <Link
            href="/teacher/tasks"
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Tasks
          </Link>
        </div>

        {message && (
          <div className="alert alert-success mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Basic Information</h3>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="custom-input"
                placeholder="e.g., N5 Kanji Writing Practice"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="custom-textarea"
                rows={4}
                placeholder="Describe the task objectives and requirements..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty Level *
                </label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="custom-select"
                  required
                >
                  <option value="N5">N5 (Beginner)</option>
                  <option value="N4">N4 (Elementary)</option>
                  <option value="N3">N3 (Intermediate)</option>
                  <option value="N2">N2 (Upper Intermediate)</option>
                  <option value="N1">N1 (Advanced)</option>
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="custom-input"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No questions added yet.</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-primary hover:underline"
                >
                  Click "Add Question" to create your first question
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-lg">Question {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Question Text *
                        </label>
                        <textarea
                          value={question.questionText}
                          onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                          className="custom-textarea"
                          rows={3}
                          placeholder="Enter the question..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Question Type
                        </label>
                        <select
                          value={question.questionType}
                          onChange={(e) => updateQuestion(question.id, 'questionType', e.target.value)}
                          className="custom-select"
                        >
                          <option value="writing">Writing</option>
                          <option value="kanji">Kanji</option>
                          <option value="translation">Translation</option>
                          <option value="essay">Essay</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Hint (Optional)
                        </label>
                        <input
                          type="text"
                          value={question.hint}
                          onChange={(e) => updateQuestion(question.id, 'hint', e.target.value)}
                          className="custom-input"
                          placeholder="Provide a helpful hint..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sample Answer (Optional)
                        </label>
                        <textarea
                          value={question.sampleAnswer}
                          onChange={(e) => updateQuestion(question.id, 'sampleAnswer', e.target.value)}
                          className="custom-textarea"
                          rows={2}
                          placeholder="Provide a sample answer..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors btn-hover-scale"
            >
              Create Task
            </button>
            <Link
              href="/teacher/tasks"
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

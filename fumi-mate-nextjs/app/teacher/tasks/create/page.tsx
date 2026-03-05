'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Search } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/apiConfig';
interface QuestionBankItem {
  id: number;
  genre: string;
  topic: string;
  content: string;
  level: string;
  required_points: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'N5',
    dueDate: '',
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionBankItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch question bank on component mount
  useEffect(() => {
    const fetchQuestionBank = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const res = await fetch(API_ENDPOINTS.QUESTION_QUERY, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await res.json();
        setQuestionBank(data.questions);
        setFilteredQuestions(data.questions);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionBank();
  }, []);

  // Filter questions based on search and filters
  useEffect(() => {
    let filtered = questionBank;

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (genreFilter) {
      filtered = filtered.filter(q => q.genre === genreFilter);
    }

    if (levelFilter) {
      filtered = filtered.filter(q => q.level === levelFilter);
    }

    setFilteredQuestions(filtered);
  }, [questionBank, searchTerm, genreFilter, levelFilter]);

  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestionIds(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedQuestionIds.length === 0) {
      setMessage('Please select at least one question.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        dueDate: formData.dueDate || null,
        questionBankIds: selectedQuestionIds
      };

      const response = await fetch(API_ENDPOINTS.TEACHER_CREATE_TASK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const data = await response.json();
      setMessage('✅ Task created successfully!');
      setTimeout(() => {
        router.push('/teacher/tasks');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating task:', err);
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-title font-bold">Create New Task</h2>
        </div>

        {message && (
          <div className="alert alert-success mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Basic Information</h3>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Task Title *
              </label>
              <input type="text" id="title" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="custom-input" placeholder="e.g., N5 Kanji Writing Practice" required
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

          {/* Question Bank Selection */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Select Questions from Question Bank</h3>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="custom-input pl-10"
                />
              </div>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="custom-select"
              >
                <option value="">All Genres</option>
                <option value="grammar">Grammar</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="kanji">Kanji</option>
                <option value="reading">Reading</option>
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="custom-select"
              >
                <option value="">All Levels</option>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>

            <p className="text-gray-600 mb-4">
              Selected: {selectedQuestionIds.length} question(s)
            </p>

            {/* Question List */}
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
              {loading ? (
                <p className="text-center text-gray-500">Loading questions...</p>
              ) : error ? (
                <p className="text-center text-red-500">{error}</p>
              ) : filteredQuestions.length === 0 ? (
                <p className="text-center text-gray-500">No questions found.</p>
              ) : (
                filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    onClick={() => toggleQuestionSelection(question.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedQuestionIds.includes(question.id)
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold">{question.content}</p>
                        <p className="text-sm text-gray-500">
                          {question.topic} • {question.level} • {question.genre}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button type="submit" className="bg-secondary text-white px-6 rounded-lg font-semibold hover:bg-primary transition-colors gap-2">
              Create Task
            </button>
            <Link href="/teacher/tasks" className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors inline-flex items-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

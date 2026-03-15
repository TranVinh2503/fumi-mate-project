'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Search, Users } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/apiConfig';

interface QuestionBankItem {
  id: number;
  subGenre?: {
    id: number;
    nameJp: string;
    nameVn: string;
  };
  subTopic?: {
    id: number;
    nameJp: string;
    nameVn: string;
  };
  content: string;
  level: number;
  required_points: string;
}

interface StudentItem {
  id: number;
  username: string;
  jlpt_level: string | null;
  total_points: number;
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
  
  // States filters
  const [genreFilter, setGenreFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState(''); // Đổi từ levelFilter sang topicFilter
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Student selection state
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [assignToAll, setAssignToAll] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch question bank and students on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Fetch questions
        const questionsRes = await fetch(API_ENDPOINTS.QUESTION_QUERY, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!questionsRes.ok) {
          throw new Error('Failed to fetch questions');
        }

        const questionsData = await questionsRes.json();
        setQuestionBank(questionsData.questions);
        setFilteredQuestions(questionsData.questions);
        
        // Fetch students
        setLoadingStudents(true);
        const studentsRes = await fetch(API_ENDPOINTS.TEACHER_STUDENTS, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.students || []);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingStudents(false);
      }
    };

    fetchData();
  }, []);

  // Bảng tra cứu mapping Thể loại
  const GENRE_MAPPING: Record<string, string[]> = {
    '手紙': ['お礼状', '問い合わせ状', '助言書'],
    'スピーチ': ['ある話題について話す', '経験について語る'],
    '意見・感想': ['作品についての考察', '問題を分析し、解決策を提案する', '視点を比較して選択する']
  };

  // Bảng tra cứu mapping Chủ đề (dựa vào file seed)
  const TOPIC_MAPPING: Record<string, string[]> = {
    '観光': ['ホームステイ'],
    '友人': ['同級生', '思いやりと励ましを示す'],
    '教育': ['キャリアガイダンス', '学業上のプレッシャー'],
    '文化と芸術': ['膜', '映画'],
    'ライフスタイル': ['学生生活', 'ライフスタイル'],
    '社会': ['人間の価値観'],
    '自己': ['人生哲学', '失敗と成長']
  };

  // Filter questions based on search and filters
  useEffect(() => {
    let filtered = questionBank;

    // Lọc theo search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.subTopic?.nameJp?.toLowerCase().includes(lowerSearch) ||
        q.subTopic?.nameVn?.toLowerCase().includes(lowerSearch) ||
        q.content?.toLowerCase().includes(lowerSearch)
      );
    }

    // Lọc theo Genre
    if (genreFilter) {
      const allowedSubGenres = GENRE_MAPPING[genreFilter] || [];
      filtered = filtered.filter(q => 
        q.subGenre?.nameJp && allowedSubGenres.includes(q.subGenre.nameJp)
      );
    }

    // Lọc theo Topic
    if (topicFilter) {
      const allowedSubTopics = TOPIC_MAPPING[topicFilter] || [];
      filtered = filtered.filter(q => 
        q.subTopic?.nameJp && allowedSubTopics.includes(q.subTopic.nameJp)
      );
    }

    setFilteredQuestions(filtered);
  }, [questionBank, searchTerm, genreFilter, topicFilter]);

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

    if (!assignToAll && selectedStudentIds.length === 0) {
      setMessage('Please select at least one student or check "Assign to all students".');
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
        questionBankIds: selectedQuestionIds,
        studentIds: assignToAll ? [] : selectedStudentIds
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
          <div className={`alert mb-6 p-4 rounded-lg font-semibold ${message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Basic Information</h3>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Task Title *
              </label>
              <input type="text" id="title" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="custom-input w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="e.g., N5 Kanji Writing Practice" required
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
                className="custom-textarea w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="custom-select w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="custom-input w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Question Bank Selection */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Select Questions</h3>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="custom-input w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Lọc theo Thể loại (Genre) */}
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="custom-select p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Genres</option>
                <option value="手紙">手紙 (Thư)</option>
                <option value="スピーチ">スピーチ (Phát biểu)</option>
                <option value="意見・感想">意見・感想 (Ý kiến/Cảm nghĩ)</option>
              </select>

              {/* Lọc theo Chủ đề (Topic) */}
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="custom-select p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Topics</option>
                <option value="観光">観光 (Du lịch)</option>
                <option value="友人">友人 (Bạn bè)</option>
                <option value="教育">教育 (Giáo dục)</option>
                <option value="文化と芸術">文化と芸術 (Văn hóa - Nghệ thuật)</option>
                <option value="ライフスタイル">ライフスタイル (Lối sống)</option>
                <option value="社会">社会 (Xã hội)</option>
                <option value="自己">自己 (Bản thân)</option>
              </select>
            </div>

            <p className="text-gray-600 mb-4 font-medium">
              Selected: <span className="text-blue-600 font-bold">{selectedQuestionIds.length}</span> question(s)
            </p>

            {/* Question List */}
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {loading ? (
                <p className="text-center text-gray-500 py-4">Loading questions...</p>
              ) : error ? (
                <p className="text-center text-red-500 py-4">{error}</p>
              ) : filteredQuestions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No questions found.</p>
              ) : (
                filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    onClick={() => toggleQuestionSelection(question.id)}
                    className={`p-4 border bg-white rounded-lg cursor-pointer transition-colors ${
                      selectedQuestionIds.includes(question.id)
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        onClick={(e) => e.stopPropagation()} 
                        className="mt-1.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-2 leading-relaxed">
                          {question.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800">
                            Level {question.level}
                          </span>
                          {question.subGenre && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              {question.subGenre.nameJp} ({question.subGenre.nameVn})
                            </span>
                          )}
                          {question.subTopic && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800">
                              {question.subTopic.nameJp} ({question.subTopic.nameVn})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Student Assignment */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Assign to Students
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignToAll}
                  onChange={(e) => {
                    setAssignToAll(e.target.checked);
                    if (e.target.checked) {
                      setSelectedStudentIds([]);
                    }
                  }}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <span className="font-medium text-gray-800">Assign to all students</span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-8">
                If checked, all students can see this task. If not, select specific students below.
              </p>
            </div>

            {!assignToAll && (
              <div>
                <p className="text-gray-600 mb-4 font-medium">
                  Selected: <span className="text-green-600 font-bold">{selectedStudentIds.length}</span> student(s)
                </p>
                
                {loadingStudents ? (
                  <p className="text-center text-gray-500">Loading students...</p>
                ) : students.length === 0 ? (
                  <p className="text-center text-gray-500">No students found.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudentIds(prev =>
                            prev.includes(student.id)
                              ? prev.filter(id => id !== student.id)
                              : [...prev, student.id]
                          );
                        }}
                        className={`p-3 border bg-white rounded-lg cursor-pointer transition-colors ${
                          selectedStudentIds.includes(student.id)
                            ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => {
                              setSelectedStudentIds(prev =>
                                prev.includes(student.id)
                                  ? prev.filter(id => id !== student.id)
                                  : [...prev, student.id]
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-4 h-4 text-green-600 rounded cursor-pointer"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">{student.username}</p>
                            <p className="text-sm text-gray-500">
                              JLPT Level: {student.jlpt_level || 'N/A'} • Points: {student.total_points}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Task
            </button>
            <Link href="/teacher/tasks" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-flex items-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
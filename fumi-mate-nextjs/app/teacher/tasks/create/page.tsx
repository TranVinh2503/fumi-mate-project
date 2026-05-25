'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Genre, Topic } from '@/lib/types';
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

const WRITING_TASK_TYPES = [
  { id: 0, label: 'Pre/Post test - アルバイトは学業にとって有益か' },
  { id: 1, label: 'Thư - Cảm ơn gia đình homestay' },
  { id: 2, label: 'Thư - Hỏi thăm bạn bị ốm' },
  { id: 3, label: 'Thư - Tư vấn ngành tiếng Nhật' },
  { id: 4, label: 'Speech - Câu nói có ảnh hưởng' },
  { id: 5, label: 'Speech - Trải nghiệm thất bại' },
  { id: 6, label: 'Speech - Đánh giá qua ngoại hình' },
  { id: 7, label: 'Opinion - Cảm nghĩ về phim' },
  { id: 8, label: 'Opinion - Stress của sinh viên' },
  { id: 9, label: 'Opinion - Sống một mình hay cùng gia đình' },
];

export default function CreateTaskPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'N5',
    dueDate: '',
    taskTypeId: 0,
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionBankItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States filters
  const [genreFilter, setGenreFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState(''); // Đổi từ levelFilter sang topicFilter

  // Dynamic genres and topics
  const [genres, setGenres] = useState<Genre[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  
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

        // Fetch genres
        setGenresLoading(true);
        const genresRes = await fetch(API_ENDPOINTS.ADMIN_GENRES, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (genresRes.ok) {
          const genresData = await genresRes.json();
          setGenres(genresData.genres || []);
          console.log(genresData.genres);
        }
        setGenresLoading(false);

        // Fetch topics
        setTopicsLoading(true);
        const topicsRes = await fetch(API_ENDPOINTS.ADMIN_TOPICS, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (topicsRes.ok) {
          const topicsData = await topicsRes.json();
          setTopics(topicsData.topics || []);
        }
        setTopicsLoading(false);

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
        setLoadingStudents(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); 

  // Dynamic mappings from fetched data
  const genreMapping = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    genres.forEach(g => {
      if (g.parent_id === 0) {
        mapping[g.name_jp] = genres
          .filter(sub => sub.parent_id === g.id)
          .map(sub => sub.name_jp);
      }
    });
    return mapping;
  }, [genres]);

  const topicMapping = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    topics.forEach(t => {
      if (t.parent_id === 0) {
        mapping[t.name_jp] = topics
          .filter(sub => sub.parent_id === t.id)
          .map(sub => sub.name_jp);
      }
    });
    return mapping;
  }, [topics]);

  // Main genres and topics for dropdowns
  const mainGenres = useMemo(() => genres.filter(g => g.parent_id === 0), [genres]);
  const mainTopics = useMemo(() => topics.filter(t => t.parent_id === 0), [topics]);

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
      const allowedSubGenres = genreMapping[genreFilter] || [];
      filtered = filtered.filter(q => 
        q.subGenre?.nameJp && allowedSubGenres.includes(q.subGenre.nameJp)
      );
    }

    // Lọc theo Topic
    if (topicFilter) {
      const allowedSubTopics = topicMapping[topicFilter] || [];
      filtered = filtered.filter(q => 
        q.subTopic?.nameJp && allowedSubTopics.includes(q.subTopic.nameJp)
      );
    }

    setFilteredQuestions(filtered);
  }, [questionBank, searchTerm, genreFilter, topicFilter, genreMapping, topicMapping]);

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
      setMessage('Hãy chọn ít nhất 1 câu hỏi');
      return;
    }

    if (!assignToAll && selectedStudentIds.length === 0) {
      setMessage('Hãy chọn ít nhất 1 học sinh hoặc tick chọn tất cả.');
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
        taskTypeId: formData.taskTypeId,
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
        throw new Error(errorData.error || 'Tạo bài tập thất bại');
      }

      setMessage('✅ Tạo bài tập thành công');
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
          <h2 className="text-4xl font-title font-bold">Tạo bài tập mới</h2>
        </div>

        {message && (
          <div className={`alert mb-6 p-4 rounded-lg font-semibold ${message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
          {/* Thông tin cơ bản */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Thông tin cơ bản</h3>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Tiêu đề bài tập *
              </label>
              <input type="text" id="title" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="custom-input w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="VD: Luyện viết Kanji N5" required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Mô tả bài tập *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="custom-textarea w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={4}
                placeholder="Mô tả mục tiêu và yêu cầu của bài tập..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-semibold text-gray-700 mb-2">
                  Cấp độ
                </label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="custom-select w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {['N5', 'N4', 'N3', 'N2', 'N1'].map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Hạn chót nộp bài
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

            <div className="mt-4">
              <label htmlFor="taskTypeId" className="block text-sm font-semibold text-gray-700 mb-2">
                Loại đề dùng cho AI chấm rubric
              </label>
              <select
                id="taskTypeId"
                value={formData.taskTypeId}
                onChange={(e) => setFormData({ ...formData, taskTypeId: Number(e.target.value) })}
                className="custom-select w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {WRITING_TASK_TYPES.map(taskType => (
                  <option key={taskType.id} value={taskType.id}>
                    {taskType.id}. {taskType.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                AI dùng lựa chọn này để kiểm tra yêu cầu đề và chấm theo rubric 7 tiêu chí.
              </p>
            </div>
          </div>

          {/* Chọn câu hỏi từ ngân hàng câu hỏi */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Chọn câu hỏi</h3>
            
            {/* Tìm kiếm và Bộ lọc */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi..."
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
                <option value="">Tất cả thể loại</option>
                {genresLoading ? (
                  <option>Đang tải...</option>
                ) : mainGenres.map(genre => (
                  <option key={genre.id} value={genre.name_jp}>{genre.name_jp} ({genre.name_vn})</option>
                ))}
              </select>

              {/* Lọc theo Chủ đề (Topic) */}
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="custom-select p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Tất cả chủ đề</option>
                {topicsLoading ? (
                  <option>Đang tải...</option>
                ) : mainTopics.map(topic => (
                  <option key={topic.id} value={topic.name_jp}>{topic.name_jp} ({topic.name_vn})</option>
                ))}
              </select>
            </div>

            <p className="text-gray-600 mb-4 font-medium">
              Đã chọn: <span className="text-blue-600 font-bold">{selectedQuestionIds.length}</span> câu hỏi
            </p>

            {/* Danh sách câu hỏi */}
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {loading ? (
                <p className="text-center text-gray-500 py-4">Đang tải câu hỏi...</p>
              ) : error ? (
                <p className="text-center text-red-500 py-4">{error}</p>
              ) : filteredQuestions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Không tìm thấy câu hỏi nào.</p>
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
                            Cấp độ {question.level}
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

          {/* Giao bài cho học sinh */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Giao bài cho học sinh
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
                <span className="font-medium text-gray-800">Giao cho tất cả học sinh</span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-8">
                Nếu chọn, tất cả học sinh đều có thể xem bài tập này. Nếu không, hãy chọn từng học sinh cụ thể bên dưới.
              </p>
            </div>

            {!assignToAll && (
              <div>
                <p className="text-gray-600 mb-4 font-medium">
                  Đã chọn: <span className="text-green-600 font-bold">{selectedStudentIds.length}</span> học sinh
                </p>
                
                {loadingStudents ? (
                  <p className="text-center text-gray-500">Đang tải danh sách học sinh...</p>
                ) : students.length === 0 ? (
                  <p className="text-center text-gray-500">Không tìm thấy học sinh nào.</p>
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
                              Cấp độ JLPT: {student.jlpt_level || 'Chưa có'} • Điểm tích lũy: {student.total_points}
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

          {/* Nút gửi đi */}
          <div className="flex gap-4">
            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Tạo bài tập
            </button>
            <Link href="/teacher/tasks" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-flex items-center">
              Hủy bỏ
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

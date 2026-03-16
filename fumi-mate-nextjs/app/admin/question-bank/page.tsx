'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, AlertCircle, X } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/apiConfig";

interface Genre {
  id: number;
  name_jp: string;
  name_vn: string;
  parent_id: number;
}

interface Topic {
  id: number;
  name_jp: string;
  name_vn: string;
  parent_id: number;
}

interface Question {
  id: number;
  sub_genre_id: number;
  sub_topic_id: number;
  content: string;
  level: number;
  required_points: string;
  similarity_hash: string;
}

export default function AdminQuestionBank() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Form states
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newGenre, setNewGenre] = useState({ name_jp: "", name_vn: "", parent_id: 0, id: "" });
  const [newTopic, setNewTopic] = useState({ name_jp: "", name_vn: "", parent_id: 0, id: "" });
  const [formData, setFormData] = useState({
    sub_genre_id: "",
    sub_topic_id: "",
    level: "3",
    content: "",
    required_points: ""
  });

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);

      const [genresRes, topicsRes, questionsRes] = await Promise.all([
        fetch(API_ENDPOINTS.ADMIN_GENRES, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_ENDPOINTS.ADMIN_TOPICS, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_ENDPOINTS.ADMIN_QUESTION_CREATE, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const genresData = await genresRes.json();
      const topicsData = await topicsRes.json();
      const questionsData = await questionsRes.json();

      setGenres(genresData.genres || []);
      setTopics(topicsData.topics || []);
      setQuestions(questionsData.questions || []);

      setLoading(false);
    } catch (error) {
      console.error("Load error:", error);
      setMessage("Failed to load data");
      setLoading(false);
    }
  };

  const createGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(API_ENDPOINTS.ADMIN_GENRES, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newGenre)
      });

      if (response.ok) {
        setMessage("✅ New genre created!");
        setShowGenreModal(false);
        setNewGenre({ name_jp: "", name_vn: "", parent_id: 0, id: "" });
        loadData();
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      setMessage("Failed to create genre");
    }
  };

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(API_ENDPOINTS.ADMIN_TOPICS, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTopic)
      });

      if (response.ok) {
        setMessage("✅ New topic created!");
        setShowTopicModal(false);
        setNewTopic({ name_jp: "", name_vn: "", parent_id: 0, id: "" });
        loadData();
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      setMessage("Failed to create topic");
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sub_genre_id || !formData.sub_topic_id || !formData.content.trim()) {
      setMessage("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(API_ENDPOINTS.ADMIN_QUESTION_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage("✅ Question created successfully!");
        setFormData({
          sub_genre_id: "",
          sub_topic_id: "",
          level: "3",
          content: "",
          required_points: ""
        });
        loadData();
      } else {
        const errorData = await response.json();
        setMessage(`❌ ${errorData.error || "Failed to create question"}`);
      }
    } catch (error) {
      setMessage("❌ Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center p-12">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-indigo-600" />
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-gray-700">Loading your data...</p>
            <p className="text-gray-500">Genres, topics, and questions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100/50 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
              <div>
                <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 leading-tight">
                  Admin Question Bank
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-prose">
                  Full CRUD for questions, genres & topics. Live preview & instant updates.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowGenreModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 text-lg whitespace-nowrap"
                >
                  ➕ New Genre
                </button>
                <button
                  onClick={() => setShowTopicModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 text-lg whitespace-nowrap"
                >
                  ➕ New Topic
                </button>
                <Link 
                  href="/admin"
                  className="px-8 py-3 bg-white/80 text-gray-800 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-lg border border-gray-200 backdrop-blur-sm"
                >
                  ← Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-6 rounded-3xl mb-8 shadow-xl font-semibold flex items-center gap-4 mx-auto max-w-4xl ${
              message.includes("✅") 
                ? "bg-emerald-100 border-4 border-emerald-200 text-emerald-800" 
                : "bg-red-100 border-4 border-red-200 text-red-800"
            }`}>
              {message}
              <button 
                onClick={() => setMessage("")}
                className="ml-auto p-1 hover:bg-white/50 rounded-full transition-colors -m-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Forms Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Question Form */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/50">
              <h2 className="text-3xl font-black mb-10 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                ➕ Create Question
              </h2>
              <form onSubmit={handleQuestionSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-4">
                    Sub Genre *
                  </label>
                  <select
                    value={formData.sub_genre_id}
                    onChange={(e) => setFormData({ ...formData, sub_genre_id: e.target.value })}
                    className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg hover:shadow-xl bg-white/50 backdrop-blur-sm text-lg"
                    required
                  >
                    <option value="">Select Genre...</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name_jp} ({genre.name_vn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-4">
                    Sub Topic *
                  </label>
                  <select
                    value={formData.sub_topic_id}
                    onChange={(e) => setFormData({ ...formData, sub_topic_id: e.target.value })}
                    className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg hover:shadow-xl bg-white/50 backdrop-blur-sm text-lg"
                    required
                  >
                    <option value="">Select Topic...</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name_jp} ({topic.name_vn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-4">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg hover:shadow-xl bg-white/50 backdrop-blur-sm text-lg"
                    required
                  >
                    <option value="3">N3</option>
                    <option value="2">N2</option>
                    <option value="4">N4</option>
                    <option value="1">N1</option>
                    <option value="5">N5</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-lg font-bold text-gray-800 mb-4">
                    Question Content * (日本語)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="日本で1週間ホームステイしました。お世話になったホストファミリーに手紙を書きなさい..."
                    rows={5}
                    className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500 focus:border-transparent resize-none text-lg shadow-lg hover:shadow-xl bg-white/50 backdrop-blur-sm transition-all font-serif"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-4">
                    Required Points (optional)
                  </label>
                  <textarea
                    value={formData.required_points}
                    onChange={(e) => setFormData({ ...formData, required_points: e.target.value })}
                    placeholder="• 思い出2つ以上
• 感謝の気持ち
• 再会希望"
                    rows={4}
                    className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500 focus:border-transparent resize-vertical text-lg shadow-lg hover:shadow-xl bg-white/50 backdrop-blur-sm transition-all font-mono"
                  />
                </div>

                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white py-6 px-12 rounded-3xl font-black text-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin group-hover:animate-spin-reverse" />
                        <span>Creating Question...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span>Create New Question</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Questions List */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
              <h2 className="text-3xl font-black mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                📋 Recent Questions ({questions.length})
              </h2>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {questions.slice(0, 12).map((q) => (
                  <div key={q.id} className="group p-6 bg-gradient-to-r from-white/70 to-indigo-50/50 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1">
                    <div className="flex gap-3 mb-4 flex-wrap">
                      <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-xl font-bold text-sm shadow-sm">
                        ID {q.id}
                      </span>
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm shadow-sm">
                        G{q.sub_genre_id}
                      </span>
                      <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-xl font-bold text-sm shadow-sm">
                        T{q.sub_topic_id}
                      </span>
                      <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-bold text-sm shadow-sm">
                        L{q.level}
                      </span>
                    </div>
                    <p className="text-lg leading-relaxed text-gray-800 mb-4 line-clamp-3 font-medium">
                      {q.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span>Points: {JSON.parse(q.required_points || '[]').length || 0}</span>
                      <span className="font-mono bg-gray-100 px-3 py-1 rounded-full text-xs truncate max-w-[120px]">
                        {q.similarity_hash.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))}
                {questions.length === 0 && (
                  <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-3xl bg-gradient-to-r from-gray-50 to-blue-50/30">
                    <Plus className="w-24 h-24 mx-auto mb-8 text-gray-400" />
                    <h3 className="text-2xl font-bold text-gray-500 mb-4">No Questions Yet</h3>
                    <p className="text-lg text-gray-500 mb-8">Create your first question above!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Genre Modal */}
        {showGenreModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 w-full max-w-lg shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  ➕ New Genre
                </h3>
                <button 
                  onClick={() => setShowGenreModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={createGenre} className="space-y-6">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Fixed ID (optional)</label>
                  <input
                    type="number"
                    value={newGenre.id}
                    onChange={(e) => setNewGenre({ ...newGenre, id: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="e.g. 12 for new sub-genre"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Tên Nhật (JP) *</label>
                  <input
                    type="text"
                    value={newGenre.name_jp}
                    onChange={(e) => setNewGenre({ ...newGenre, name_jp: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Tên Việt (VN) *</label>
                  <input
                    type="text"
                    value={newGenre.name_vn}
                    onChange={(e) => setNewGenre({ ...newGenre, name_vn: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Parent ID (0 = main)</label>
                  <input
                    type="number"
                    value={newGenre.parent_id}
                    onChange={(e) => setNewGenre({ ...newGenre, parent_id: parseInt(e.target.value) || 0 })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="0 for main genre"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 rounded-3xl font-black text-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all"
                >
                  ➕ Create Genre
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Topic Modal */}
        {showTopicModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 w-full max-w-lg shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  ➕ New Topic
                </h3>
                <button 
                  onClick={() => setShowTopicModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={createTopic} className="space-y-6">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Fixed ID (optional)</label>
                  <input
                    type="number"
                    value={newTopic.id}
                    onChange={(e) => setNewTopic({ ...newTopic, id: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all shadow-sm"
                    placeholder="e.g. 19 for new sub-topic"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Tên Nhật (JP) *</label>
                  <input
                    type="text"
                    value={newTopic.name_jp}
                    onChange={(e) => setNewTopic({ ...newTopic, name_jp: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Tên Việt (VN) *</label>
                  <input
                    type="text"
                    value={newTopic.name_vn}
                    onChange={(e) => setNewTopic({ ...newTopic, name_vn: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Parent ID (0 = main)</label>
                  <input
                    type="number"
                    value={newTopic.parent_id}
                    onChange={(e) => setNewTopic({ ...newTopic, parent_id: parseInt(e.target.value) || 0 })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all shadow-sm"
                    placeholder="0 for main topic"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-3xl font-black text-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all"
                >
                  ➕ Create Topic
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

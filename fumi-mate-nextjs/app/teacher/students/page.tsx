'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockApi } from '@/lib/mockApi';
import { User } from '@/lib/types';
import { Users, Mail, Calendar } from 'lucide-react';

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const allUsers = await mockApi.getUsers();
        const studentUsers = allUsers.filter(user => user.user_type === 'student');
        setStudents(studentUsers);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto section-padding mt-5 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold">Student Management</h2>
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-5 h-5" />
          <span>{students.length} students</span>
        </div>
      </div>

      {students.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-500">ID: {student.id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{student.id}@school.edu</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Joined recently</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/teacher/students/${student.id}`}
                  className="w-full bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition-colors text-center block"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-12 bg-white rounded-lg shadow-lg p-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-6">No students found.</p>
          <p className="text-gray-400">Students will appear here once they join your classes.</p>
        </div>
      )}
    </section>
  );
}

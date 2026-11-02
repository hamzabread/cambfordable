"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle } from "lucide-react";
import { getApiError } from "@/lib/portal";
import DeleteUserCard from "./DeleteUserCard";

interface User {
  id: number;
  username: string;
  full_name?: string | null;
  email: string;
  is_admin: boolean;
  is_ta: boolean;
  payment?: boolean;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface UserCourse {
  course_id: number;
  name: string;
  code: string;
}

const ManageAdminTA = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "ta" | "student" | null>(null);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [removingCourse, setRemovingCourse] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users and courses on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      const [usersRes, coursesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setError(null);
    } catch (err: any) {
      setError("Failed to load data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCourses = async (userId: number) => {
    try {
      const response = await axios.get<UserCourse[]>(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      setUserCourses(response.data);
    } catch {
      setUserCourses([]);
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(null);
    setSelectedCourse(null);
    setError(null);
    void loadUserCourses(user.id);
  };

  const removeFromCourse = async (courseId: number) => {
    if (!selectedUser) return;
    setRemovingCourse(courseId);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/unenroll`,
        { user_id: selectedUser.id, course_id: courseId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } },
      );
      setUserCourses((current) => current.filter((course) => course.course_id !== courseId));
      setSuccess(`${selectedUser.full_name || selectedUser.username} was removed from the course.`);
      setError(null);
    } catch (err: unknown) {
      setError(getApiError(err, "Failed to remove them from the course"));
    } finally {
      setRemovingCourse(null);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      setError("Please select a user and a role");
      return;
    }
    // TAs work inside specific courses; admins see everything.
    if (selectedRole === "ta" && !selectedCourse) {
      setError("Choose the course this TA will grade");
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem("access_token");

      // Update user role
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${selectedUser.id}/role`,
        {
          is_admin: selectedRole === "admin",
          is_ta: selectedRole === "ta",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const name = selectedUser.full_name || selectedUser.username;
      const roleLabel = selectedRole === "admin" ? "an admin" : selectedRole === "ta" ? "a TA" : "a student";
      if (selectedCourse && selectedRole !== "student") {
        try {
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/enroll`,
            { user_id: selectedUser.id, course_id: selectedCourse },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (enrollError: unknown) {
          // Already in the course is fine: the role change is what mattered.
          const detail = axios.isAxiosError(enrollError) ? enrollError.response?.data?.detail : null;
          if (detail !== "User already enrolled in this course") throw enrollError;
        }
        const courseName = courses.find((c) => c.id === selectedCourse)?.name;
        setSuccess(`${name} is now ${roleLabel} in ${courseName}.`);
      } else {
        setSuccess(`${name} is now ${roleLabel}.`);
      }

      // Reset form
      setSelectedUser(null);
      setSelectedRole(null);
      setSelectedCourse(null);
      setSearchTerm("");

      // Refresh users
      fetchData();

      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(getApiError(err, "Failed to assign role"));
    } finally {
      setUpdating(false);
    }
  };

  const handleTogglePayment = async () => {
    if (!selectedUser) {
      return;
    }

    setPaymentUpdating(true);
    try {
      const token = localStorage.getItem("access_token");
      const nextPayment = !selectedUser.payment;

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${selectedUser.id}/payment`,
        { payment: nextPayment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedUser({ ...selectedUser, payment: nextPayment });
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, payment: nextPayment } : u))
      );

      setSuccess(
        `✅ ${selectedUser.full_name || selectedUser.username} payment marked as ${nextPayment ? "paid" : "unpaid"}`
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update payment status");
    } finally {
      setPaymentUpdating(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* User Selection Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <label className="block text-sm font-bold text-slate-900 mb-4">
          👤 Select User
        </label>

        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
        />

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
            {filteredUsers.length > 0 ? (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className={`w-full text-left px-4 py-3 transition hover:bg-slate-50 ${
                      selectedUser?.id === user.id
                        ? "bg-blue-50 ring-1 ring-inset ring-blue-300"
                        : ""
                    }`}
                  >
                    <div className="font-semibold text-slate-900">
                      {user.full_name || user.username}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {user.username} • {user.email}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {user.is_admin
                        ? "Currently: Admin"
                        : user.is_ta
                        ? "Currently: TA"
                        : "Currently: Student"}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-slate-500">
                No users found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role and Course Selection */}
      {selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-900">💳 Payment Status</label>
                <p className="text-xs text-slate-500 mt-1">
                  Toggle whether this user is marked as paid.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTogglePayment}
                disabled={paymentUpdating}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition text-sm font-semibold ${
                  selectedUser.payment
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                    : "border-amber-500 text-amber-700 bg-amber-50"
                } ${paymentUpdating ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}`}
              >
                {paymentUpdating
                  ? "Updating..."
                  : selectedUser.payment
                  ? "Mark as unpaid"
                  : "Mark as paid"}
              </button>
            </div>
          </div>

          {userCourses.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:col-span-2">
              <p className="text-sm font-bold text-slate-900">Courses {selectedUser.full_name || selectedUser.username} is in</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {userCourses.map((course) => (
                  <li key={course.course_id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm text-slate-700">
                    {course.name} <span className="text-xs text-slate-400">{course.code}</span>
                    <button
                      type="button"
                      onClick={() => removeFromCourse(course.course_id)}
                      disabled={removingCourse === course.course_id}
                      aria-label={`Remove from ${course.name}`}
                      className="rounded-full px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {removingCourse === course.course_id ? "Removing…" : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Role Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-4">
              🎓 Select Role
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedRole("admin")}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedRole === "admin"
                    ? "border-purple-600 bg-purple-50"
                    : "border-slate-200 hover:border-purple-300"
                }`}
              >
                <div className="font-semibold text-slate-900">👨‍💼 Admin</div>
                <div className="text-xs text-slate-500 mt-1">
                  Full system access and course management
                </div>
              </button>
              <button
                onClick={() => setSelectedRole("ta")}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedRole === "ta"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="font-semibold text-slate-900">📚 Teaching Assistant</div>
                <div className="text-xs text-slate-500 mt-1">
                  Can grade assignments in assigned courses only
                </div>
              </button>
              <button
                onClick={() => setSelectedRole("student")}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedRole === "student"
                    ? "border-slate-700 bg-slate-50"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <div className="font-semibold text-slate-900">🎒 Student</div>
                <div className="text-xs text-slate-500 mt-1">
                  Removes admin and TA access; course enrollments stay as they are
                </div>
              </button>
            </div>
          </div>

          {/* Course Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-4">
              📖 Select Course {selectedRole === "ta" ? "(required)" : "(optional)"}
            </label>
            <div className="space-y-2">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedCourse === course.id
                        ? "border-green-600 bg-green-50"
                        : "border-slate-200 hover:border-green-300"
                    }`}
                  >
                    <div className="font-medium text-slate-900">
                      {course.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {course.code}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No courses available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Button */}
      {selectedUser && (
        <button
          onClick={handleAssignRole}
          disabled={!selectedRole || (selectedRole === "ta" && !selectedCourse) || updating}
          className="w-full px-6 py-4 bg-[#0866ef] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
        >
          {updating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Assigning...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Save role
            </>
          )}
        </button>
      )}

      {selectedUser && (
        <DeleteUserCard
          key={selectedUser.id}
          user={selectedUser}
          onDeleted={(id) => {
            setUsers((current) => current.filter((user) => user.id !== id));
            setSuccess(`${selectedUser.full_name || selectedUser.username}'s account was deleted.`);
            setSelectedUser(null);
            setUserCourses([]);
          }}
        />
      )}

      {/* Guidelines */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          📋 Admin/TA Management Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">
              👤 1. Search & Select User
            </h4>
            <p>
              Find any user by searching their name, username, or email address.
              The current role is displayed below their name.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">
              🎓 2. Choose Role
            </h4>
            <p>
              Select whether you want them to be an Admin (full access) or a TA
              (grading access only in their courses).
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">
              📖 3. Select Course
            </h4>
            <p>
              Choose which course(s) the new admin/TA should be enrolled in. TAs
              can only grade in their enrolled courses.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">
              ✅ 4. Assign & Enroll
            </h4>
            <p>
              Click "Assign Role & Enroll" to update the user's role and enroll
              them in the selected course instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdminTA;

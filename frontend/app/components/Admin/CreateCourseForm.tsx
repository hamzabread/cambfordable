"use client";

import React, { useState } from "react";
import axios from "axios";
import { BookOpen, AlertCircle, CheckCircle, Loader } from "lucide-react";

interface CreateCourseFormProps {}

const CreateCourseForm = ({}: CreateCourseFormProps) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.id || !formData.name || !formData.code) {
      setError("All fields are required");
      return;
    }

    if (isNaN(Number(formData.id))) {
      setError("Course ID must be a number");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        "http://localhost:8000/courses/",
        {
          id: Number(formData.id),
          name: formData.name,
          code: formData.code,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(
        `Course "${formData.name}" created successfully!`
      );

      // Reset form
      setFormData({
        id: "",
        name: "",
        code: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error creating course:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === "Network Error") {
        setError("Network error. Make sure the server is running.");
      } else {
        setError("Failed to create course. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-slate-900" />
        <h2 className="text-2xl font-bold text-slate-900">Create New Course</h2>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Success</p>
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Course ID */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Course ID *
          </label>
          <input
            type="number"
            name="id"
            value={formData.id}
            onChange={handleChange}
            placeholder="e.g., 4"
            required
            className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            Unique numerical identifier for the course
          </p>
        </div>

        {/* Course Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Course Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Physics"
            required
            className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            Full name of the course
          </p>
        </div>

        {/* Course Code */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Course Code *
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., 9702"
            required
            className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            Cambridge International Education course code
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Creating Course...
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5" />
              Create Course
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">Note:</span> Course IDs must be unique.
          If you try to create a course with an existing ID, it will fail. Use
          incremental numbers (1, 2, 3, 4, etc.)
        </p>
      </div>
    </div>
  );
};

export default CreateCourseForm;
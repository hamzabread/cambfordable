"use client";

import React, { useState } from "react";
import axios from "axios";
import { BookOpen, AlertCircle, CheckCircle, Loader, X } from "lucide-react";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Homework {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
}

interface CreateHomeworkFormProps {
  courses: Course[];
  onSuccess: (homework: Homework) => void;
  onCancel: () => void;
}

const CreateHomeworkForm = ({
  courses,
  onSuccess,
  onCancel,
}: CreateHomeworkFormProps) => {
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    due_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (
      !formData.course_id ||
      !formData.title ||
      !formData.description ||
      !formData.due_date
    ) {
      setError("All fields are required");
      return;
    }

    const dueDate = new Date(formData.due_date);
    if (dueDate < new Date()) {
      setError("Due date must be in the future");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        "http://localhost:8000/homeworks/",
        {
          course_id: Number(formData.course_id),
          title: formData.title,
          description: formData.description,
          due_date: dueDate.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(true);
      setTimeout(() => {
        onSuccess(response.data);
        // Reset form
        setFormData({
          course_id: "",
          title: "",
          description: "",
          due_date: "",
        });
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error creating homework:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === "Network Error") {
        setError("Network error. Make sure the server is running.");
      } else {
        setError("Failed to create homework. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-slate-900" />
          <h3 className="text-2xl font-bold text-slate-900">
            Create New Homework
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Success</p>
            <p className="text-green-800 text-sm">
              Homework created successfully!
            </p>
          </div>
        </div>
      )}

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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Course *
          </label>
          <select
            name="course_id"
            value={formData.course_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          >
            <option value="">Choose a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Organic Chemistry Problem Set"
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the assignment in detail..."
            rows={4}
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition resize-none"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Due Date *
          </label>
          <input
            type="datetime-local"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Create Homework
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHomeworkForm;
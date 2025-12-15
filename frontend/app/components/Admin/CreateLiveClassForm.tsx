"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Video, AlertCircle, CheckCircle, Loader } from "lucide-react";

interface Course {
  id: number;
  name: string;
  code: string;
}

const CreateLiveClassForm = () => {
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    starts_at: "",
    ends_at: "",
    meeting_url: "",
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get("http://localhost:8000/courses/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(response.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        // Fallback data
        setCourses([
          { id: 1, name: "Chemistry", code: "9701" },
          { id: 2, name: "Mathematics", code: "9709" },
          { id: 3, name: "Physics", code: "9702" },
        ]);
      } finally {
        setFetchingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    setSuccess(null);

    // Validation
    if (
      !formData.course_id ||
      !formData.title ||
      !formData.starts_at ||
      !formData.ends_at ||
      !formData.meeting_url
    ) {
      setError("All fields are required");
      return;
    }

    const startTime = new Date(formData.starts_at);
    const endTime = new Date(formData.ends_at);

    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }

    if (!formData.meeting_url.includes("http")) {
      setError("Meeting URL must start with http:// or https://");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        "http://localhost:8000/live-classes/",
        {
          course_id: Number(formData.course_id),
          title: formData.title,
          starts_at: startTime.toISOString(),
          ends_at: endTime.toISOString(),
          meeting_url: formData.meeting_url,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const courseName =
        courses.find((c) => c.id === Number(formData.course_id))?.name ||
        "Course";

      setSuccess(
        `Live class "${formData.title}" created for ${courseName}!`
      );

      // Reset form
      setFormData({
        course_id: "",
        title: "",
        starts_at: "",
        ends_at: "",
        meeting_url: "",
      });

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error creating live class:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === "Network Error") {
        setError("Network error. Make sure the server is running.");
      } else {
        setError("Failed to create live class. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Video className="w-6 h-6 text-slate-900" />
        <h2 className="text-2xl font-bold text-slate-900">
          Create Live Class
        </h2>
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
        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Course *
          </label>
          {fetchingCourses ? (
            <div className="flex items-center gap-2 px-4 py-3 text-slate-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Loading courses...</span>
            </div>
          ) : (
            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
            >
              <option value="">Choose a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Select the course this live class belongs to
          </p>
        </div>

        {/* Class Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Class Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Organic Chemistry Lecture - Part 1"
            required
            className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            Descriptive name for this class session
          </p>
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Start Time *
          </label>
          <input
            type="datetime-local"
            name="starts_at"
            value={formData.starts_at}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            When the class starts
          </p>
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            End Time *
          </label>
          <input
            type="datetime-local"
            name="ends_at"
            value={formData.ends_at}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            When the class ends
          </p>
        </div>

        {/* Meeting URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Meeting URL *
          </label>
          <input
            type="url"
            name="meeting_url"
            value={formData.meeting_url}
            onChange={handleChange}
            placeholder="https://zoom.us/j/... or https://meet.google.com/..."
            required
            className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            Zoom, Google Meet, or other meeting platform URL
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
              Creating Live Class...
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              Create Live Class
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">Note:</span> Classes are automatically
          marked as "LIVE" when the current time falls between the start and end
          times. Make sure to provide valid meeting URLs.
        </p>
      </div>
    </div>
  );
};

export default CreateLiveClassForm;
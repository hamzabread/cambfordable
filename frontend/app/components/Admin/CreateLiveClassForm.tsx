"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Video,
  AlertCircle,
  CheckCircle,
  Loader,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface CreatedLiveClassState {
  id: number;
  title: string;
  courseName: string;
}

const CREATED_LIVE_CLASS_KEY = "created_live_class_state";

const CreateLiveClassForm = () => {
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    starts_at: "",
    duration: "60",
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdClassId, setCreatedClassId] = useState<number | null>(null);
  const [createdClassTitle, setCreatedClassTitle] = useState<string>("");
  const [createdCourseName, setCreatedCourseName] = useState<string>("");

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/`, {
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

  useEffect(() => {
    const savedState = localStorage.getItem(CREATED_LIVE_CLASS_KEY);
    if (!savedState) return;

    try {
      const parsedState = JSON.parse(savedState) as CreatedLiveClassState;
      if (parsedState?.id && parsedState?.title && parsedState?.courseName) {
        setCreatedClassId(parsedState.id);
        setCreatedClassTitle(parsedState.title);
        setCreatedCourseName(parsedState.courseName);
        setSuccess(`Live class "${parsedState.title}" created for ${parsedState.courseName}.`);
      }
    } catch (parseError) {
      console.error("Error restoring created live class state:", parseError);
      localStorage.removeItem(CREATED_LIVE_CLASS_KEY);
    }
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
    setCreatedClassId(null);
    setCreatedClassTitle("");

    // Validation
    if (
      !formData.course_id ||
      !formData.title ||
      !formData.starts_at ||
      !formData.duration
    ) {
      setError("All fields are required");
      return;
    }

    const startTime = new Date(formData.starts_at);
    const durationMinutes = parseInt(formData.duration);

    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      setError("Duration must be a positive number");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/live-classes/`,
        {
          course_id: Number(formData.course_id),
          title: formData.title,
          starts_at: startTime.toISOString(),
          duration: durationMinutes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const courseName =
        courses.find((c) => c.id === Number(formData.course_id))?.name ||
        "Course";

      setCreatedClassId(response.data.id);
      setCreatedClassTitle(formData.title);
      setCreatedCourseName(courseName);
      setSuccess(`Live class "${formData.title}" created for ${courseName}.`);
      localStorage.setItem(
        CREATED_LIVE_CLASS_KEY,
        JSON.stringify({
          id: response.data.id,
          title: formData.title,
          courseName,
        } satisfies CreatedLiveClassState)
      );

      // Reset form
      setFormData({
        course_id: "",
        title: "",
        starts_at: "",
        duration: "60",
      });
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

  const meetingLink = createdClassId
    ? `${window.location.origin}/meeting/${createdClassId}`
    : "";

  const clearCreatedClassState = () => {
    setCreatedClassId(null);
    setCreatedClassTitle("");
    setCreatedCourseName("");
    setSuccess(null);
    localStorage.removeItem(CREATED_LIVE_CLASS_KEY);
  };

  const handleShareOnWhatsApp = () => {
    if (!meetingLink) return;

    const message = `Join my live class: ${createdClassTitle}\n${meetingLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleJoinMeeting = () => {
    if (!createdClassId) return;
    window.open(`/meeting/${createdClassId}`, "_blank", "noopener,noreferrer");
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
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Success</p>
            <p className="text-green-800 text-sm">{success}</p>
            {meetingLink && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleShareOnWhatsApp}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Share on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleJoinMeeting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Join Class
                </button>
              </div>
            )}
            {meetingLink && (
              <p className="text-xs text-green-700 mt-3 break-all">
                Meeting link: {meetingLink}
              </p>
            )}
            {meetingLink && (
              <button
                type="button"
                onClick={clearCreatedClassState}
                className="mt-3 text-xs font-medium text-green-700 hover:text-green-800 underline"
              >
                Clear saved class card
              </button>
            )}
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

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Duration (minutes) *
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="15"
            max="480"
            required
            className="w-full px-4 py-3 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            How long the class will run (15-480 minutes)
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-linear-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 mt-6"
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
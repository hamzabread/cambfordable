"use client";

import React, { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { BookOpen, AlertCircle, CheckCircle, Loader, X } from "lucide-react";
import VoiceInput, { appendSpoken } from "../../Portal/VoiceInput";

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
  max_score?: number;
  image_url?: string;
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
    max_score: "100",
  });
  const [attachedImageFile, setAttachedImageFile] = useState<File | null>(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState<string | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAttachedImageFile(null);
      setAttachedImagePreview(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setError("Only JPG and PNG images are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB");
      return;
    }

    setError(null);
    setAttachedImageFile(file);
    setAttachedImagePreview(URL.createObjectURL(file));
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
        `${process.env.NEXT_PUBLIC_API_URL}/homeworks/`,
        {
          course_id: Number(formData.course_id),
          title: formData.title,
          description: formData.description,
          due_date: dueDate.toISOString(),
          max_score: Number(formData.max_score),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let createdHomework: Homework = response.data;

      // Upload optional image right after homework is created.
      if (attachedImageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", attachedImageFile);

        const imageUploadResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/homeworks/${response.data.id}/image`,
          imageFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        createdHomework = {
          ...createdHomework,
          image_url: imageUploadResponse.data.image_url,
        };
      }

      setSuccess(true);
      onSuccess(createdHomework);
      // Reset form
      setFormData({
        course_id: "",
        title: "",
        description: "",
        due_date: "",
        max_score: "100",
      });
      setAttachedImageFile(null);
      setAttachedImagePreview(null);
      setSuccess(false);
    } catch (err: unknown) {
      console.error("Error creating homework:", err);
      if (axios.isAxiosError(err) && typeof err.response?.data?.detail === "string") {
        setError(err.response.data.detail);
      } else if (axios.isAxiosError(err) && err.message === "Network Error") {
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
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
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
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {!success && (
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
          <div className="mb-2 flex items-start justify-between gap-3">
            <label htmlFor="homework-title" className="pt-1.5 text-sm font-medium text-slate-700">
              Title *
            </label>
            <VoiceInput
              label="homework title"
              onText={(text) => setFormData((prev) => ({ ...prev, title: appendSpoken(prev.title, text) }))}
            />
          </div>
          <input
            id="homework-title"
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
          <div className="mb-2 flex items-start justify-between gap-3">
            <label htmlFor="homework-description" className="pt-1.5 text-sm font-medium text-slate-700">
              Description *
            </label>
            <VoiceInput
              label="homework description"
              onText={(text) => setFormData((prev) => ({ ...prev, description: appendSpoken(prev.description, text) }))}
            />
          </div>
          <textarea
            id="homework-description"
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
        <div className="grid gap-4 sm:grid-cols-2">
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Score *</label>
          <input type="number" name="max_score" value={formData.max_score} onChange={handleChange} min="1" step="0.5" required className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition" />
        </div>
        </div>

        {/* Optional Image */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Question Image (Optional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleImageChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-500 mt-2">PNG or JPG, up to 10MB</p>

          {attachedImagePreview && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Image
                src={attachedImagePreview}
                alt="Homework image preview"
                width={900}
                height={500}
                unoptimized
                className="w-full max-h-48 object-contain rounded"
              />
            </div>
          )}
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
      )}
    </div>
  );
};

export default CreateHomeworkForm;

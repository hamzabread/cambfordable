"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, X, Trash2, ImageIcon } from "lucide-react";
import QuestionImageUpload from "../QuestionImageUpload";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Option {
  option_text: string;
  is_correct: boolean;
}

interface Question {
  question_text: string;
  is_mcq: boolean;
  marks: number;
  options: Option[];
  image_url?: string;
  temp_id?: string;
}

const CreateQuizForm = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState(10);
  const [deadline, setDeadline] = useState("");
  const [allowLate, setAllowLate] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: "",
      is_mcq: true,
      marks: 1,
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
      ],
      temp_id: Math.random().toString(),
    },
  ]);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File }>({});
  const [createdQuizId, setCreatedQuizId] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCourses(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load courses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        is_mcq: true,
        marks: 1,
        options: [
          { option_text: "", is_correct: true },
          { option_text: "", is_correct: false },
        ],
        temp_id: Math.random().toString(),
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (
    index: number,
    field: keyof Question,
    value: any
  ) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = {
      ...updated[qIdx].options[oIdx],
      [field]: value,
    };
    setQuestions(updated);
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push({ option_text: "", is_correct: false });
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== oIdx);
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse || !quizTitle || questions.length === 0) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");

      const payload = {
        course_id: selectedCourse,
        title: quizTitle,
        total_marks: totalMarks,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        allow_late: allowLate,
        questions: questions.map((q) => ({
          question_text: q.question_text,
          is_mcq: q.is_mcq,
          marks: q.marks,
          options: q.options,
        })),
      };

      const createResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/quizzes/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Upload any pending images using real question IDs
      const createdQuiz = createResponse.data;
      if (createdQuiz.id && createdQuiz.questions && Object.keys(imageFiles).length > 0) {
        console.log(`📤 Uploading ${Object.keys(imageFiles).length} images...`);
        for (let i = 0; i < questions.length; i++) {
          const tempId = questions[i].temp_id || "";
          const file = imageFiles[tempId];
          if (file && createdQuiz.questions[i]) {
            const formData = new FormData();
            formData.append("file", file);
            
            try {
              console.log(`Uploading image for question ${createdQuiz.questions[i].id}:`, file.name);
              const imgResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/quizzes/questions/${createdQuiz.questions[i].id}/image`,
                formData,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              console.log(`✅ Image uploaded successfully:`, imgResponse.data.image_url);
            } catch (imgErr: any) {
              console.error(`❌ Failed to upload image for question ${i}:`, imgErr.response?.data || imgErr.message);
              // Continue with other uploads even if one fails
            }
          }
        }
      }

      setSuccess(`✅ Quiz "${quizTitle}" created successfully!`);
      setCreatedQuizId(createdQuiz.id);
      
      // Reset form and image storage
      setSelectedCourse(null);
      setQuizTitle("");
      setTotalMarks(10);
      setDeadline("");
      setAllowLate(false);
      setImageFiles({});
      setQuestions([
        {
          question_text: "",
          is_mcq: true,
          marks: 1,
          options: [
            { option_text: "", is_correct: true },
            { option_text: "", is_correct: false },
          ],
          temp_id: Math.random().toString(),
        },
      ]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          📚 Select Course *
        </label>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <select
            value={selectedCourse || ""}
            onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Choose a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Quiz Title */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          ✏️ Quiz Title *
        </label>
        <input
          type="text"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          placeholder="e.g., Midterm Exam 2026"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Total Marks */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          🎯 Total Marks
        </label>
        <input
          type="number"
          value={totalMarks}
          onChange={(e) => setTotalMarks(Number(e.target.value))}
          min={1}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Deadline & Late Submission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            ⏰ Deadline
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-2">
            Leave empty for no deadline
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            📝 Late Submission
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowLate}
              onChange={(e) => setAllowLate(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-slate-700">Allow late submissions</span>
          </label>
          <p className="text-xs text-slate-500 mt-2">
            Students can submit after deadline
          </p>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Questions</h3>
          <span className="text-sm text-slate-500">{questions.length} question(s)</span>
        </div>

        {questions.map((question, qIdx) => (
          <div
            key={qIdx}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4"
          >
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900">Question {qIdx + 1}</h4>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-red-600 hover:text-red-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Question Text */}
            <input
              type="text"
              value={question.question_text}
              onChange={(e) =>
                updateQuestion(qIdx, "question_text", e.target.value)
              }
              placeholder="Enter question text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />

            {/* Question Image */}
            {question.image_url && (
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50 p-4">
                <img
                  src={question.image_url.startsWith('blob:') || question.image_url.startsWith('http') 
                    ? question.image_url 
                    : `${process.env.NEXT_PUBLIC_API_URL}${question.image_url}`}
                  alt="Question"
                  className="w-full h-auto max-h-48 object-contain"
                />
                <button
                  type="button"
                  onClick={() => updateQuestion(qIdx, "image_url", undefined)}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Remove Image
                </button>
              </div>
            )}

            {!question.image_url && (
              <details className="border border-slate-300 rounded-lg p-3 bg-slate-50 group">
                <summary className="cursor-pointer flex items-center gap-2 font-medium text-slate-700">
                  <ImageIcon className="w-4 h-4" />
                  Add Question Image (Optional)
                </summary>
                <div className="mt-3 pt-3 border-t border-slate-300">
                  <QuestionImageUpload
                    questionId={parseInt(question.temp_id || "0")}
                    imageUrl={question.image_url}
                    type="quiz"
                    onUploadSuccess={(url) => {
                      updateQuestion(qIdx, "image_url", url);
                    }}
                    onLocalFileSelected={(file) => {
                      if (file) {
                        setImageFiles({
                          ...imageFiles,
                          [question.temp_id || ""]: file,
                        });
                      }
                    }}
                  />
                </div>
              </details>
            )}

            {/* Question Type & Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Type
                </label>
                <select
                  value={question.is_mcq ? "mcq" : "text"}
                  onChange={(e) =>
                    updateQuestion(qIdx, "is_mcq", e.target.value === "mcq")
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="text">Short Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Marks
                </label>
                <input
                  type="number"
                  value={question.marks}
                  onChange={(e) =>
                    updateQuestion(qIdx, "marks", Number(e.target.value))
                  }
                  min={1}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Options (only for MCQ) */}
            {question.is_mcq && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-700">Options</p>
                {question.options.map((option, oIdx) => (
                  <div key={oIdx} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) =>
                        updateOption(qIdx, oIdx, "option_text", e.target.value)
                      }
                      placeholder={`Option ${oIdx + 1}`}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={option.is_correct}
                        onChange={(e) =>
                          updateOption(qIdx, oIdx, "is_correct", e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-xs text-slate-600">Correct</span>
                    </label>
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, oIdx)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Question Button */}
      <button
        type="button"
        onClick={addQuestion}
        className="w-full px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 font-semibold rounded-lg hover:border-blue-500 hover:text-blue-700 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Question
      </button>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Creating Quiz...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Create Quiz
          </>
        )}
      </button>
    </form>
  );
};

export default CreateQuizForm;
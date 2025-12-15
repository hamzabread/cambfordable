"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import { X, Upload, CheckCircle, AlertCircle, Loader, File } from "lucide-react";

interface Homework {
  id: number;
  title: string;
}

interface HomeworkSubmitModalProps {
  homework: Homework;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HomeworkSubmitModal = ({
  homework,
  isOpen,
  onClose,
  onSuccess,
}: HomeworkSubmitModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        setFile(null);
        return;
      }

      // Allowed file types
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("File type not supported. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `http://localhost:8000/homeworks/${homework.id}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(true);
      // Close modal after showing success message
      setTimeout(() => {
        onSuccess();
        // Reset state for next use
        setFile(null);
        setError(null);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting homework:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === "Network Error") {
        setError("Network error. Please try again.");
      } else {
        setError("Failed to submit homework. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state before closing
    setFile(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Submit Homework</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success State */}
          {success ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Submitted Successfully!
              </h3>
              <p className="text-slate-600 text-sm">
                Your homework has been submitted. Redirecting...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Homework Title */}
              <div>
                <p className="text-sm text-slate-600 mb-1">Assignment</p>
                <p className="font-semibold text-slate-900">{homework.title}</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* File Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                />

                {file ? (
                  <div>
                    <File className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-900 text-sm">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-900 text-sm">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Change File Button */}
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    fileInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition text-sm"
                >
                  Change File
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkSubmitModal;
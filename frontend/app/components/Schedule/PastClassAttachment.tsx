"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import {
  File,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
} from "lucide-react";

interface PastClassAttachmentProps {
  classId: number;
  className: string;
  isAdmin: boolean;
  existingAttachmentUrl?: string | null;
  onAttachmentLoaded?: (url: string) => void;
  onModalStateChange?: (classId: number | null) => void;
}

const PastClassAttachment = ({
  classId,
  className,
  isAdmin,
  existingAttachmentUrl,
  onAttachmentLoaded,
  onModalStateChange,
}: PastClassAttachmentProps) => {
  const [attachmentUrl, setAttachmentUrl] = useState<string | null | undefined>(
    existingAttachmentUrl
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        setFile(null);
        return;
      }

      // Allowed file types
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Only PDF and image files (JPG, PNG) are allowed");
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
        `${process.env.NEXT_PUBLIC_API_URL}/live-classes/${classId}/attachment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Extract filename from the attachment URL
      const newUrl = response.data.attachment_url;
      setAttachmentUrl(newUrl);
      setSuccess(true);

      // Notify parent component
      if (onAttachmentLoaded) {
        onAttachmentLoaded(newUrl);
      }

      // Close modal after showing success message
      setTimeout(() => {
        setShowUploadModal(false);
        // Reset state for next use
        setFile(null);
        setError(null);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error uploading attachment:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === "Network Error") {
        setError("Network error. Please try again.");
      } else {
        setError("Failed to upload attachment. Please try again.");
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
    setShowUploadModal(false);
    // Notify parent component
    if (onModalStateChange) {
      onModalStateChange(null);
    }
  };

  const handleDownload = () => {
    if (!attachmentUrl) return;
    // Extract filename from URL like "/uploads/live_classes/filename.pdf"
    const filename = attachmentUrl.split("/").pop();
    if (filename) {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/uploads/live-classes/${filename}`;
    }
  };

  return (
    <>
      {/* Attachment Display */}
      <div className="mt-4 p-3 bg-slate-100 rounded-lg">
        {attachmentUrl ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-900">
                Attachment available
              </span>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded text-sm hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              No attachment yet
            </span>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowUploadModal(true);
                  if (onModalStateChange) {
                    onModalStateChange(classId);
                  }
                }}
                className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded text-sm hover:bg-slate-800 transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Add Attachment
              </button>
            )}
          </div>
        )}

        {/* Admin can replace attachment */}
        {isAdmin && attachmentUrl && (
          <button
            onClick={() => {
              setShowUploadModal(true);
              if (onModalStateChange) {
                onModalStateChange(classId);
              }
            }}
            className="mt-2 w-full px-3 py-1.5 border border-slate-300 text-slate-700 font-semibold rounded text-sm hover:bg-slate-50 transition"
          >
            Replace Attachment
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full z-[10000]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Add Class Attachment
              </h2>
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
                    Uploaded Successfully!
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Attachment added to {className}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Class Title */}
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Class</p>
                    <p className="font-semibold text-slate-900">{className}</p>
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
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />

                    {file ? (
                      <div>
                        <File className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-900 text-sm">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="font-semibold text-slate-900 text-sm">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PDF or Image (JPG, PNG) · Max 50MB
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
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PastClassAttachment;

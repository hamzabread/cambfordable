"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import { Upload, X, Image as ImageIcon, Check } from "lucide-react";

interface QuestionImageUploadProps {
  questionId: number;
  imageUrl?: string | null;
  onUploadSuccess: (imageUrl: string) => void;
  type: "homework" | "quiz"; // Type of question (homework or quiz)
  disabled?: boolean; // Disable upload (e.g., for unsaved quizzes)
  disabledMessage?: string; // Message to show when disabled
  onLocalFileSelected?: (file: File | null) => void; // Called when image is selected locally (before real ID exists)
}

const QuestionImageUpload: React.FC<QuestionImageUploadProps> = ({
  questionId,
  imageUrl,
  onUploadSuccess,
  type,
  disabled = false,
  disabledMessage,
  onLocalFileSelected,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLocalFile, setIsLocalFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    // Validate file type
    if (!["image/jpeg", "image/png", "image/jpg"].includes(selectedFile.type)) {
      setError("Only JPG and PNG images are allowed");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");

      // If question ID is 0 (temporary), store file locally instead of uploading
      if (questionId === 0) {
        // Notify parent of the file for later upload
        if (onLocalFileSelected) {
          onLocalFileSelected(file);
        }
        // Create a temporary URL for preview
        const tempUrl = URL.createObjectURL(file);
        onUploadSuccess(tempUrl);
        setIsLocalFile(true);
        setFile(null);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      let endpoint = "";
      if (type === "homework") {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/homeworks/${questionId}/image`;
      } else if (type === "quiz") {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/quizzes/questions/${questionId}/image`;
      }

      const response = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onUploadSuccess(response.data.image_url);
      setFile(null);
      setPreview(response.data.image_url);
      setIsLocalFile(false);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to upload image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4">
      {disabled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <div className="text-lg">⚠️</div>
          <span>
            {disabledMessage || "Save the quiz first to add images to questions"}
          </span>
        </div>
      )}

      {!disabled && (
        <>
          {/* Preview */}
          {preview ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-50 p-4">
          <img
            src={preview}
            alt="Question preview"
            className="w-full h-auto max-h-64 object-contain rounded"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition"
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Upload Area */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onPaste={handlePaste}
          className={`border-2 border-dashed rounded-lg p-6 transition cursor-pointer ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-slate-50 hover:border-slate-400"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            onChange={handleChange}
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <ImageIcon className="w-10 h-10 text-slate-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                Drop image here or click to upload
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Or paste (Ctrl+V / Cmd+V)
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              PNG, JPG up to 10MB
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !disabled && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Upload Button */}
      {file && !imageUrl && !disabled && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin">⏳</div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Image
            </>
          )}
        </button>
      )}

        </>
      )}

      {/* Success Message */}
      {imageUrl && !disabled && (
        <div className={`border px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
          isLocalFile 
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <Check className="w-4 h-4" />
          {isLocalFile 
            ? 'Image selected! Will upload after quiz is created.'
            : 'Image uploaded successfully'}
        </div>
      )}
    </div>
  );
};

export default QuestionImageUpload;

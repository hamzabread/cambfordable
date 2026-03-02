"use client";

import React, { useState } from "react";
import { ImageIcon } from "lucide-react";
import QuestionImageUpload from "./QuestionImageUpload";

interface HomeworkQuestionDisplayProps {
  homeworkId: number;
  title: string;
  description?: string;
  imageUrl?: string | null;
  dueDate: string;
  isAdmin: boolean;
  onImageUploadSuccess?: (imageUrl: string) => void;
}

const HomeworkQuestionDisplay: React.FC<HomeworkQuestionDisplayProps> = ({
  homeworkId,
  title,
  description,
  imageUrl,
  dueDate,
  isAdmin,
  onImageUploadSuccess,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">
          Due: {new Date(dueDate).toLocaleDateString()}
        </p>
      </div>

      {/* Description */}
      {description && (
        <div className="text-slate-700">
          <p className="text-base">{description}</p>
        </div>
      )}

      {/* Image Section */}
      {imageUrl ? (
        <div className="space-y-2">
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-4">
            <img
              src={imageUrl}
              alt="Homework question"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Change Image
            </button>
          )}
        </div>
      ) : isAdmin ? (
        <div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium rounded-lg transition"
          >
            <ImageIcon className="w-4 h-4" />
            Add Question Image
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Upload an image to visualize the homework question
          </p>
        </div>
      ) : null}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Upload Question Image
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <QuestionImageUpload
              questionId={homeworkId}
              imageUrl={imageUrl}
              type="homework"
              onUploadSuccess={(url) => {
                setShowUploadModal(false);
                onImageUploadSuccess?.(url);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkQuestionDisplay;

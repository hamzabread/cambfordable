"use client";

import React, { useState } from "react";
import { ImageIcon } from "lucide-react";
import QuestionImageUpload from "./QuestionImageUpload";

interface QuizQuestionDisplayProps {
  questionId: number;
  questionText: string;
  imageUrl?: string | null;
  marks: number;
  isMCQ: boolean;
  isAdmin: boolean;
  children?: React.ReactNode; // For options/answer input
  onImageUploadSuccess?: (imageUrl: string) => void;
}

const QuizQuestionDisplay: React.FC<QuizQuestionDisplayProps> = ({
  questionId,
  questionText,
  imageUrl,
  marks,
  isMCQ,
  isAdmin,
  children,
  onImageUploadSuccess,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{questionText}</h3>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
            <span className="font-medium">{marks} marks</span>
            {isMCQ && <span>• Multiple Choice</span>}
          </div>
        </div>
      </div>

      {/* Image Section */}
      {imageUrl ? (
        <div className="space-y-2">
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-4">
            <img
              src={imageUrl}
              alt="Quiz question"
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
            Upload an image to visualize the quiz question
          </p>
        </div>
      ) : null}

      {/* Options/Answer Section */}
      {children && <div className="space-y-3">{children}</div>}

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
              questionId={questionId}
              imageUrl={imageUrl}
              type="quiz"
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

export default QuizQuestionDisplay;

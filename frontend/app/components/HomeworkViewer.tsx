"use client";

import React from "react";
import { Download, ImageIcon } from "lucide-react";

interface HomeworkViewerProps {
  homeworkId: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  dueDate: string;
  courseTitle: string;
}

const HomeworkViewer: React.FC<HomeworkViewerProps> = ({
  homeworkId,
  title,
  description,
  imageUrl,
  dueDate,
  courseTitle,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <p className="text-sm text-slate-600 mb-1">{courseTitle}</p>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-2">
          Due: {new Date(dueDate).toLocaleString()}
        </p>
      </div>

      {/* Description */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Details</h2>
        <p className="text-slate-700 whitespace-pre-wrap">{description}</p>
      </div>

      {/* Question Image */}
      {imageUrl ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Question Visual
          </h2>
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50 p-4">
            <img
              src={imageUrl}
              alt="Homework question"
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </div>
          <a
            href={imageUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Download Image
          </a>
        </div>
      ) : null}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📝 Submit your solution by the due date. You can upload your work through the submission button.
        </p>
      </div>
    </div>
  );
};

export default HomeworkViewer;

"use client";

import React from "react";
import { Download, ImageIcon } from "lucide-react";

interface QuizOption {
  id: number;
  option_text: string;
  is_correct: boolean;
}

interface QuestionViewerProps {
  questionNumber: number;
  questionText: string;
  marks: number;
  questionType: "mcq" | "short_answer" | "essay";
  imageUrl?: string | null;
  options?: QuizOption[];
}

const QuestionViewer: React.FC<QuestionViewerProps> = ({
  questionNumber,
  questionText,
  marks,
  questionType,
  imageUrl,
  options,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-300 p-6 space-y-4">
      {/* Question Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-600">
            Question {questionNumber}
          </p>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">
            {questionText}
          </h3>
        </div>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
          {marks} mark{marks !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Question Visual */}
      {imageUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
            <ImageIcon className="w-4 h-4" />
            Question Visual
          </div>
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50 p-3">
            <img
              src={imageUrl}
              alt="Question visual"
              className="w-full h-auto max-h-[400px] object-contain"
            />
          </div>
          <a
            href={imageUrl}
            download
            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded transition"
          >
            <Download className="w-3 h-3" />
            Download
          </a>
        </div>
      ) : null}

      {/* MCQ Options */}
      {questionType === "mcq" && options && options.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium text-slate-700">Options:</p>
          <div className="space-y-2">
            {options.map((option, idx) => (
              <div
                key={option.id}
                className="flex items-start gap-3 p-3 border border-slate-300 rounded-lg bg-slate-50"
              >
                <span className="text-slate-600 font-medium text-sm min-w-[24px]">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className="text-slate-700 text-sm">{option.option_text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Type Indicator */}
      <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
        Type:{" "}
        <span className="capitalize font-medium text-slate-700">
          {questionType === "mcq"
            ? "Multiple Choice"
            : questionType === "short_answer"
              ? "Short Answer"
              : "Essay"}
        </span>
      </div>
    </div>
  );
};

export default QuestionViewer;

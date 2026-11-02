"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PortalLayout from "../../components/Portal/PortalLayout";
import PortalLoading from "../../components/Portal/PortalLoading";
import { usePortalUser } from "../../components/Portal/usePortalUser";
import QuizTaker from "../../components/Quizzes/QuizTaker";

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = Number(params.id);
  const { user, loading } = usePortalUser();

  // Staff review quizzes from the grading screens, not by taking them.
  useEffect(() => {
    if (user?.is_admin) router.replace("/quizzes");
  }, [router, user]);

  if (loading || !user || user.is_admin) return <PortalLoading label="Loading quiz..." />;

  const handleQuizSubmit = () => {
    setTimeout(() => router.push("/quizzes"), 2000);
  };

  return (
    <PortalLayout user={user}>
      <Link
        href="/quizzes"
        className="mb-6 inline-flex items-center gap-2 font-semibold text-[#0866ef] transition hover:text-blue-800"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to quizzes
      </Link>
      <div className="mx-auto max-w-4xl">
        {Number.isInteger(quizId) && quizId > 0 ? (
          <QuizTaker quizId={quizId} onSubmit={handleQuizSubmit} />
        ) : (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">This quiz doesn&apos;t exist.</p>
        )}
      </div>
    </PortalLayout>
  );
}

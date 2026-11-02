"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import PortalLayout from "../../../components/Portal/PortalLayout";
import PortalLoading from "../../../components/Portal/PortalLoading";
import { usePortalUser } from "../../../components/Portal/usePortalUser";
import HomeworkGrades from "../../../components/Homework/HomeworkGrades";
import { API_URL, authHeaders, getApiError } from "@/lib/portal";

export default function HomeworkGradesPage() {
  const params = useParams();
  const homeworkId = Number(params.id);
  const validId = Number.isInteger(homeworkId) && homeworkId > 0;
  const { user, loading: userLoading } = usePortalUser();
  const [homeworkTitle, setHomeworkTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !validId) return;
    axios
      .get(`${API_URL}/homeworks/${homeworkId}`, { headers: authHeaders() })
      .then((response) => setHomeworkTitle(response.data.title))
      .catch((requestError) => setError(getApiError(requestError, "This assignment could not be loaded.")))
      .finally(() => setLoading(false));
  }, [homeworkId, user, validId]);

  if (userLoading || !user) return <PortalLoading label="Loading your grade..." />;
  const shownError = validId ? error : "This assignment doesn't exist.";
  const stillLoading = validId && loading;

  return (
    <PortalLayout user={user}>
      <Link
        href="/homework?tab=graded"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#0866ef] hover:text-blue-800"
      >
        <ChevronLeft className="h-5 w-5" />
        Back to assignments
      </Link>

      {stillLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-white" />
      ) : shownError ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-900">
          <p className="font-semibold">{shownError}</p>
          <p className="mt-1">It may have been removed, or the link is wrong.</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">{homeworkTitle}: your grade</h1>
            <p className="text-slate-600">Your score, feedback and submission</p>
          </div>
          <HomeworkGrades homeworkId={homeworkId} />
        </>
      )}
    </PortalLayout>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import ZoomProvider from "../../components/ZoomProvider";
import { Loader } from "lucide-react";
import { redirectToLogin } from "@/lib/auth";
import { getApiError } from "@/lib/portal";

export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  "Class has not started yet": "This class hasn't started yet. Come back at the start time.",
  "Class has ended": "This class has ended.",
  "You are not enrolled in this course": "You're not enrolled in this class's course.",
  "Class not found": "We couldn't find this class.",
};

export default function MeetingPage() {
  const params = useParams();
  const [meetingData, setMeetingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const classId = Number(params.id);
  const validId = Number.isInteger(classId) && classId > 0;

  useEffect(() => {
    if (!validId) return;
    const fetchMeetingCredentials = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        redirectToLogin();
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/live-classes/${classId}/zoom-sdk`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMeetingData(response.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && !err.response) {
          setError("We can't reach the server. Check your connection and try again.");
          return;
        }
        const detail = getApiError(err, "This class could not be opened.");
        setError(REASONS[detail] ?? detail);
      }
    };

    fetchMeetingCredentials();
  }, [classId, validId]);

  if (!validId || error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div role="alert" className="max-w-md text-center">
          <p className="text-xl font-semibold mb-2">{validId ? error : "We couldn't find this class."}</p>
          <p className="mb-6 text-sm text-white/70">Your schedule shows when each class opens.</p>
          <Link href="/schedule" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">
            Back to schedule
          </Link>
        </div>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white" role="status">
        <Loader className="w-10 h-10 animate-spin mb-4 text-blue-500" />
        <p>Preparing your classroom...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <ZoomProvider meetingData={meetingData} classId={classId} />
    </div>
  );
}

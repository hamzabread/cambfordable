"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import ZoomProvider from "../../components/ZoomProvider"; // Adjust path as needed
import { Loader } from "lucide-react";

export const dynamic = "force-dynamic";

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [meetingData, setMeetingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const classId = Number(params.id);

  useEffect(() => {
    const fetchMeetingCredentials = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/live-classes/${params.id}/zoom-sdk`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMeetingData(response.data);
      } catch (err: any) {
        console.error("Error loading meeting:", err);
        setError("Failed to load the meeting. You may close this tab.");
      }
    };

    if (params.id) {
      fetchMeetingCredentials();
    }
  }, [params.id, router]);

  if (Number.isNaN(classId)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center">
          <p className="text-xl mb-4">Invalid class ID.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
          <button onClick={() => window.close()} className="text-blue-400 underline">Close Tab</button>
        </div>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <Loader className="w-10 h-10 animate-spin mb-4 text-blue-500" />
        <p>Preparing your classroom...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
        {/* We reuse your existing ZoomProvider component */}
      <ZoomProvider meetingData={meetingData} classId={classId} />
    </div>
  );
}
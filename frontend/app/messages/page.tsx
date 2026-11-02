"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircleQuestion, Video } from "lucide-react";
import CourseQuestions from "../components/Messages/CourseQuestions";
import MessagesWorkspace from "../components/Messages/MessagesWorkspace";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";

type Tab = "questions" | "live";

const TABS: { id: Tab; label: string; icon: typeof Video }[] = [
  { id: "questions", label: "Course questions", icon: MessageCircleQuestion },
  { id: "live", label: "Live class chat", icon: Video },
];

function Messages() {
  const { user, loading } = usePortalUser();
  const params = useSearchParams();
  // Notifications link to /messages?thread=<id>; ?tab=live opens the class chat.
  const threadId = Number(params.get("thread")) || null;
  const linkedTab: Tab = params.get("tab") === "live" && !threadId ? "live" : "questions";
  // A tab picked by hand holds until the URL changes (a notification is opened).
  const urlKey = params.toString();
  const [picked, setPicked] = useState<{ url: string; tab: Tab } | null>(null);
  const tab = picked?.url === urlKey ? picked.tab : linkedTab;
  const setTab = (next: Tab) => setPicked({ url: urlKey, tab: next });

  if (loading || !user) return <PortalLoading label="Loading messages..." />;

  return (
    <PortalLayout user={user} wide>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#12243d]">Messages</h1>
        <div role="tablist" aria-label="Message type" className="inline-flex self-start rounded-xl border border-[#dfe6f0] bg-white p-1 shadow-sm sm:self-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`messages-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`messages-panel-${id}`}
              onClick={() => setTab(id)}
              className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition ${tab === id ? "bg-[#0866ef] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id={`messages-panel-${tab}`} aria-labelledby={`messages-tab-${tab}`}>
        {tab === "questions" ? (
          <CourseQuestions key={threadId ?? "list"} user={user} initialThreadId={threadId} />
        ) : (
          <MessagesWorkspace user={user} onAskQuestion={() => setTab("questions")} />
        )}
      </div>
    </PortalLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<PortalLoading label="Loading messages..." />}>
      <Messages />
    </Suspense>
  );
}

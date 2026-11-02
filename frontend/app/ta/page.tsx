"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TAPanel from "../components/TA/TAPanel";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";

export default function TADashboard() {
  const router = useRouter();
  const { user, loading } = usePortalUser();
  useEffect(() => { if (user && !user.is_ta) router.replace("/dashboard"); }, [router, user]);
  if (loading || !user || !user.is_ta) return <PortalLoading label="Loading grading workspace..." />;
  return <PortalLayout user={user} wide><TAPanel /></PortalLayout>;
}

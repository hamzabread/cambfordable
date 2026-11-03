"use client";

import AdminPanel from "../components/Admin/AdminPanel";
import StudentDashboard from "../components/Dashboard/StudentDashboard";
import TAPanel from "../components/TA/TAPanel";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";

export default function DashboardPage() {
  const { user, loading } = usePortalUser();

  if (loading || !user) {
    return <PortalLoading label="Loading your dashboard..." />;
  }

  return (
    <PortalLayout user={user} wide>
      {user.is_admin ? <AdminPanel isAdmin /> : user.is_ta ? <TAPanel /> : <StudentDashboard user={user} />}
    </PortalLayout>
  );
}

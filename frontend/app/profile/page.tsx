"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Contact,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";
import {
  API_URL,
  authHeaders,
  clampProgress,
  CourseCatalogItem,
  getAccessToken,
  getApiError,
  PortalUser,
} from "@/lib/portal";
import { saveTokens } from "@/lib/auth";

interface ProfileForm {
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  permanent_address: string;
}

const toForm = (user: PortalUser): ProfileForm => ({
  full_name: user.full_name || "",
  email: user.email,
  phone_number: user.phone_number || "",
  date_of_birth: user.date_of_birth || "",
  gender: user.gender || "",
  nationality: user.nationality || "",
  permanent_address: user.permanent_address || "",
});

function displayDate(value?: string | null) {
  if (!value) return "Not provided";
  return new Date(`${value}T00:00:00`).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function FieldValue({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</dt><dd className="mt-1.5 text-sm font-semibold text-slate-700">{value || "Not provided"}</dd></div>;
}

export default function ProfilePage() {
  const { user, setUser, loading } = usePortalUser();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // The header's "Change password" link lands here with #security.
  useEffect(() => {
    if (user && window.location.hash === "#security") setPasswordOpen(true);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setForm(toForm(user));
    const token = getAccessToken();
    if (!token) return;
    axios.get<CourseCatalogItem[]>(`${API_URL}/courses/catalog`, { headers: authHeaders(token) })
      .then((response) => setCourses(response.data.filter((course) => course.enrollment_status === "enrolled")))
      .catch(() => setCourses([]));
  }, [user]);

  const degreeProgress = useMemo(() => {
    if (!courses.length) return 0;
    return Math.round(courses.reduce((sum, course) => sum + clampProgress(course.progress), 0) / courses.length);
  }, [courses]);

  const changeForm = (field: keyof ProfileForm, value: string) => {
    setForm((current) => current ? { ...current, [field]: value } : current);
  };

  const startEditing = () => {
    setSuccess(null);
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (user) setForm(toForm(user));
    setEditing(false);
    setError(null);
  };

  // Typed passwords never survive closing the dialog.
  const openPasswordDialog = () => {
    setPasswords({ current: "", next: "", confirm: "" });
    setSuccess(null);
    setError(null);
    setPasswordOpen(true);
  };

  const closePasswordDialog = () => {
    setPasswords({ current: "", next: "", confirm: "" });
    setError(null);
    setPasswordOpen(false);
  };

  const saveProfile = async () => {
    if (!form) return;
    const token = getAccessToken();
    if (!token) return;
    if (form.full_name.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email address can't be empty.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim() || null]),
      );
      const response = await axios.patch<PortalUser>(`${API_URL}/users/profile`, payload, { headers: authHeaders(token) });
      setUser(response.data);
      setForm(toForm(response.data));
      setEditing(false);
      setSuccess("Your profile has been updated.");
    } catch (requestError) {
      setError(getApiError(requestError, "Your profile could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    try {
      setPasswordSaving(true);
      setError(null);
      const response = await axios.post(`${API_URL}/users/profile/password`, { current_password: passwords.current, new_password: passwords.next }, { headers: authHeaders(token) });
      // Other sessions are signed out; this one continues with new tokens.
      if (response.data?.access_token) saveTokens(response.data);
      closePasswordDialog();
      setSuccess("Your password has been changed. Other devices have been signed out.");
    } catch (requestError) {
      setError(getApiError(requestError, "Your password could not be changed."));
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading || !user || !form) return <PortalLoading label="Loading profile..." />;

  const name = user.full_name || user.username;
  const initials = name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString([], { month: "short", year: "numeric" }) : "Not available";

  return (
    <PortalLayout user={user} wide>
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-lg font-bold text-[#075bc7] ring-4 ring-white shadow-md sm:h-20 sm:w-20 sm:text-xl">{initials}</span>
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.035em] text-[#06182f] sm:text-3xl">{name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[#397ee8]"><CalendarDays className="h-3 w-3" /> Member since {memberSince}</span>
              {user.major && <span className="text-[#0866ef]">{user.major}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button type="button" onClick={cancelEditing} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={saveProfile} disabled={saving} className="flex h-10 items-center gap-2 rounded-lg bg-[#0866ef] px-5 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-[#075bda] disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes</button>
            </>
          ) : (
            <button type="button" onClick={startEditing} className="flex h-10 items-center gap-2 rounded-lg border border-[#0866ef] bg-white px-5 text-xs font-bold text-[#0866ef] hover:bg-blue-50"><Pencil className="h-4 w-4" /> Edit profile</button>
          )}
        </div>
      </div>

      {success && <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check className="h-4 w-4" /><span className="flex-1">{success}</span><button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}
      {error && !passwordOpen && <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-[#e4eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)] sm:p-6">
            <div className="mb-5 flex items-center gap-2 border-b border-[#edf1f6] pb-4"><UserRound className="h-5 w-5 text-[#0866ef]" /><h2 className="text-lg font-bold text-[#263850]">Personal Info</h2></div>
            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-600">Full name<input maxLength={120} required value={form.full_name} onChange={(e) => changeForm("full_name", e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-[#f7f9fc] px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" /></label>
                <label className="text-xs font-bold text-slate-600">Date of birth<input type="date" value={form.date_of_birth} onChange={(e) => changeForm("date_of_birth", e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-[#f7f9fc] px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" /></label>
                <label className="text-xs font-bold text-slate-600">Gender<select value={form.gender} onChange={(e) => changeForm("gender", e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-[#f7f9fc] px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"><option value="">Prefer not to say</option><option value="Female">Female</option><option value="Male">Male</option><option value="Non-binary">Non-binary</option><option value="Other">Other</option></select></label>
                <label className="text-xs font-bold text-slate-600">Nationality<input maxLength={80} value={form.nationality} onChange={(e) => changeForm("nationality", e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-[#f7f9fc] px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" /></label>
              </div>
            ) : (
              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2"><FieldValue label="Full name" value={name} /><FieldValue label="Date of birth" value={displayDate(user.date_of_birth)} /><FieldValue label="Gender" value={user.gender} /><FieldValue label="Nationality" value={user.nationality} /></dl>
            )}
          </section>

          <section className="rounded-xl border border-[#e4eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)] sm:p-6">
            <div className="mb-5 flex items-center gap-2 border-b border-[#edf1f6] pb-4"><Contact className="h-5 w-5 text-[#0866ef]" /><h2 className="text-lg font-bold text-[#263850]">Contact Info</h2></div>
            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-600">Email address<input type="email" required value={form.email} onChange={(e) => changeForm("email", e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-[#f7f9fc] px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" /></label>
                <label className="text-xs font-bold text-slate-600">Phone number<input type="tel" maxLength={20} value={form.phone_number} onChange={(e) => changeForm("phone_number", e.target.value)} placeholder="+923001234567" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-[#f7f9fc] px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" /></label>
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">Permanent address<textarea maxLength={500} value={form.permanent_address} onChange={(e) => changeForm("permanent_address", e.target.value)} rows={3} className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-[#f7f9fc] px-3 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" /></label>
              </div>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[#f1f5fb] p-4"><dt className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><Mail className="h-3.5 w-3.5" /> Email address</dt><dd className="mt-1.5 break-all text-sm font-semibold text-slate-700">{user.email}</dd></div>
                <div className="rounded-lg bg-[#f1f5fb] p-4"><dt className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><Phone className="h-3.5 w-3.5" /> Phone number</dt><dd className="mt-1.5 text-sm font-semibold text-slate-700">{user.phone_number || "Not provided"}</dd></div>
                <div className="rounded-lg bg-[#f1f5fb] p-4 sm:col-span-2"><dt className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><MapPin className="h-3.5 w-3.5" /> Permanent address</dt><dd className="mt-1.5 whitespace-pre-line text-sm font-semibold text-slate-700">{user.permanent_address || "Not provided"}</dd></div>
              </dl>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-[#e4eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
            <div className="mb-5 flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-[#0866ef]" /><h2 className="text-base font-bold text-[#263850]">Academic Status</h2></div>
            <dl className="divide-y divide-slate-100">
              {[["Student ID", user.student_id || "Not assigned"], ["Current year", user.current_year || "Not provided"], ["Academic standing", user.academic_standing || "Not provided"]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-3 first:pt-0"><dt className="text-[11px] font-medium text-slate-500">{label}</dt><dd className="text-right text-xs font-bold text-slate-700">{value}</dd></div>)}
            </dl>
            <div className="mt-4"><div className="flex items-center justify-between text-[10px] font-bold text-slate-600"><span>Course progress</span><span className="text-[#0866ef]">{degreeProgress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5ebf4]"><div className="h-full rounded-full bg-[#0866ef]" style={{ width: `${degreeProgress}%` }} /></div><p className="mt-2 text-[10px] leading-4 text-slate-400">Average progress across your approved courses.</p></div>
          </section>

          <section id="security" className="rounded-xl border border-[#e4eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
            <div className="mb-2 flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-[#0866ef]" /><h2 className="text-base font-bold text-[#263850]">Security Settings</h2></div>
            <p className="mb-4 text-[11px] leading-4 text-slate-500">Changing your password signs out your other devices.</p>
            <button type="button" onClick={openPasswordDialog} className="flex w-full items-center gap-3 rounded-lg border border-blue-100 p-3 text-left transition hover:bg-blue-50"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f1ff] text-[#397ee8]"><KeyRound className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-700">Change password</span><span className="block text-[10px] text-slate-400">Update your account password</span></span><ChevronRight className="h-4 w-4 text-slate-400" /></button>
          </section>
        </aside>
      </div>

      {passwordOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#06172d]/65 p-4" role="dialog" aria-modal="true" aria-labelledby="password-title">
          <form onSubmit={changePassword} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#0866ef]">Account security</p><h2 id="password-title" className="mt-1 text-xl font-bold text-[#0b1f39]">Change password</h2></div><button type="button" onClick={closePasswordDialog} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-slate-600">Current password<input type="password" autoComplete="current-password" required value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-xs font-bold text-slate-600">New password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-xs font-bold text-slate-600">Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" /></label>
            </div>
            {error && <p className="mt-4 flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}
            <button type="submit" disabled={passwordSaving} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0866ef] text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-[#075bda] disabled:opacity-60">{passwordSaving && <LoaderCircle className="h-4 w-4 animate-spin" />} Update password</button>
          </form>
        </div>
      )}
    </PortalLayout>
  );
}

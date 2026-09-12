"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getTeacherProfile, updateTeacherProfile } from "@/services/teacherService";
import type { TeacherProfile } from "@/services/teacherService";
import {
  GraduationCap,
  Award,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Save,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Check,
  FileText
} from "lucide-react";

export function TeacherSettingsPage() {
  const { user, loading: authLoading, updateUser, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("Mr.");
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [qualification, setQualification] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  // Backup for reset
  const [initialState, setInitialState] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "TEACHER") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getTeacherProfile();

        if (cancelled) return;

        setTitle(profile.title || user?.title || "Mr.");
        setName(profile.name || user?.name || "");
        setInitials(profile.initials || user?.initials || "");
        setQualification(profile.qualification || user?.qualification || "");
        setBio(profile.bio || user?.bio || "");
        setPhoneNumber(profile.phoneNumber || user?.phoneNumber || "");
        setEmail(profile.email || user?.email || "");

        setInitialState(profile);
      } catch (err: any) {
        console.error("Failed to load teacher profile:", err);
        if (!cancelled && user) {
          setTitle(user.title || "Mr.");
          setName(user.name || "");
          setInitials(user.initials || "");
          setQualification(user.qualification || "");
          setBio(user.bio || "");
          setPhoneNumber(user.phoneNumber || "");
          setEmail(user.email || "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  function handleReset() {
    if (initialState) {
      setTitle(initialState.title || "Mr.");
      setName(initialState.name || "");
      setInitials(initialState.initials || "");
      setQualification(initialState.qualification || "");
      setBio(initialState.bio || "");
      setPhoneNumber(initialState.phoneNumber || "");
    } else if (user) {
      setTitle(user.title || "Mr.");
      setName(user.name || "");
      setInitials(user.initials || "");
      setQualification(user.qualification || "");
      setBio(user.bio || "");
      setPhoneNumber(user.phoneNumber || "");
    }
    setError(null);
    setSaveSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide your full name.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const computedInitials = initials.trim()
        ? initials.trim().toUpperCase()
        : name
            .split(/\s+/)
            .map((p) => p[0])
            .filter(Boolean)
            .join("")
            .slice(0, 2)
            .toUpperCase() || "TC";

      const updated = await updateTeacherProfile({
        title: title.trim(),
        name: name.trim(),
        initials: computedInitials,
        qualification: qualification.trim() || undefined,
        bio: bio.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      // Update AuthContext to reflect immediately in sidebar teacher chip and header
      updateUser({
        title: updated.title || title.trim(),
        name: updated.name || name.trim(),
        initials: updated.initials || computedInitials,
        qualification: updated.qualification || qualification.trim(),
        bio: updated.bio || bio.trim(),
        phoneNumber: updated.phoneNumber || phoneNumber.trim(),
      });

      setInitials(updated.initials || computedInitials);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      refreshUser();
    } catch (err: any) {
      console.error("Failed to update teacher profile:", err);
      setError(err?.message || "Failed to update profile details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Live avatar initials preview
  const previewInitials = (
    initials.trim() ||
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2) ||
    "TC"
  ).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-emerald-600 tracking-wider uppercase">Teacher Portal &amp; Settings</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1 font-serif">Educator Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your teaching title, qualification badges, biography, and contact credentials.
        </p>
      </div>

      {/* Hero Badge Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-[#111c2e] to-emerald-950 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg ring-4 ring-white/10">
            {previewInitials}
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-gray-900 rounded-full" title="Active Educator" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {title ? `${title} ` : ""}{name || "Teacher Name"}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck size={13} /> Verified Educator
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
            {qualification && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-emerald-200 border border-white/10">
                <Award size={13} /> {qualification}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
              <GraduationCap size={13} /> Faculty Member
            </span>
          </div>

          {bio && (
            <p className="text-xs text-gray-300 max-w-xl line-clamp-2 italic pt-1">
              &ldquo;{bio}&rdquo;
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium justify-end">
              <Sparkles size={14} /> Profile Status
            </div>
            <span className="text-sm font-bold text-white block mt-0.5">Active &amp; Visible</span>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-fadeIn">
          <Check size={18} className="text-emerald-600 flex-shrink-0" />
          <div>
            <strong>Profile updated successfully!</strong> Your teacher details and sidebar badge have been updated.
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium animate-fadeIn">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <div>
            <strong>Update failed:</strong> {error}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Professional Information */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-5 mb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Personal &amp; Professional Details</h3>
              <p className="text-xs text-gray-500">Your public teaching credentials and identification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div>
              <label htmlFor="teacherTitle" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Title / Salutation
              </label>
              <select
                id="teacherTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
                <option value="Rev.">Rev.</option>
              </select>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="teacherName" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="teacherName"
                  type="text"
                  required
                  placeholder="e.g. ranil lanka"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Displayed on class batches, announcements, and schedules.</p>
            </div>

            {/* Display Initials */}
            <div>
              <label htmlFor="teacherInitials" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Display Initials
              </label>
              <input
                id="teacherInitials"
                type="text"
                maxLength={4}
                placeholder="e.g. RL"
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1">Two-letter initials for your sidebar avatar badge.</p>
            </div>

            {/* Highest Qualification */}
            <div>
              <label htmlFor="teacherQualification" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Highest Qualification / Degree
              </label>
              <div className="relative">
                <input
                  id="teacherQualification"
                  type="text"
                  placeholder="e.g. B.Sc (Hons) Chemistry, or degree"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Shown below your name in the teacher portal sidebar badge.</p>
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <label htmlFor="teacherBio" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Professional Bio &amp; Experience
              </label>
              <textarea
                id="teacherBio"
                rows={3}
                placeholder="Brief summary of your academic background, experience, and subjects taught..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1">Visible to enrolled students in batch descriptions and profiles.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Account Information */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-5 mb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Contact &amp; Account Identity</h3>
              <p className="text-xs text-gray-500">Contact details and login credentials</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phone */}
            <div>
              <label htmlFor="teacherPhone" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Contact Phone Number
              </label>
              <div className="relative">
                <input
                  id="teacherPhone"
                  type="tel"
                  placeholder="e.g. 071 234 5678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Used for administrative communication and SMS alerts.</p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Primary teacher login credential.</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} /> Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

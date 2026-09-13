"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStudentProfile, updateStudentProfile } from "@/services/studentService";
import type { StudentProfile } from "@/lib/types/student";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  Languages, 
  ShieldCheck, 
  Copy, 
  Check, 
  Save, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Lock
} from "lucide-react";

export function StudentSettingsPage() {
  const { user, loading: authLoading, updateUser, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Form fields state
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [exam, setExam] = useState("");
  const [stream, setStream] = useState("");
  const [medium, setMedium] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");

  // Initial backup for "Reset" action
  const [initialState, setInitialState] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "STUDENT") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const profile = await getStudentProfile();

        if (cancelled) return;

        setName(profile.name || user?.name || "");
        setInitials(profile.initials || user?.initials || "");
        setPhoneNumber(profile.phoneNumber || user?.phoneNumber || "");
        setDateOfBirth(profile.dateOfBirth || user?.dateOfBirth || "");
        setExam(profile.exam || user?.exam || "G.C.E. Advanced Level 2026");
        setStream(profile.stream || user?.stream || "Physical Science");
        setMedium(profile.medium || user?.medium || "Sinhala Medium");
        setStudentId(profile.studentId || user?.studentId || "ST-NEW001");
        setEmail(profile.email || user?.email || "");

        setInitialState(profile);
      } catch (err: any) {
        console.error("Failed to load student profile:", err);
        // Fallback to AuthContext values
        if (!cancelled && user) {
          setName(user.name || "");
          setInitials(user.initials || "");
          setPhoneNumber(user.phoneNumber || "");
          setDateOfBirth(user.dateOfBirth || "");
          setExam(user.exam || "G.C.E. Advanced Level 2026");
          setStream(user.stream || "Physical Science");
          setMedium(user.medium || "Sinhala Medium");
          setStudentId(user.studentId || "ST-NEW001");
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
      setName(initialState.name || "");
      setInitials(initialState.initials || "");
      setPhoneNumber(initialState.phoneNumber || "");
      setDateOfBirth(initialState.dateOfBirth || "");
      setExam(initialState.exam || "");
      setStream(initialState.stream || "");
      setMedium(initialState.medium || "");
    } else if (user) {
      setName(user.name || "");
      setInitials(user.initials || "");
      setPhoneNumber(user.phoneNumber || "");
      setDateOfBirth(user.dateOfBirth || "");
      setExam(user.exam || "");
      setStream(user.stream || "");
      setMedium(user.medium || "");
    }
    setError(null);
    setSaveSuccess(false);
  }

  function handleCopyId() {
    if (!studentId) return;
    navigator.clipboard.writeText(studentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
            .toUpperCase() || "ST";

      const updated = await updateStudentProfile({
        name: name.trim(),
        initials: computedInitials,
        phoneNumber: phoneNumber.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        exam: exam || undefined,
        stream: stream || undefined,
        medium: medium || undefined,
      });

      // Update AuthContext user so sidebar and header reflect immediately
      updateUser({
        name: updated.name || name.trim(),
        initials: updated.initials || computedInitials,
        phoneNumber: updated.phoneNumber || phoneNumber.trim(),
        dateOfBirth: updated.dateOfBirth || dateOfBirth,
        exam: updated.exam || exam,
        stream: updated.stream || stream,
        medium: updated.medium || medium,
      });

      setInitials(updated.initials || computedInitials);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      // Also trigger refreshUser in background for consistency
      refreshUser();
    } catch (err: any) {
      console.error("Failed to update profile:", err);
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
    "ST"
  ).toUpperCase();

  return (
    <div className="profile-settings-container">
      {/* Page Header */}
      <header className="profile-settings-header">
        <div>
          <p className="profile-settings-eyebrow">ACCOUNT &amp; PROFILE</p>
          <h1 className="profile-settings-title">Student Profile Settings</h1>
          <p className="profile-settings-subtitle">
            Update your personal information, academic stream, and contact preferences.
          </p>
        </div>
      </header>

      {/* Hero Badge Card with Live Preview */}
      <div className="profile-hero-card">
        <div className="profile-hero-avatar-wrapper">
          <div className="profile-hero-avatar">{previewInitials}</div>
          <span className="profile-hero-online-dot" title="Active Student" />
        </div>

        <div className="profile-hero-info">
          <div className="profile-hero-name-row">
            <h2 className="profile-hero-name">{name || "Student Name"}</h2>
            <span className="profile-hero-status-pill">
              <ShieldCheck size={14} /> Active Student
            </span>
          </div>

          <div className="profile-hero-meta-row">
            <div className="profile-hero-meta-chip">
              <span className="meta-label">ID</span>
              <strong className="meta-val">{studentId || "ST-NEW001"}</strong>
              <button
                type="button"
                className="copy-id-btn"
                onClick={handleCopyId}
                title="Copy Student ID"
              >
                {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>

            {stream && (
              <span className="profile-hero-tag">
                <BookOpen size={13} /> {stream}
              </span>
            )}
            {medium && (
              <span className="profile-hero-tag">
                <Languages size={13} /> {medium}
              </span>
            )}
            {exam && (
              <span className="profile-hero-tag">
                <GraduationCap size={13} /> {exam}
              </span>
            )}
          </div>
        </div>

        <div className="profile-hero-aside">
          <div className="profile-completion-box">
            <div className="completion-label">
              <Sparkles size={14} className="text-amber-400" /> Profile Status
            </div>
            <span className="completion-val">100% Complete</span>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {saveSuccess && (
        <div className="profile-alert profile-alert-success" role="alert">
          <Check size={18} />
          <div>
            <strong>Changes saved successfully!</strong>
            <span>Your profile details and sidebar badge have been updated.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="profile-alert profile-alert-error" role="alert">
          <AlertCircle size={18} />
          <div>
            <strong>Update failed</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="profile-settings-form">
        <div className="profile-sections-grid">
          {/* Section 1: Personal Information */}
          <section className="profile-form-section">
            <div className="section-head">
              <div className="section-icon-badge">
                <User size={18} />
              </div>
              <div>
                <h3 className="section-title">Personal Details</h3>
                <p className="section-desc">Your basic identification and contact credentials</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="form-field-group">
                <label htmlFor="studentName" className="form-label">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    id="studentName"
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <p className="form-help-text">Displayed on class registers, certificates, and reports.</p>
              </div>

              <div className="form-field-group">
                <label htmlFor="studentInitials" className="form-label">
                  Display Initials
                </label>
                <div className="input-with-icon">
                  <span className="input-icon font-bold text-xs">AA</span>
                  <input
                    id="studentInitials"
                    type="text"
                    maxLength={4}
                    className="form-input"
                    placeholder="e.g. PA"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  />
                </div>
                <p className="form-help-text">Initials shown in your avatar badge across the app.</p>
              </div>

              <div className="form-field-group">
                <label htmlFor="studentPhone" className="form-label">
                  Contact Phone Number
                </label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input
                    id="studentPhone"
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 077 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <p className="form-help-text">Used for SMS notices and urgent class schedule updates.</p>
              </div>

              <div className="form-field-group">
                <label htmlFor="studentDob" className="form-label">
                  Date of Birth
                </label>
                <div className="input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input
                    id="studentDob"
                    type="date"
                    className="form-input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <p className="form-help-text">Used for age verification and exam batch registration.</p>
              </div>
            </div>
          </section>

          {/* Section 2: Academic Preferences */}
          <section className="profile-form-section">
            <div className="section-head">
              <div className="section-icon-badge">
                <GraduationCap size={18} />
              </div>
              <div>
                <h3 className="section-title">Academic Stream &amp; Exam</h3>
                <p className="section-desc">Tailors your study materials and class suggestions</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="form-field-group">
                <label htmlFor="studentExam" className="form-label">
                  Target Examination / Batch Year
                </label>
                <div className="input-with-icon">
                  <GraduationCap size={16} className="input-icon" />
                  <select
                    id="studentExam"
                    className="form-select"
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                  >
                    <option value="G.C.E. Advanced Level 2026">G.C.E. Advanced Level 2026</option>
                    <option value="G.C.E. Advanced Level 2025">G.C.E. Advanced Level 2025</option>
                    <option value="G.C.E. Advanced Level 2027">G.C.E. Advanced Level 2027</option>
                    <option value="G.C.E. Ordinary Level">G.C.E. Ordinary Level</option>
                    <option value="General &amp; Foundation">General &amp; Foundation</option>
                  </select>
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="studentStream" className="form-label">
                  Study Stream
                </label>
                <div className="input-with-icon">
                  <BookOpen size={16} className="input-icon" />
                  <select
                    id="studentStream"
                    className="form-select"
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                  >
                    <option value="Physical Science (Combined Maths)">Physical Science (Combined Maths)</option>
                    <option value="Biological Science">Biological Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Technology (Engineering/Bio)">Technology (Engineering/Bio)</option>
                    <option value="Arts &amp; Humanities">Arts &amp; Humanities</option>
                    <option value="General Studies">General Studies</option>
                  </select>
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="studentMedium" className="form-label">
                  Medium of Study
                </label>
                <div className="input-with-icon">
                  <Languages size={16} className="input-icon" />
                  <select
                    id="studentMedium"
                    className="form-select"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                  >
                    <option value="Sinhala Medium">Sinhala Medium</option>
                    <option value="English Medium">English Medium</option>
                    <option value="Tamil Medium">Tamil Medium</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Read-Only Institutional Identifiers */}
          <section className="profile-form-section">
            <div className="section-head">
              <div className="section-icon-badge">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="section-title">Institutional Credentials</h3>
                <p className="section-desc">Fixed credentials managed by institute administration</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="form-field-group">
                <label className="form-label">
                  Permanent Student ID
                </label>
                <div className="input-with-icon input-readonly">
                  <ShieldCheck size={16} className="input-icon text-emerald-500" />
                  <input
                    type="text"
                    className="form-input form-input-locked"
                    value={studentId}
                    readOnly
                    disabled
                  />
                </div>
                <p className="form-help-text">Assigned unique identifier for all tuition invoices and class attendance.</p>
              </div>

              <div className="form-field-group">
                <label className="form-label">
                  Registered Email
                </label>
                <div className="input-with-icon input-readonly">
                  <Mail size={16} className="input-icon text-slate-400" />
                  <input
                    type="email"
                    className="form-input form-input-locked"
                    value={email}
                    readOnly
                    disabled
                  />
                </div>
                <p className="form-help-text">Primary login email address. Contact support to change your account email.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Action Bar */}
        <div className="profile-form-actions">
          <button
            type="button"
            className="btn-secondary-custom"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            type="submit"
            className="btn-primary-custom"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-sm" /> Saving Changes...
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

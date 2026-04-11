import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser, updateProfile,
  changePassword, addEmail,
  verifyProfileEmail
} from "../../api/auth.api.js";
import { getUserStats as getStats } from "../../api/stats.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import useAuthStore from "../../store/auth.store.js";
import toast from "react-hot-toast";
import { User, Lock, Mail, BarChart2, Eye, EyeOff, TrendingUp, GitBranch, GitPullRequest, Users } from "lucide-react";

const S = {
  card: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 14, padding: 24 },
  label: { display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 },
  input: {
    width: "100%", background: "rgba(13,17,23,0.8)",
    border: "1px solid var(--border-default)", borderRadius: 10,
    padding: "10px 14px", fontSize: 14, color: "var(--text-primary)",
    outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "inherit",
    boxSizing: "border-box"
  },
  inputDisabled: {
    width: "100%", background: "rgba(13,17,23,0.4)",
    border: "1px solid var(--border-subtle)", borderRadius: 10,
    padding: "10px 14px", fontSize: 14, color: "var(--text-muted)",
    outline: "none", fontFamily: "inherit", cursor: "not-allowed", boxSizing: "border-box"
  },
  btnPrimary: {
    display: "block", width: "100%", padding: "11px 20px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
    border: "none", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
  },
};

const ProfilePage = () => {
  const { user: authUser, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({ fullName: authUser?.fullName || "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [emailForm, setEmailForm] = useState({ email: "" });
  const [otp, setOtp] = useState("");

  const { data: statsData } = useQuery({ queryKey: ["userStats"], queryFn: () => getStats() });
  const stats = statsData?.data?.data;

  const { mutate: updateProfileMutate, isPending: updatingProfile } = useMutation({
    mutationFn: () => updateProfile(profileForm),
    onSuccess: (res) => { setUser(res.data.data); toast.success("Profile updated!"); queryClient.invalidateQueries({ queryKey: ["currentUser"] }); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const { mutate: changePass, isPending: changingPass } = useMutation({
    mutationFn: () => changePassword(passwordForm),
    onSuccess: () => { toast.success("Password changed!"); setPasswordForm({ oldPassword: "", newPassword: "" }); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const { mutate: addEmailMutate, isPending: addingEmail } = useMutation({
    mutationFn: () => addEmail({ email: emailForm.email }),
    onSuccess: () => { toast.success("OTP sent to your email!"); setShowOtp(true); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const { mutate: verifyEmail, isPending: verifyingEmail } = useMutation({
    mutationFn: () => verifyProfileEmail({ otp }),
    onSuccess: (res) => {
      toast.success("Email verified!");
      setUser(res.data.data);
      setShowOtp(false);
      setEmailForm({ email: "" });
      setOtp("");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "email", label: "Email", icon: Mail },
    { id: "stats", label: "Stats", icon: BarChart2 }
  ];

  const inputFocus = (e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.25)"; };
  const inputBlur = (e) => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; };

  const statCards = [
    { label: "Repos Owned", value: stats?.overview?.reposOwned || 0, icon: GitBranch, gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)", glow: "0 8px 24px rgba(37,99,235,0.25)" },
    { label: "Contributing To", value: stats?.overview?.reposContributed || 0, icon: Users, gradient: "linear-gradient(135deg, #7c3aed, #5b21b6)", glow: "0 8px 24px rgba(124,58,237,0.25)" },
    { label: "Total PRs", value: stats?.pullRequests?.total || 0, icon: GitPullRequest, gradient: "linear-gradient(135deg, #059669, #047857)", glow: "0 8px 24px rgba(5,150,105,0.25)" },
    { label: "Acceptance Rate", value: stats?.pullRequests?.acceptanceRate || "0%", icon: TrendingUp, gradient: "linear-gradient(135deg, #d97706, #b45309)", glow: "0 8px 24px rgba(217,119,6,0.25)" },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 600 }}>
        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: "#fff",
            boxShadow: "0 0 20px rgba(37,99,235,0.4)"
          }}>
            {authUser?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.6px", marginBottom: 2 }}>
              {authUser?.fullName}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>@{authUser?.username}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)", borderRadius: 12,
          padding: 4, marginBottom: 20
        }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 12px", borderRadius: 9, fontSize: 13, fontWeight: 500,
                border: "none", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                ...(activeTab === id
                  ? { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }
                  : { background: "transparent", color: "var(--text-secondary)" })
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div style={S.card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>Profile Information</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={S.label}>Username</label>
                <input value={authUser?.username} disabled style={S.inputDisabled} />
              </div>
              <div>
                <label style={S.label}>Full Name</label>
                <input
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  style={S.input} onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>
              <div>
                <label style={S.label}>Email</label>
                <input value={authUser?.email || "Not set"} disabled style={S.inputDisabled} />
              </div>
              {authUser?.phone && (
                <div>
                  <label style={S.label}>Phone</label>
                  <input value={authUser.phone} disabled style={S.inputDisabled} />
                </div>
              )}
              <button
                onClick={() => updateProfileMutate()}
                disabled={updatingProfile}
                style={{ ...S.btnPrimary, opacity: updatingProfile ? 0.5 : 1 }}
              >
                {updatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div style={S.card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>Change Password</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={S.label}>Current Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    placeholder="••••••••"
                    style={{ ...S.input, paddingRight: 40 }}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)"
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={S.label}>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  style={S.input} onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>
              <button
                onClick={() => changePass()}
                disabled={changingPass || !passwordForm.oldPassword || !passwordForm.newPassword}
                style={{ ...S.btnPrimary, opacity: (changingPass || !passwordForm.oldPassword || !passwordForm.newPassword) ? 0.5 : 1 }}
              >
                {changingPass ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === "email" && (
          <div style={S.card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              {authUser?.email ? "Update Email" : "Add Email"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              {authUser?.email
                ? `Current email: ${authUser.email}`
                : "Add an email to receive invitations and notifications"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={S.label}>Email Address</label>
                <input
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ email: e.target.value })}
                  placeholder="new@example.com"
                  style={S.input} onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {!showOtp ? (
                <button
                  onClick={() => addEmailMutate()}
                  disabled={addingEmail || !emailForm.email}
                  style={{ ...S.btnPrimary, opacity: (addingEmail || !emailForm.email) ? 0.5 : 1 }}
                >
                  {addingEmail ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <div>
                    <label style={S.label}>Enter OTP</label>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      style={{ ...S.input, letterSpacing: "0.1em", fontSize: 18, textAlign: "center" }}
                      onFocus={inputFocus} onBlur={inputBlur}
                    />
                  </div>
                  <button
                    onClick={() => verifyEmail()}
                    disabled={verifyingEmail || otp.length !== 6}
                    style={{
                      ...S.btnPrimary,
                      background: "linear-gradient(135deg, #059669, #047857)",
                      boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                      opacity: (verifyingEmail || otp.length !== 6) ? 0.5 : 1
                    }}
                  >
                    {verifyingEmail ? "Verifying..." : "Verify OTP"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {statCards.map(({ label, value, icon: Icon, gradient, glow }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                    borderRadius: 14, padding: "18px 20px", position: "relative",
                    overflow: "hidden", cursor: "default", transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = glow; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{
                    position: "absolute", top: -20, right: -20,
                    width: 80, height: 80, borderRadius: "50%",
                    background: gradient, opacity: 0.12, filter: "blur(16px)"
                  }} />
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: 34, height: 34, background: gradient, borderRadius: 9,
                      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12
                    }}>
                      <Icon size={16} color="white" strokeWidth={2} />
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-1px", lineHeight: 1, marginBottom: 4 }}>
                      {value}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {stats?.myTopRuleViolations?.length > 0 && (
              <div style={{
                background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                borderRadius: 14, padding: 20
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
                  Top Rule Violations
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {stats.myTopRuleViolations.map((v, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                          width: 18, textAlign: "right"
                        }}>#{i + 1}</span>
                        <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v.rule}</span>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                        background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)"
                      }}>
                        {v.violations}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
import { Sparkles, CheckCircle, XCircle, AlertTriangle, Lightbulb, Info } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   STEP CONFIG
   ─────────────────────────────────────────────────────────────
   This array defines the "journey" steps shown in the timeline.
   Think of it like: "Order Placed → Shipped → Delivered"
   but for AI review.

   Each step has:
   - id     : matches aiReviewStatus values from backend
   - label  : what the user sees
   - desc   : short explanation shown below the label
───────────────────────────────────────────────────────────── */
const STEPS = [
  {
    id: "created",
    label: "PR Created",
    desc: "Your pull request has been submitted",
  },
  {
    id: "pending",
    label: "Waiting in Queue",
    desc: "AI review job is queued and ready to run",
  },
  {
    id: "processing",
    label: "AI Review Processing",
    desc: "Gemini is analyzing your code right now",
  },
  {
    id: "completed",
    label: "Review Complete",
    desc: "AI review finished successfully",
  },
];

/* ─────────────────────────────────────────────────────────────
   STATUS → STEP INDEX
   ─────────────────────────────────────────────────────────────
   We need to know "how far along" the process is.
   This maps each backend status to an index in the STEPS array.
   So the timeline knows which steps to show as "done" (green),
   which is "current" (blue/animated), and which are "future" (grey).
───────────────────────────────────────────────────────────── */
const statusToStepIndex = {
  pending: 1,      // step[1] = "Waiting in Queue" is current
  processing: 2,   // step[2] = "AI Review Processing" is current
  retrying: 2,     // also step[2], but shown differently (yellow)
  completed: 3,    // step[3] = "Review Complete" is done
  failed: 2,       // stuck at step[2], but shown as failed (red)
};

/* ─────────────────────────────────────────────────────────────
   STEP DOT RENDERER
   ─────────────────────────────────────────────────────────────
   Renders the small circle on the left side of each step.
   The dot's appearance changes based on whether the step is:
   - done (before current): green checkmark
   - current:
       - processing / pending → blue pulsing dot
       - retrying             → yellow pulsing dot
       - failed               → red X
   - future (after current): grey hollow dot
───────────────────────────────────────────────────────────── */
const StepDot = ({ stepIndex, currentIndex, status }) => {
  const isDone = stepIndex < currentIndex;
  const isCurrent = stepIndex === currentIndex;

  // Steps before the current one are "done" → green
  if (isDone) {
    return (
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "rgba(5, 150, 105, 0.15)",
        border: "2px solid #059669",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <CheckCircle size={14} color="#34d399" />
      </div>
    );
  }

  // The current step looks different based on status
  if (isCurrent) {
    // Failed → red X
    if (status === "failed") {
      return (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.15)",
          border: "2px solid #ef4444",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <XCircle size={14} color="#f87171" />
        </div>
      );
    }

    // Retrying → yellow pulsing dot
    if (status === "retrying") {
      return (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(245, 158, 11, 0.15)",
          border: "2px solid #f59e0b",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          animation: "pulse-dot 1.5s ease-in-out infinite",
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#fbbf24",
          }} />
        </div>
      );
    }

    // processing / pending → blue pulsing dot
    return (
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "rgba(37, 99, 235, 0.15)",
        border: "2px solid #2563eb",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        animation: "pulse-dot 1.5s ease-in-out infinite",
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#60a5fa",
        }} />
      </div>
    );
  }

  // Future steps → grey hollow dot
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      background: "transparent",
      border: "2px solid var(--border-default)",
      flexShrink: 0,
    }} />
  );
};

/* ─────────────────────────────────────────────────────────────
   ISSUE BADGE HELPER
   Used when rendering the completed AI result below the tracker.
───────────────────────────────────────────────────────────── */
const issueBadge = (type) => {
  const map = {
    critical: { bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.25)" },
    warning:  { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
    suggestion: { bg: "rgba(37,99,235,0.1)", color: "#60a5fa", border: "rgba(37,99,235,0.25)" },
  };
  return map[type] || map.suggestion;
};

const issueIcons = {
  critical:   AlertTriangle,
  warning:    AlertTriangle,
  suggestion: Lightbulb,
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ─────────────────────────────────────────────────────────────
   Props:
     aiReviewStatus  — the current status string from backend
     aiResult        — the full result object (only when completed)
───────────────────────────────────────────────────────────── */
const AIReviewTracker = ({ aiReviewStatus, aiResult }) => {
  /*
    If aiReviewStatus is null/undefined (e.g. the PR query is still
    loading and we don't have data yet), show a subtle skeleton.
  */
  if (!aiReviewStatus) {
    return (
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: 14, padding: "20px 24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Sparkles size={14} color="#a78bfa" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            AI Review
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading review status...</p>
      </div>
    );
  }

  /*
    Determine where we are in the timeline.
    currentIndex = which step is the "active" one right now.

    Special case: "failed" status still maps to index 2 (the
    processing step), but the dot turns red and we show an error
    message instead of the normal step description.
  */
  const currentIndex = statusToStepIndex[aiReviewStatus] ?? 1;

  /* Label shown next to the section header badge */
  const statusBadge = {
    pending:    { label: "Pending",    bg: "rgba(245,158,11,0.1)",  color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
    processing: { label: "Processing", bg: "rgba(37,99,235,0.1)",   color: "#60a5fa", border: "rgba(37,99,235,0.25)" },
    retrying:   { label: "Retrying",   bg: "rgba(245,158,11,0.1)",  color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
    completed:  { label: "Completed",  bg: "rgba(5,150,105,0.1)",   color: "#34d399", border: "rgba(5,150,105,0.25)" },
    failed:     { label: "Failed",     bg: "rgba(239,68,68,0.1)",   color: "#f87171", border: "rgba(239,68,68,0.25)" },
  }[aiReviewStatus] || { label: aiReviewStatus, bg: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "rgba(139,92,246,0.25)" };

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: 14,
      overflow: "hidden",
    }}>

      {/* ── Section Header ────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} color="#a78bfa" />
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            AI Review
          </h2>
        </div>
        {/* Status badge in top-right corner */}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
          padding: "3px 8px", borderRadius: 99,
          background: statusBadge.bg,
          color: statusBadge.color,
          border: `1px solid ${statusBadge.border}`,
          textTransform: "uppercase",
        }}>
          {statusBadge.label}
        </span>
      </div>

      {/* ── Timeline Tracker ──────────────────────────────── */}
      <div style={{ padding: "20px 24px" }}>

        {/*
          We map over STEPS and render each one.
          Between steps we draw a vertical connector line.
          The line is green if the step above it is "done",
          grey otherwise.
        */}
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;

          /* Determine the label text colour for this step */
          let labelColor = "var(--text-muted)"; // future steps
          if (isDone) labelColor = "#34d399";   // done steps → green
          if (isCurrent) {
            if (aiReviewStatus === "failed")    labelColor = "#f87171";
            else if (aiReviewStatus === "retrying") labelColor = "#fbbf24";
            else labelColor = "var(--text-primary)";
          }

          /* Special label override for retrying/failed on step[2] */
          let displayLabel = step.label;
          let displayDesc  = step.desc;
          if (isCurrent && aiReviewStatus === "retrying") {
            displayLabel = "Retrying AI Review";
            displayDesc  = "Gemini failed — BullMQ is retrying automatically";
          }
          if (isCurrent && aiReviewStatus === "failed") {
            displayLabel = "AI Review Failed";
            displayDesc  = "All retry attempts exhausted. Please try again later.";
          }

          return (
            <div key={step.id}>
              {/* ── One step row ── */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

                {/* Left: dot */}
                <StepDot
                  stepIndex={i}
                  currentIndex={currentIndex}
                  status={aiReviewStatus}
                />

                {/* Right: label + description */}
                <div style={{ paddingTop: 4 }}>
                  <p style={{
                    fontSize: 13, fontWeight: isCurrent ? 600 : 400,
                    color: labelColor,
                    transition: "color 0.3s",
                  }}>
                    {displayLabel}
                  </p>
                  <p style={{
                    fontSize: 11, color: "var(--text-muted)",
                    marginTop: 2, lineHeight: 1.5,
                  }}>
                    {displayDesc}
                  </p>
                </div>
              </div>

              {/* ── Connector line between steps ── */}
              {i < STEPS.length - 1 && (
                <div style={{
                  marginLeft: 13,           /* centres under the 28px dot */
                  width: 2,
                  height: 28,
                  background: isDone
                    ? "rgba(5, 150, 105, 0.4)"   /* green if step above is done */
                    : "var(--border-subtle)",      /* grey if not yet reached */
                  transition: "background 0.5s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────
          AI RESULT — only shown when status === "completed"
          ─────────────────────────────────────────────────────
          WHY only here?
          Because for every other status, aiResult is null.
          There is nothing to show. Rendering an empty result
          section while processing would look broken.
      ───────────────────────────────────────────────────── */}
      {aiReviewStatus === "completed" && aiResult && (
        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 14,
          animation: "fade-in 0.4s ease both",
        }}>

          {/* Overall verdict badge */}
          {aiResult.status && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 10, alignSelf: "flex-start",
              background: aiResult.status === "good"
                ? "rgba(5,150,105,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${aiResult.status === "good"
                ? "rgba(5,150,105,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}>
              {aiResult.status === "good"
                ? <CheckCircle size={14} color="#34d399" />
                : <XCircle size={14} color="#f87171" />
              }
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: aiResult.status === "good" ? "#34d399" : "#f87171",
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                {aiResult.status === "good" ? "Looks Good" : "Needs Attention"}
              </span>
            </div>
          )}

          {/* Summary */}
          {aiResult.summary && (
            <div style={{
              padding: "12px 14px", background: "rgba(13,17,23,0.6)",
              borderRadius: 10, border: "1px solid var(--border-subtle)",
            }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Summary
              </p>
              <p style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.6 }}>
                {aiResult.summary}
              </p>
            </div>
          )}

          {/* Issues */}
          {aiResult.issues?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Issues ({aiResult.issues.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {aiResult.issues.map((issue, i) => {
                  const Icon = issueIcons[issue.type] || Info;
                  const b = issueBadge(issue.type);
                  return (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: 10,
                      background: b.bg, border: `1px solid ${b.border}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: b.color }}>
                        <Icon size={13} />
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {issue.type}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: b.color, marginBottom: 4 }}>{issue.issue}</p>
                      <p style={{ fontSize: 11, color: b.color, opacity: 0.8, marginBottom: 4 }}>{issue.why}</p>
                      <p style={{ fontSize: 11, color: b.color, opacity: 0.7 }}>Fix: {issue.fix}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Improvements */}
          {aiResult.improvements?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Improvements
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                {aiResult.improvements.map((imp, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#c9d1d9" }}>
                    <span style={{ color: "#60a5fa", flexShrink: 0 }}>→</span>
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Commit message feedback */}
          {aiResult.commitMessageFeedback && (
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#fbbf24", marginBottom: 4 }}>
                Commit Message Feedback
              </p>
              <p style={{ fontSize: 12, color: "#c9d1d9" }}>{aiResult.commitMessageFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Failed state — extra message ── */}
      {aiReviewStatus === "failed" && (
        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "16px 24px",
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "rgba(239,68,68,0.04)",
        }}>
          <XCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171", marginBottom: 4 }}>
              AI review could not be completed
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              All retry attempts have been exhausted. This does not affect your PR submission.
              The repository owner can still review your code manually.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIReviewTracker;

import React, { useEffect, useState } from "react";
import "../../../css/OpenExitInterviewModal.css";

const OpenExitInterviewModal = ({ open, onClose, studentId }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !studentId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/exit-interview/student/${studentId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load student details");
        }
        const data = await res.json();
        if (!cancelled) setDetail(data || null);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(e.message || "Failed to load data");
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, studentId]);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const student = detail?.student || detail || {};
  const answers = detail?.answers || [];

  return (
    <div className="eim-overlay" onClick={onClose}>
      <div className="eim-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eim-header">
          <h3 className="eim-title">Exit Interview Details</h3>
          <button className="eim-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="eim-body">
          {loading ? (
            <div className="eim-loading">Loading...</div>
          ) : error ? (
            <div className="eim-error">{error}</div>
          ) : (
            <>
              <div className="eim-detail-header">
                <div>
                  <div className="eim-detail-name">{student.name || "—"}</div>
                  <div className="eim-detail-small">
                    #{student.student_number || "—"} • {student.course || "—"} • {student.cluster_name || "—"}
                  </div>
                </div>
                <div className="eim-detail-small">
                  Submitted:{" "}
                  {detail?.submittedAt || detail?.submitted_date
                    ? new Date(detail.submittedAt || detail.submitted_date).toLocaleString()
                    : "—"}
                </div>
              </div>

              <div className="eim-answers">
                {answers.length > 0 ? (
                  <ul className="eim-answer-list">
                    {answers.map((a, idx) => (
                      <li key={`${a.question_id || a.questionId}-${idx}`} className="eim-answer-item">
                        <div className="eim-question">{a.question_text || a.questionText || "—"}</div>
                        <div className="eim-answer">
                          {(a.response_text || a.answerText || "").trim() || <em>No response</em>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="eim-empty">No answers submitted.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenExitInterviewModal;
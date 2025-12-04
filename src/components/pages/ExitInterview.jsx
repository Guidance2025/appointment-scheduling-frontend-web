import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Plus, Pencil, Trash2, Save, Check } from "lucide-react";
import OpenExitInterviewModal from "./modal/OpenExitInterviewModal";
import "../../css/ExitInterview.css";
import { QUESTIONS_URL, QUESTION_BY_ID_URL } from "../../api/api";

const DEFAULT_COURSES = ["ECE", "IT", "BA", "BSA", "HM", "TM", "BIT"];
const DEFAULT_CLUSTERS = ["CETE", "CBAM"];

const uniq = (arr) => Array.from(new Set(arr));

const ExitInterview = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState("students");

  // Students state
  const [course, setCourse] = useState("All");
  const [cluster, setCluster] = useState("All");
  const currentStaffId = localStorage.getItem("employeeNumber");
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [clusters, setClusters] = useState(DEFAULT_CLUSTERS);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState("");
  const [qSearch, setQSearch] = useState("");
  const [editingId, setEditingId] = useState(null); 
  const [draft, setDraft] = useState({ text: "", category: "" });
  const [saving, setSaving] = useState(false);

  // Loaders
  const loadFilters = async () => {
    try {
      const [coursesRes, clustersRes] = await Promise.all([
        fetch("/api/sections/courses"),
        fetch("/api/sections/clusters"),
      ]);
      const [coursesData, clustersData] = await Promise.all([
        coursesRes.ok ? coursesRes.json() : [],
        clustersRes.ok ? clustersRes.json() : [],
      ]);

      const fetchedCourses = (Array.isArray(coursesData) ? coursesData : [])
        .map((c) => (typeof c === "string" ? c : c?.course))
        .filter(Boolean);
      const fetchedClusters = (Array.isArray(clustersData) ? clustersData : [])
        .map((cl) => (typeof cl === "string" ? cl : cl?.cluster_name))
        .filter(Boolean);

      setCourses(uniq([...DEFAULT_COURSES, ...fetchedCourses]).sort());
      setClusters(uniq([...DEFAULT_CLUSTERS, ...fetchedClusters]).sort());
    } catch {
      setCourses(DEFAULT_COURSES);
      setClusters(DEFAULT_CLUSTERS);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/exit-interview/students?course=${encodeURIComponent(course)}&cluster=${encodeURIComponent(cluster)}`
      );
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
  setQError("");
  setQLoading(true);
  try {
    const res = await fetch(QUESTIONS_URL);
    if (!res.ok) throw new Error();
    const data = await res.json();
    setQuestions(Array.isArray(data) ? data : []);
  } catch {
    setQError("Unable to load questions. Please try again.");
    setQuestions([]);
  } finally {
    setQLoading(false);
  }
};

  const startAddNew = () => {
    setEditingId("new");
    setDraft({ text: "", category: "" });
    setQError("");
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setDraft({ text: q.text ?? "", category: q.category ?? "" });;
    setQError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ text: "", category: "", is_required: false, is_active: true });
    setQError("");
  };

  const saveQuestion = async () => {
  const text = draft.text.trim();
  if (!text) {
    setQError("Question text is required.");
    return;
  }
  if (text.length < 5) {
    setQError("Question text should be at least 5 characters.");
    return;
  }

  setQError("");
  setSaving(true);
  try {
    if (editingId === "new") {
      const res = await fetch(QUESTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          category: draft.category?.trim() || null,
          employee_number: currentStaffId, 
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setQuestions((prev) => [created, ...prev]);
    } else {
      const res = await fetch(QUESTION_BY_ID_URL(editingId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          category: draft.category?.trim() || null,
          employee_number: currentStaffId,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === updated.id ? updated : q))
      );
    }
    cancelEdit();
  } catch {
    setQError("Save failed. Please try again.");
    } finally {
    setSaving(false);
  }
};

  // Effects
  useEffect(() => {
    loadFilters().then(loadStudents);
  }, []);

  useEffect(() => {
    if (activeTab === "students") loadStudents();
  }, [course, cluster, activeTab]);

  useEffect(() => {
    if (activeTab === "questions") loadQuestions();
  }, [activeTab]);

  const filteredResults = useMemo(() => {
    let filtered = [...students];
    const searchLower = searchTerm.trim().toLowerCase();
    if (searchLower) {
      filtered = filtered.filter((s) => {
        const name = (s.name || "").toLowerCase();
        const number = (s.student_number || "").toLowerCase();
        return name.includes(searchLower) || number.includes(searchLower);
      });
    }
    if (course !== "All") filtered = filtered.filter((s) => s.course === course);
    if (cluster !== "All") filtered = filtered.filter((s) => s.cluster_name === cluster);
    return filtered;
  }, [students, searchTerm, course, cluster]);

  const hasActiveFilters = Boolean(searchTerm || course !== "All" || cluster !== "All");

  const filteredQuestions = useMemo(() => {
    const term = qSearch.trim().toLowerCase();
    if (!term) return questions;
    return questions.filter((q) => {
      const text = (q.text || "").toLowerCase();
      const cat = (q.category || "").toLowerCase();
      return text.includes(term) || cat.includes(term);
    });
  }, [qSearch, questions]);

  // UI handlers
  const handleClearFilters = () => {
    setSearchTerm("");
    setCourse("All");
    setCluster("All");
  };

  const openDetail = (studentId) => {
    setSelectedStudentId(studentId);
    setDetailOpen(true);
  };

  return (
    <div className="page-container">
      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
          type="button"
        >
          Students
        </button>
        <button
          className={`tab-button ${activeTab === "questions" ? "active" : ""}`}
          onClick={() => setActiveTab("questions")}
          type="button"
        >
          Questions
        </button>
      </div>

      {/* STUDENTS TAB */}
      {activeTab === "students" && (
        <>
          <div className="filter-bar-container">
          <div className="filter-bar filter-one-line">
            <div className="filter-group search-group">
              <label className="filter-label">
                <Search size={12} /> Search
              </label>
              <div className="input-with-clear">
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search by student name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="clear-filter-icon"
                    onClick={() => setSearchTerm("")}
                    title="Clear search"
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Course</label>
              <select className="filter-select" value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="All">All courses</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Cluster</label>
              <select className="filter-select" value={cluster} onChange={(e) => setCluster(e.target.value)}>
                <option value="All">All clusters</option>
                {clusters.map((cl) => (
                  <option key={cl} value={cl}>
                    {cl}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-actions">
              {hasActiveFilters && (
                <button className="btn-green-outline btn-same-height" onClick={handleClearFilters} type="button">
                  <X size={16} /> Clear
                </button>
              )}
            </div>
          </div>
          </div>
          <div className="appointments-content">
            {loading ? (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <p>Loading students...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="empty-message">
                {hasActiveFilters ? (
                  <div>
                    <div className="empty-icon"></div>
                    <h3 className="empty-title">No students found</h3>
                    <p className="empty-description">No students match your current filters</p>
                  </div>
                ) : (
                  <div>
                    <div className="empty-icon"></div>
                    <h3 className="empty-title">No students found</h3>
                    <p className="empty-description">There are no exit interview records.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="students-table-container">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Number</th>
                      <th>Course</th>
                      <th>Cluster</th>
                      <th>Responses</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((s) => (
                      <tr
                        key={s.student_id}
                        className="student-row"
                        onDoubleClick={() => openDetail(s.student_id)}
                      >
                        <td className="student-cell">{s.name}</td>
                        <td>{s.student_number}</td>
                        <td>{s.course}</td>
                        <td>{s.cluster_name}</td>
                        <td>
                          <span className={`status-badge ${s.has_response ? "completed" : "pending"}`}>
                            {s.has_response ? "Answered" : "Not yet"}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button className="link-button" onClick={() => openDetail(s.student_id)} type="button">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}

      {/* QUESTIONS TAB */}
      {activeTab === "questions" && (
        <>
        <div className="filter-bar-container">
          <div className="filter-bar filter-one-line">
            <div className="filter-group search-group">
              <label className="filter-label">
                <Search size={12} /> Search
              </label>
              <div className="input-with-clear">
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search by question text or category..."
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                />
                {qSearch && (
                  <button
                    className="clear-filter-icon"
                    onClick={() => setQSearch("")}
                    title="Clear search"
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="filter-actions">
              <button
                className="btn-green-btn-same-height"
                type="button"
                onClick={startAddNew}
                disabled={editingId !== null}
                title={editingId ? "Finish current edit first" : "Add a new question"}
              >
                <Plus size={17} /> Add Question
              </button>
            </div>
          </div>
        </div>

          {qError && <p className="error-text">{qError}</p>}

          <div className="appointments-content">
            {qLoading ? (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <p>Loading questions...</p>
              </div>
            ) : filteredQuestions.length === 0 && editingId !== "new" ? (
              <div className="empty-message">
                {qSearch.trim() ? (
                  <div>
                    <div className="empty-icon"></div>
                    <h3 className="empty-title">No questions found</h3>
                    <p className="empty-description">No questions match your current search.</p>
                  </div>
                ) : (
                  <div>
                    <div className="empty-icon"></div>
                    <h3 className="empty-title">No questions found</h3>
                    <p className="empty-description">There are no questions yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="students-table-container">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th className="col-question">Question</th>
                      <th className="col-category">Category</th>
                      <th className="col-actions text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingId === "new" && (
                      <tr>
                        <td>
                          <input
                            className="table-input table-input-lg"
                            type="text"
                            placeholder="Type the question..."
                            value={draft.text}
                            onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            className="table-input"
                            type="text"
                            placeholder="Category (optional)"
                            value={draft.category}
                            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                          />
                        </td>
                        <td className="actions-cell">
                          <button
                            className="btn-icon-green"
                            type="button"
                            onClick={saveQuestion}
                            disabled={saving}
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button className="btn-icon-green-outline" type="button" onClick={cancelEdit} title="Cancel">
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    )}

                    {filteredQuestions.map((q) =>
                      editingId === q.id ? (
                        <tr key={q.id}>
                          <td>
                            <input
                              className="table-input table-input-lg"
                              type="text"
                              value={draft.text}
                              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              className="table-input"
                              type="text"
                              value={draft.category}
                              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                            />
                          </td>
                          <td className="actions-cell">
                            <button
                              className="btn-icon-green"
                              type="button"
                              onClick={saveQuestion}
                              disabled={saving}
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button className="btn-icon-green-outline" type="button" onClick={cancelEdit} title="Cancel">
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={q.id}>
                          <td>{q.text}</td>
                          <td>{q.category || "—"}</td>
                          <td className="col-toggle">
                            <span className={`status-badge ${q.is_required ? "completed" : "pending"}`}>
                              {q.is_required ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button className="icon-btn" type="button" onClick={() => startEdit(q)} title="Edit">
                              <Pencil size={16} /> Edit
                            </button>
                            <button
                              className="icon-btn danger"
                              type="button"
                              onClick={() => deleteQuestion(q)}
                              title="Delete"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <OpenExitInterviewModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        studentId={selectedStudentId}
      />
    </div>
  );
};

export default ExitInterview;

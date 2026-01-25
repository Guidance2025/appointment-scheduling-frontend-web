import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import "../../css/MoodTrend.css";
import { MOODS_URL } from "../../../constants/api";

const StudentEntryModal = ({ student, entries, onClose }) => (
  <div className="modal-card">
    <div className="modal-header">
      <h4>Entries for {student?.name}</h4>
    </div>
    <div className="modal-body">
      {entries.length > 0 ? (
        <ul className="mood-entries">
          {entries.map((entry) => (
            <li key={entry.id} className="mood-entry">
              <span className="entry-emotions">
                {entry.emotions.join(", ")}  {/* Display multiple emotions */}
              </span>
              <span className="entry-date">
                {new Date(entry.entryDate).toLocaleDateString()}
              </span>
              <span className="entry-notes">{entry.note || "No notes"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No mood entries found.</p>
      )}
    </div>
    <div className="modal-actions">
      <button className="filter-button secondary" onClick={onClose}>Close</button>
    </div>
  </div>
);

const MoodTrend = () => {
  const [students, setStudents] = useState([]);
  const [emotionFilter, setEmotionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(MOODS_URL);
        const data = await res.json();
        const studentMap = {};
        (data || []).forEach((entry) => {
          const student = entry.student;
          if (!student) return;
          const studentId = student.id;
          if (!studentMap[studentId]) {
            studentMap[studentId] = {
              id: studentId,
              name: `${student.person?.firstName || ''} ${student.person?.lastName || ''}`.trim(),
              student_number: student.studentNumber,
              course: student.section?.course,
              cluster_name: student.section?.clusterName,
              latest_emotions: entry.emotions || [],  // Parse from backend
              last_entry_date: entry.entryDate,
              entries: [],
            };
          }
          // Update latest if newer
          if (new Date(entry.entryDate) > new Date(studentMap[studentId].last_entry_date)) {
            studentMap[studentId].latest_emotions = entry.emotions || [];
            studentMap[studentId].last_entry_date = entry.entryDate;
          }
          studentMap[studentId].entries.push({
            id: entry.id,
            emotions: entry.emotions || [],
            entryDate: entry.entryDate,
            note: entry.moodNotes,
          });
        });
        const processedStudents = Object.values(studentMap);
        setStudents(processedStudents);
      } catch (e) {
        console.error("Failed to load students:", e);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesEmotion = !emotionFilter || student.latest_emotions.includes(emotionFilter);
    const matchesSearch =
      !searchTerm ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_number.includes(searchTerm);
    return matchesEmotion && matchesSearch;
  });

  const onSelectStudent = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    setEntries(student.entries || []);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setEntries([]);
  };

  const hasActiveFilters = searchTerm || emotionFilter !== "";

  const handleClearFilters = () => {
    setSearchTerm("");
    setEmotionFilter("");
  };

  return (
    <div className="page-container">
      <div className="appointments-filter-bar">
        <div className="appointments-filter-row">
          <div className="appointments-filter-group appointments-search-group">
            <label className="appointments-filter-label">
              <Search size={12} style={{ marginRight: "4px" }} />
              Search
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="appointments-filter-input"
                placeholder="Search by student name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="appointments-clear-filter-icon"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="appointments-filter-group appointments-status-group">
            <label className="appointments-filter-label">Emotional State</label>
            <select
              className="appointments-filter-select"
              value={emotionFilter}
              onChange={(e) => setEmotionFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="angry">Angry</option>
              <option value="frustrated">Frustrated</option>
              <option value="worried">Worried</option>
              <option value="sad">Sad</option>
              <option value="calm">Calm</option>
              <option value="happy">Happy</option>
              <option value="excited">Excited</option>
              <option value="tired">Tired</option>
              <option value="hopeful">Hopeful</option>
            </select>
          </div>
        </div>
      </div>

      <div className="appointments-content">
        {loading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-message">
            {hasActiveFilters ? (
              <div>
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No students found</h3>
                <p className="empty-description">No students match your current filters</p>
              </div>
            ) : (
              <div>
                <div className="empty-icon">📊</div>
                <h3 className="empty-title">No students found</h3>
                <p className="empty-description">There are no mood trend records.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Number</th>
                  <th>Course</th>
                  <th>Cluster</th>
                  <th>Latest Emotions</th>
                  <th>Last Entry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const isAtRisk = student.latest_emotions.some(e => ["angry", "frustrated", "worried", "sad"].includes(e));
                  return (
                    <tr
                      key={student.id}
                      className={`student-row ${isAtRisk ? "at-risk" : ""}`}
                      onClick={() => onSelectStudent(student)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") onSelectStudent(student); }}
                      role="button"
                      aria-label={`View entries for ${student.name}`}
                    >
                      <td className="student-cell">{student.name}</td>
                      <td>{student.student_number}</td>
                      <td>{student.course}</td>
                      <td>{student.cluster_name}</td>
                      <td>
                        <span className={`mood-emotions ${isAtRisk ? "mood-low" : "mood-normal"}`}>
                          {student.latest_emotions.join(", ")}
                        </span>
                      </td>
                      <td>{new Date(student.last_entry_date).toLocaleDateString()}</td>
                      <td>
                        {isAtRisk ? (
                          <span className="at-risk-indicator" title="At Risk">⚠️ At Risk</span>
                        ) : (
                          "Normal"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedStudent && (
        <div className="modal">
          <StudentEntryModal student={selectedStudent} entries={entries} onClose={closeModal} />
        </div>
      )}
    </div>
  );
};

export default MoodTrend;
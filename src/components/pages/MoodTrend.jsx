import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import "../../css/MoodTrend.css";

const StudentEntryModal = ({ student, entries, onClose }) => (
  <div className="modal-card">
    <div className="modal-header">
      <h4>Entries for {student?.name}</h4>
    </div>
    <div className="modal-body">
      {entries.length > 0 ? (
        <ul className="mood-entries">
          {entries.map((entry) => (
            <li key={entry.mood_id} className="mood-entry">
              <span className={`mood-score mood-${entry.mood < 5 ? "low" : "normal"}`}>
                {entry.mood}/10
              </span>
              <span className="entry-date">
                {new Date(entry.entry_date).toLocaleDateString()}
              </span>
              <span className="entry-notes">{entry.mood_notes}</span>
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
        const res = await fetch("/api/mood-trend/students");
        const data = await res.json();
        setStudents(data || []);
      } catch (e) {
        console.error("Failed to load students:", e);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const getEmotion = (score) => {
    if (score >= 9) return "amazing";
    if (score >= 7) return "happy";
    if (score >= 5) return "neutral";
    return "sad";
  };

  const filteredStudents = students.filter((student) => {
    const emotion = getEmotion(student.latest_mood);
    const matchesEmotion = !emotionFilter || emotion === emotionFilter;
    const matchesSearch =
      !searchTerm ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_number.includes(searchTerm);
    return matchesEmotion && matchesSearch;
  });

  const onSelectStudent = async (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    try {
      const res = await fetch(`/api/mood-trend/${student.id}/entries`);
      const data = await res.json();
      setEntries(data || []);
    } catch (e) {
      console.error("Failed to load mood entries:", e);
    }
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
      <div className="advanced-filter-bar">
        <div className="filter-row">
          <div className="filter-group search-group">
            <label className="filter-label">
              <Search size={12} style={{ display: "inline", marginRight: "4px" }} />
              Search
            </label>
            <div style={{ position: "relative" }}>
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
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="filter-group type-group">
            <label className="filter-label">Emotional State</label>
            <select
              className="filter-select"
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
            </select>
          </div>

          <div className="filter-actions">
            {hasActiveFilters && (
              <button className="filter-button secondary" onClick={handleClearFilters}>
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
                <div className="empty-icon">📋</div>
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
                  <th>Latest Mood</th>
                  <th>Last Entry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const emotion = getEmotion(student.latest_mood);
                  return (
                    <tr
                      key={student.id}
                      className={`student-row ${emotion === "sad" ? "at-risk" : ""}`}
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
                        <span className={`mood-score mood-${emotion}`}>
                          {student.latest_mood}/10 ({emotion})
                        </span>
                      </td>
                      <td>{student.last_entry_date}</td>
                      <td>
                        {emotion === "sad" ? (
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
import React, { useState, useEffect, useCallback } from "react";
import { Search, Download } from "lucide-react";
import "../../css/MoodTrend.css";
import { MOODS_URL } from "../../../constants/api";

const EMOTION_COLORS = {
  angry: "emotion-angry",
  frustrated: "emotion-frustrated",
  worried: "emotion-worried",
  sad: "emotion-sad",
  calm: "emotion-calm",
  happy: "emotion-happy",
  excited: "emotion-excited",
  tired: "emotion-tired",
  hopeful: "emotion-hopeful",
};

const StudentEntryModal = ({ student, entries, onClose }) => {
  const exportToCSV = () => {
    try {
     
      const csvData = entries.map((entry, index) => ({
        'Entry #': index + 1,
        'Date': new Date(entry.entryDate).toLocaleDateString(),
        'Emotions': entry.emotions.join('; '), 
        'Notes': (entry.note || 'No notes').replace(/"/g, '""'), 
        'Risk Level': entry.emotions?.some(e => ["angry", "frustrated", "worried", "sad"].includes(e)) ? 'At Risk' : 'Normal'
      }));

    
      const headers = ['Entry #', 'Date', 'Emotions', 'Notes', 'Risk Level'];
      
      const csvContent = [
        `Student Information,${student.name},Student Number,${student.studentNumber || 'N/A'}`,
        `Export Date,${new Date().toLocaleDateString()},Total Entries,${entries.length}`,
        '', 
        
        headers.join(','),
        
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
              return `"${value}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `${student.name.replace(/\s+/g, '_')}_Mood_History_${currentDate}.csv`;
      link.setAttribute('download', fileName);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`CSV file exported: ${fileName}`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export CSV file. Please try again.');
    }
  };

  const exportToExcelHTML = () => {
    try {
      
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Mood History - ${student.name}</title>
            <style>
              table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .header { background-color: #4A9782; color: white; }
              .at-risk { background-color: #fee2e2; }
              .normal { background-color: #d1fae5; }
            </style>
          </head>
          <body>
            <h2>Mood History Report</h2>
            <table>
              <tr class="header"><td colspan="5"><strong>Student Information</strong></td></tr>
              <tr><td><strong>Name:</strong></td><td>${student.name}</td><td><strong>Student Number:</strong></td><td>${student.studentNumber || 'N/A'}</td><td></td></tr>
              <tr><td><strong>Export Date:</strong></td><td>${new Date().toLocaleDateString()}</td><td><strong>Total Entries:</strong></td><td>${entries.length}</td><td></td></tr>
              <tr><td colspan="5">&nbsp;</td></tr>
              <tr class="header">
                <th>Entry #</th>
                <th>Date</th>
                <th>Emotions</th>
                <th>Notes</th>
                <th>Risk Level</th>
              </tr>
              ${entries
                .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
                .map((entry, index) => {
                  const riskLevel = entry.emotions?.some(e => ["angry", "frustrated", "worried", "sad"].includes(e)) ? 'At Risk' : 'Normal';
                  const rowClass = riskLevel === 'At Risk' ? 'at-risk' : 'normal';
                  return `
                    <tr class="${rowClass}">
                      <td>${entries.length - index}</td>
                      <td>${new Date(entry.entryDate).toLocaleDateString()}</td>
                      <td>${entry.emotions.join(', ')}</td>
                      <td>${entry.note || 'No notes'}</td>
                      <td>${riskLevel}</td>
                    </tr>
                  `;
                }).join('')}
            </table>
            <p><em>Generated on ${new Date().toLocaleString()}</em></p>
          </body>
        </html>
      `;


      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `${student.name.replace(/\s+/g, '_')}_Mood_History_${currentDate}.xls`;
      link.setAttribute('download', fileName);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`Excel HTML file exported: ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel HTML:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  return (
    <div className="modal-card">
      <div className="modal-header">
        <h4>Mood Entries for {student?.name}</h4>
      </div>
      <div className="modal-body">
        {entries.length > 0 ? (
          <>
            <div className="mood-summary">
              <p className="summary-text">
                <strong>Total Entries:</strong> {entries.length} | 
                <strong> Date Range:</strong> {
                  entries.length > 0 ? 
                  `${new Date(Math.min(...entries.map(e => new Date(e.entryDate)))).toLocaleDateString()} - ${new Date(Math.max(...entries.map(e => new Date(e.entryDate)))).toLocaleDateString()}` 
                  : 'N/A'
                }
              </p>
            </div>
            <ul className="mood-entries">
              {entries
                .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
                .map((entry, index) => (
                <li key={entry.id} className="mood-entry">
                  <div className="entry-header">
                    <span className="entry-number">Entry #{entries.length - index}</span>
                    <span className="entry-date">
                      {new Date(entry.entryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="entry-row">
                    <span className="entry-label">Emotions:</span>
                    <div className="emotion-bubble-group">
                      {entry.emotions.map((emotion) => (
                        <span
                          key={emotion}
                          className={`emotion-bubble ${EMOTION_COLORS[emotion] || "emotion-default"}`}
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="entry-row">
                    <span className="entry-label">Notes:</span>
                    <span className="entry-notes">{entry.note || "No notes"}</span>
                  </div>
                  {entry.emotions?.some(e => ["angry", "frustrated", "worried", "sad"].includes(e)) && (
                    <div className="risk-indicator">
                      ⚠️ At Risk
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No mood entries found.</p>
        )}
      </div>
      <div className="modal-actions">
        <button className="filter-button export-button excel" onClick={exportToExcelHTML}>
          <Download size={14} style={{ marginRight: "6px" }} />
          Export Excel
        </button>
        <button className="filter-button secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const MoodTrend = () => {
  const [moodEntries, setMoodEntries] = useState([]);
  const [emotionFilter, setEmotionFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);

  const loadMoodEntries = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwtToken");
      
      const res = await fetch(MOODS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!res.ok) {
        console.error("Failed to fetch mood entries. Status:", res.status);
        setMoodEntries([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log("API Response:", data);
      
      const entriesArray = Array.isArray(data) ? data : [];
      console.log("Processed entries:", entriesArray);
      setMoodEntries(entriesArray);
      
      const uniqueSections = new Set();
      entriesArray.forEach(entry => {
        if (entry.student?.section?.sectionName) {
          uniqueSections.add(entry.student.section.sectionName);
        }
      });
      setSections(Array.from(uniqueSections).sort());
    } catch (e) {
      console.error("Failed to load mood entries:", e);
      setMoodEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    window.triggerMoodTrendReload = () => {
      console.log("[MoodTrend] Reloading data via triggerMoodTrendReload...");
      loadMoodEntries();
    };
    
    return () => {
      delete window.triggerMoodTrendReload;
    };
  }, [loadMoodEntries]);

  useEffect(() => {
    loadMoodEntries();

    const handleMoodSubmitted = () => {
      console.log("[MoodTrend] Mood entry submitted - reloading data...");
      loadMoodEntries();
    };

    window.addEventListener('moodEntrySubmitted', handleMoodSubmitted);

    return () => {
      window.removeEventListener('moodEntrySubmitted', handleMoodSubmitted);
    };
  }, [loadMoodEntries]);

  const applyAllFilters = () => {
    let filtered = [...moodEntries];

    if (emotionFilter !== "All") {
      filtered = filtered.filter(entry => 
        entry.emotions && entry.emotions.includes(emotionFilter)
      );
    }

    if (sectionFilter !== "All") {
      filtered = filtered.filter(entry => 
        entry.student?.section?.sectionName === sectionFilter
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        const student = entry?.student;
        if (!student) return false;

        const fullName = `${student.person?.firstName || ''} ${student.person?.middleName || ''} ${student.person?.lastName || ''}`.toLowerCase();
        const studentNumber = student.studentNumber?.toLowerCase() || "";
        
        return fullName.includes(searchLower) || studentNumber.includes(searchLower);
      });
    }

    return filtered;
  };

  const filteredEntries = applyAllFilters();

  const onSelectStudent = (student, allEntries) => {
    const studentFullName = `${student.person?.firstName || ''} ${student.person?.middleName || ''} ${student.person?.lastName || ''}`.trim();
    setSelectedStudent({
      id: student.id,
      name: studentFullName,
      studentNumber: student.studentNumber
    });
    setShowModal(true);
    setEntries(allEntries);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setEntries([]);
  };

  const hasActiveFilters = searchTerm || emotionFilter !== "All" || sectionFilter !== "All";

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
              <option value="All">All</option>
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

          <div className="appointments-filter-group appointments-status-group">
            <label className="appointments-filter-label">Section</label>
            <select
              className="appointments-filter-select"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="All">All</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="appointments-content">
        {loading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading mood entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-message">
            {hasActiveFilters ? (
              <div>
                <h3 className="empty-title">No entries found</h3>
                <p className="empty-description">No mood entries match your current filters</p>
              </div>
            ) : (
              <div>
                <h3 className="empty-title">No mood entries</h3>
                <p className="empty-description">There are no mood entries yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Student Number</th>
                  <th>Full Name</th>
                  <th>Section</th>
                  <th>Emotions</th>
                  <th>Notes</th>
                  <th>Entry Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const student = entry.student;
                  if (!student) return null;
                  
                  const fullName = `${student.person?.firstName || ''} ${student.person?.middleName || ''} ${student.person?.lastName || ''}`.trim();
                  const isAtRisk = entry.emotions?.some(e => ["angry", "frustrated", "worried", "sad"].includes(e));
                  
                  const studentEntries = moodEntries
                    .filter(e => e.student?.id === student.id)
                    .map(e => ({
                      id: e.id,
                      emotions: e.emotions || [],
                      entryDate: e.entryDate,
                      note: e.moodNotes
                    }));

                  return (
                    <tr
                      key={entry.id}
                      className={`student-row ${isAtRisk ? "at-risk" : ""}`}
                      onClick={() => onSelectStudent(student, studentEntries)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") onSelectStudent(student, studentEntries); }}
                      role="button"
                      aria-label={`View all entries for ${fullName}`}
                    >
                      <td>{student.studentNumber}</td>
                      <td className="student-cell">{fullName}</td>
                      <td>{student.section?.sectionName || 'N/A'}</td>
                      <td>
                        <div className="emotion-bubble-group">
                          {entry.emotions?.length ? (
                            entry.emotions.map((emotion) => (
                              <span
                                key={emotion}
                                className={`emotion-bubble ${EMOTION_COLORS[emotion] || "emotion-default"}`}
                              >
                                {emotion}
                              </span>
                            ))
                          ) : (
                            <span className="emotion-bubble emotion-default">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="notes-cell">{entry.moodNotes || 'No notes'}</td>
                      <td>{new Date(entry.entryDate).toLocaleDateString()}</td>
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
import React, { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import OpenExitInterviewModal from "./modal/OpenExitInterviewModal";

const DEFAULT_COURSES = ["ECE", "IT", "BA", "BSA", "HM", "TM", "BIT"];
const DEFAULT_CLUSTERS = ["CETE", "CBAM"];

const uniq = (arr) => Array.from(new Set(arr));

const ExitInterview = () => {
  const [course, setCourse] = useState("All");
  const [cluster, setCluster] = useState("All");

  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [clusters, setClusters] = useState(DEFAULT_CLUSTERS);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

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

      // Normalize fetched data to arrays of strings and merge with defaults
      const fetchedCourses = (Array.isArray(coursesData) ? coursesData : [])
        .map((c) => (typeof c === "string" ? c : c?.course))
        .filter(Boolean);
      const fetchedClusters = (Array.isArray(clustersData) ? clustersData : [])
        .map((cl) => (typeof cl === "string" ? cl : cl?.cluster_name))
        .filter(Boolean);

      setCourses(uniq([...DEFAULT_COURSES, ...fetchedCourses]).sort());
      setClusters(uniq([...DEFAULT_CLUSTERS, ...fetchedClusters]).sort());
    } catch (e) {
      console.error("Failed loading filters:", e);
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
    } catch (e) {
      console.error("Failed loading students:", e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters().then(loadStudents);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [course, cluster]);

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

          <div className="filter-group status-group">
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
        ) : filteredResults.length === 0 ? (
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
                <p className="empty-description">There are no exit interview records.</p>
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
                  <th>Responses</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((s) => (
                  <tr
                    key={s.student_id}
                    className="student-row"
                    onDoubleClick={() => openDetail(s.student_id)}
                    style={{ cursor: "zoom-in" }}
                  >
                    <td className="student-cell">{s.name}</td>
                    <td>{s.student_number}</td>
                    <td>{s.course}</td>
                    <td>{s.cluster_name}</td>
                    <td className="status-cell">
                      <span className={`status-badge-table ${s.has_response ? "completed" : "pending"}`}>
                        {s.has_response ? "Answered" : "Not yet"}
                      </span>
                    </td>
                    <td>
                      <button className="link-button" onClick={() => openDetail(s.student_id)}>
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

      <OpenExitInterviewModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        studentId={selectedStudentId}
      />
    </div>
  );
};

export default ExitInterview;
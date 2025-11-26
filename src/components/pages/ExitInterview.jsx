import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const ExitInterview = () => {
  const [course, setCourse] = useState("All");
  const [cluster, setCluster] = useState("All");
  const [courses, setCourses] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadFilters = async () => {
    const [coursesRes, clustersRes] = await Promise.all([
      fetch("/api/sections/courses"),
      fetch("/api/sections/clusters"),
    ]);
    const [coursesData, clustersData] = await Promise.all([
      coursesRes.json(),
      clustersRes.json(),
    ]);
    setCourses(coursesData);
    setClusters(clustersData);
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/exit-interview/students?course=${encodeURIComponent(course)}&cluster=${encodeURIComponent(cluster)}`
      );
      const data = await res.json();
      setStudents(data || []);
    } catch (e) {
      console.error("Failed loading students:", e);
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

  const applyAllFilters = () => {
    let filtered = [...students];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((s) => {
        const name = s.name?.toLowerCase() || "";
        const number = s.student_number?.toString().toLowerCase() || "";
        return name.includes(searchLower) || number.includes(searchLower);
      });
    }

    if (course !== "All") {
      filtered = filtered.filter((s) => s.course === course);
    }
    if (cluster !== "All") {
      filtered = filtered.filter((s) => s.cluster_name === cluster);
    }

    return filtered;
  };

  const filteredResults = applyAllFilters();
  const hasActiveFilters = searchTerm || course !== "All" || cluster !== "All";

  const handleClearFilters = () => {
    setSearchTerm("");
    setCourse("All");
    setCluster("All");
  };

  return (
    <div className="page-container">
      <div className="advanced-filter-bar">
        <div className="filter-row">
          {/* Search */}
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

          {/* Course */}
          <div className="filter-group type-group">
            <label className="filter-label">Course</label>
            <select className="filter-select" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="All">All courses</option>
              {courses.map((c) => (
                <option key={c.course} value={c.course}>
                  {c.course}
                </option>
              ))}
            </select>
          </div>

          {/* Cluster */}
          <div className="filter-group status-group">
            <label className="filter-label">Cluster</label>
            <select className="filter-select" value={cluster} onChange={(e) => setCluster(e.target.value)}>
              <option value="All">All clusters</option>
              {clusters.map((cl) => (
                <option key={cl.cluster_name} value={cl.cluster_name}>
                  {cl.cluster_name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
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
                  <tr key={s.student_id} className="student-row">
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
                      <a className="link-button" href={`/exit-interview/${s.student_id}`}>
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExitInterview;
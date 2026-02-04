import { useEffect, useState } from "react";
import "../../../css/ViewStudentInformationModal.css";
import { formatAppointmentDateTime } from "../../../utils/dateTime";
import { API_BASE_URL } from "../../../../constants/api";

const ViewStudentInfoModal = ({ appointmentId, isOpen, isClose }) => {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("student");

  useEffect(() => {
    if (isOpen && appointmentId) {
      const fetchStudentInformation = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `${API_BASE_URL}/counselor/${appointmentId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${JWT_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setAppointment(data);
          } else {
            console.error("Fetch error:", response.statusText);
          }
        } catch (error) {
          console.error("Fetch error:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchStudentInformation();
    }
  }, [isOpen, appointmentId, JWT_TOKEN]);

  if (!isOpen) return null;

  return (
    <div className="student-modal-overlay" onClick={isClose}>
      <div className="student-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="student-modal-close" onClick={isClose}>×</button>

        {loading ? (
          <div className="student-modal-loading">
            <div className="loading-spinner"></div>
            <p>Loading student information...</p>
          </div>
        ) : appointment ? (
          <>
            <div className="student-modal-header">
              <div className="student-header-info">
                <h1 className="student-name">
                  {`${appointment.student?.person?.firstName || ""} ${appointment.student?.person?.middleName || ""} ${appointment.student?.person?.lastName || ""}`.trim()}
                </h1>
                <p className="student-number-badge">
                  {appointment.student?.studentNumber || "N/A"}
                </p>
              </div>
            </div>

            <div className="student-modal-tabs">
              <button
                className={`tab-button ${activeTab === "student" ? "active" : ""}`}
                onClick={() => setActiveTab("student")}
              >
                Student Info
              </button>
              <button
                className={`tab-button ${activeTab === "appointment" ? "active" : ""}`}
                onClick={() => setActiveTab("appointment")}
              >
                Appointment
              </button>
              <button
                className={`tab-button ${activeTab === "section" ? "active" : ""}`}
                onClick={() => setActiveTab("section")}
              >
                Section
              </button>
            </div>

            <div className="student-modal-content">
              {activeTab === "student" && (
                <div className="tab-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Gender</span>
                      <span className="info-value">{appointment.student?.person?.gender || "N/A"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Age</span>
                      <span className="info-value">{appointment.student?.person?.age || "N/A"}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Email</span>
                      <span className="info-value">{appointment.student?.person?.email || "N/A"}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Contact Number</span>
                      <span className="info-value">{appointment.student?.person?.contactNumber || "N/A"}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Section</span>
                      <span className="info-value">{appointment.student?.section?.sectionName || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appointment" && (
                <div className="tab-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Type</span>
                      <span className="info-value">{appointment.appointmentType || "N/A"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status</span>
                      <span className="info-value">{appointment.status || "N/A"}</span>
                    </div>

                    {(() => {
                      const { date, timeRange } = formatAppointmentDateTime(
                        appointment.scheduledDate,
                        appointment.endDate
                      );
                      return (
                        <>
                          <div className="info-item full-width">
                            <span className="info-label">Scheduled Date</span>
                            <span className="info-value">{date}</span>
                          </div>
                          <div className="info-item full-width">
                            <span className="info-label">Time</span>
                            <span className="info-value">{timeRange}</span>
                          </div>
                        </>
                      );
                    })()}

                    <div className="info-item full-width">
                      <span className="info-label">Notes</span>
                      <span className="info-value notes-text">
                        {appointment.notes || "No notes provided"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "section" && (
                <div className="tab-content">
                  <div className="info-grid">
                    <div className="info-item full-width">
                      <span className="info-label">Organization</span>
                      <span className="info-value">{appointment.student?.section?.organization || "N/A"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Cluster Name</span>
                      <span className="info-value">{appointment.student?.section?.clusterName || "N/A"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Section Name</span>
                      <span className="info-value">{appointment.student?.section?.sectionName || "N/A"}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Cluster Head</span>
                      <span className="info-value">{appointment.student?.section?.clusterHead || "N/A"}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Course</span>
                      <span className="info-value">{appointment.student?.section?.course || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ViewStudentInfoModal;

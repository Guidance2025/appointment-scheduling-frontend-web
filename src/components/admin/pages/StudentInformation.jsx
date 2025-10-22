import React, { useEffect, useState } from 'react'
import { getAllStudents } from '../../../service/admin'

const StudentInformation = () => {
    const [studentInfo,setStudentInfo] = useState([]);
    const [searchTerm,setSearchTerm] = useState('');
    const [loading,setIsLoading] = useState('');

    const fetchAllStudentInformation = async () => {

        try {
        const studentInformation = await getAllStudents();
        setStudentInfo(studentInformation);
        }catch{
          console.log(" Failed Fetching Student Information ",err)
        }
    }

    useEffect (() => {
        fetchAllStudentInformation();
    },[]);

    const filteredStudentInformation = studentInfo.filter((acc) => {
  if (!searchTerm) return true; 

  const term = searchTerm.toLowerCase();

  const fullName = `${acc.person.firstName} ${acc.person.lastName}`.toLowerCase();

  return (
   acc.studentNumber.toLowerCase().includes(term) || fullName.includes(term) || (acc.section && acc.section.sectionName.toLowerCase().includes(term))
  );
});

  return (
    <div className="page-container">
      <div className="appointments-header">
        <div className="filter-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by username or role"
            value={searchTerm.trim()}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="appointments-content">
        {loading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading accounts...</p>
          </div>
        ) : studentInfo.length === 0 ? (
          <div className="empty-message">
            {searchTerm ? (
              <div>
                <h3 className="empty-title">No accounts found</h3>
                <p className="empty-description">
                  No accounts found matching "{searchTerm}"
                </p>
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <div className="empty-icon">👥</div>
                <h3 className="empty-title">No accounts found</h3>
                <p className="empty-description">
                  There are currently no user accounts.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Student Number </th>
                  <th>Firstname</th>
                  <th>Middlename</th>
                  <th>Lastname</th>
                  <th>Age</th>
                  <th>BirthDate</th>
                  <th>Gender</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Contact Number</th>
                  <th>Organization</th>
                  <th>ClusterName</th>
                  <th>Cluster Head</th>
                  <th>Section Name</th>
                  <th>Course</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudentInformation.map((student) => (
                  <tr key={student.studentNumber} className="appointment-row">
                  <td>{student.studentNumber || "N/A"}</td>
                    <td>{student.person.firstName || "N/A"}</td>
                    <td>{student.person.middleName || "N/A"}</td>
                    <td>{student.person.lastName || "N/A"}</td>
                    <td>{student.person.age || "N/A"}</td>
                    <td>{student.person.birthdate || "N/A"}</td>
                    <td>{student.person.gender || "N/A"}</td>
                    <td>{student.person.email || "N/A"}</td>
                    <td>{student.person.address || "N/A"}</td>
                    <td>{student.person.contactNumber || "N/A"}</td>
                    <td>{student.section?.organization || "N/A"}</td>
                    <td>{student.section?.clusterName || "N/A"}</td>
                    <td>{student.section?.clusterHead || "N/A"}</td>
                    <td>{student.section?.sectionName || "N/A"}</td>
                    <td>{student.section?.course || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentInformation

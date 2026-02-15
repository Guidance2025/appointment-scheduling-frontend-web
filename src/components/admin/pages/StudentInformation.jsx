import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { getAllOrganizations, getAllStudents } from '../../../service/admin';
import './../../../css/Pagination.css';
import './../../../css/admin/StudentInformation.css';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;
const MAX_PAGES_TO_SHOW = 5;
const ORGANIZATIONS = ['ROCS', 'ELITES', 'THM SOCIETY', 'JPIA','BSA'];

const StudentInformation = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [showAllOrganizations, setShowAllOrganizations] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchAllStudentOrganizations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, organizationFilter]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch student information:', err);
    } finally {
      setIsLoading(false);
    }
  };

   const fetchAllStudentOrganizations = async () => {
    try {
      setIsLoading(true);
      const allOrganizations = await getAllOrganizations();
      setShowAllOrganizations(allOrganizations);
    } catch (err) {
      console.error('Failed to fetch all organizations:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesOrganization =
        organizationFilter === 'all' ||
        student.section?.organization === organizationFilter;

      if (!searchTerm.trim()) {
        return matchesOrganization;
      }

      const term = searchTerm.toLowerCase().trim();
      const fullName = `${student.person.firstName} ${student.person.lastName}`.toLowerCase();
      const matchesSearch =
        student.studentNumber.toLowerCase().includes(term) ||
        fullName.includes(term) ||
        student.section?.sectionName?.toLowerCase().includes(term);

      return matchesOrganization && matchesSearch;
    });
  }, [students, searchTerm, organizationFilter]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredStudents.length);
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, paginatedStudents };
  }, [filteredStudents, currentPage, itemsPerPage]);

  const getPageNumbers = useCallback(() => { 
    const { totalPages } = paginationData;
    const pages = [];

    if (totalPages <= MAX_PAGES_TO_SHOW) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= MAX_PAGES_TO_SHOW; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  }, [currentPage, paginationData]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleOrganizationChange = useCallback((e) => {
    setOrganizationFilter(e.target.value);
  }, []);

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= paginationData.totalPages) {
        setCurrentPage(page);
      }
    },
    [paginationData.totalPages]
  );

  const handleItemsPerPageChange = useCallback((e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const getDisplayAge = (student) => {
    if (student.person.age) {
      return student.person.age;
    }
    
    if (student.person.birthdate) {
      try {
        const birthdate = new Date(student.person.birthdate);
        const today = new Date();
        
        if (!isNaN(birthdate.getTime()) && birthdate <= today) {
          let calculatedAge = today.getFullYear() - birthdate.getFullYear();
          const monthDiff = today.getMonth() - birthdate.getMonth();
          const dayDiff = today.getDate() - birthdate.getDate();
          
          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            calculatedAge--;
          }
          
          return calculatedAge;
        }
      } catch {
        return 'N/A';
      }
    }
    
    return 'N/A';
  };

  const formatBirthdate = (birthdate) => {
    if (!birthdate) return 'N/A';
    
    try {
      const date = new Date(birthdate);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const renderEmptyState = () => {
    if (searchTerm) {
      return (
        <div>
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No students found</h3>
          <p className="empty-description">
            No students found matching "{searchTerm}"
          </p>
          <button className="clear-search-btn" onClick={handleClearSearch}>
            Clear search
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="empty-icon">👥</div>
        <h3 className="empty-title">No students found</h3>
        <p className="empty-description">
          There are currently no student records.
        </p>
      </div>
    );
  };

  const renderStudentRow = (student) => {
    return (
      <tr key={student.studentNumber} className="appointment-row">
        <td>{student.studentNumber || 'N/A'}</td>
        <td>{student.person.firstName || 'N/A'}</td>
        <td>{student.person.middleName || 'N/A'}</td>
        <td>{student.person.lastName || 'N/A'}</td>
        <td>{getDisplayAge(student)}</td>
        <td>{formatBirthdate(student.person.birthdate)}</td>
        <td>{student.person.gender || 'N/A'}</td>
        <td>{student.person.email || 'N/A'}</td>
        <td>{student.person.address || 'N/A'}</td>
        <td>{student.person.contactNumber || 'N/A'}</td>
        <td>{student.section?.organization || 'N/A'}</td>
        <td>{student.section?.clusterName || 'N/A'}</td>
        <td>{student.section?.clusterHead || 'N/A'}</td>
        <td>{student.section?.sectionName || 'N/A'}</td>
        <td>{student.section?.course || 'N/A'}</td>
      </tr>
    );
  };

  const { totalPages, startIndex, endIndex, paginatedStudents } = paginationData;

  return (
    <div className="page-container">
      <div className="student-filters-container">
        <div className="student-filters-wrapper">
          <div className="student-search-group">
            <label className="student-filter-label">
              <Search size={14} className="student-label-icon" />
              SEARCH
            </label>
            <div className="student-search-input-wrapper">
              <input
                type="text"
                className="student-search-input"
                placeholder="Search by student name or number..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="student-select-group">
            <label className="student-filter-label">Organization</label>
            <select
              className="student-filter-select"
              value={organizationFilter}
              onChange={handleOrganizationChange}
            >
              <option value="all">All Organizations</option>
              {showAllOrganizations.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="appointments-content">
        {isLoading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading student information...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-message">{renderEmptyState()}</div>
        ) : (
          <>
            <div className="appointments-table-container">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Student Number</th>
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
                <tbody>{paginatedStudents.map(renderStudentRow)}</tbody>
              </table>
            </div>

            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1}-{endIndex} of {filteredStudents.length}{' '}
                student records
              </div>

              <div className="pagination-controls">
                <select
                  className="pagination-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} per page
                    </option>
                  ))}
                </select>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${
                      currentPage === page ? 'active' : ''
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentInformation;
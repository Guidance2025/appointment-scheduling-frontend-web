import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import "../../css/ExitInterview.css";
import "../../css/button/button.css";
import { API_BASE_URL } from '../../../constants/api';
import { formatFullDateTimePH, isTodayPH, isThisWeekPH, isThisMonthPH } from '../../utils/dateTime';
import { usePopUp } from '../../helper/message/pop/up/provider/PopUpModalProvider';

const ExitInterview = () => {
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState(['']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [questionsData, setQuestionsData] = useState([]);
  const [fetchingQuestions, setFetchingQuestions] = useState(true);
  const [responsesData, setResponsesData] = useState([]);
  const [fetchingResponses, setFetchingResponses] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, questionId: null, questionText: '' });
  
  // Student Selection Modal States
  const [studentSelectionModal, setStudentSelectionModal] = useState({ isOpen: false });
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [selectedSection, setSelectedSection] = useState('all');
  
  const { showSuccess } = usePopUp();

  useEffect(() => {
    fetchPostedQuestions();
  }, []);

  useEffect(() => {
    if (activeTab === 'responses') {
      fetchStudentResponses();
    }
  }, [activeTab]);

  const filterByDateRange = (dateString, filterType) => {
    if (filterType === 'all') return true;
    if (!dateString) return false;

    switch (filterType) {
      case 'today':
        return isTodayPH(dateString);
      case 'week':
        return isThisWeekPH(dateString);
      case 'month':
        return isThisMonthPH(dateString);
      default:
        return true;
    }
  };

  const fetchPostedQuestions = async () => {
    try {
      setFetchingQuestions(true);
      const token = localStorage.getItem("jwtToken");
      
      if (!token) {
        console.log("No token found");
        setFetchingQuestions(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/exit-interview/student/all-questions`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestionsData(data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setFetchingQuestions(false);
    }
  };

  const fetchStudentResponses = async () => {
    try {
      setFetchingResponses(true);
      const token = localStorage.getItem("jwtToken");
      
      if (!token) {
        console.log("No token found");
        setFetchingResponses(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/exit-interview/student-response`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }

      const data = await response.json();
      const answeredResponses = data.filter(item => item.responseText && item.responseText.trim() !== '');
      setResponsesData(answeredResponses);
    } catch (err) {
      console.error('Error fetching responses:', err);
    } finally {
      setFetchingResponses(false);
    }
  };

  // Fetch all students for the selection modal
  const fetchAllStudents = async () => {
    try {
      setFetchingStudents(true);
      const token = localStorage.getItem("jwtToken");
      
      if (!token) {
        console.log("No token found");
        setFetchingStudents(false);
        return;
      }

      // Replace with your actual endpoint for fetching students
      const response = await fetch(
        `${API_BASE_URL}/students/all`, // Adjust this endpoint as needed
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setAllStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students. Please try again.');
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleAddQuestion = () => {
    if (questions.length >= 5) {
      setError('You can only create up to 5 questions.');
      return;
    }
    setQuestions([...questions, '']);
    setError('');
    setSuccess('');
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  // Open student selection modal
  const openStudentSelectionModal = async () => {
    const validQuestions = questions.filter(q => q.trim() !== '');

    if (validQuestions.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    if (validQuestions.length > 5) {
      setError('You can only create up to 5 questions.');
      return;
    }

    setError('');
    setStudentSelectionModal({ isOpen: true });
    await fetchAllStudents();
  };

  // Close student selection modal
  const closeStudentSelectionModal = () => {
    setStudentSelectionModal({ isOpen: false });
    setSelectedStudents([]);
    setStudentSearchTerm('');
    setSelectedSection('all');
  };

  // Get unique sections from all students
  const getUniqueSections = () => {
    const sections = allStudents
      .map(student => student.section?.sectionName)
      .filter(Boolean);
    return [...new Set(sections)].sort();
  };

  // Handle student selection toggle
  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Select all students in filtered view
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };

  // Select/Deselect all students in a specific section
  const handleSelectSection = (sectionName) => {
    const studentsInSection = allStudents
      .filter(student => student.section?.sectionName === sectionName)
      .map(student => student.id);
    
    const allSelected = studentsInSection.every(id => selectedStudents.includes(id));
    
    if (allSelected) {
      // Deselect all students in this section
      setSelectedStudents(prev => prev.filter(id => !studentsInSection.includes(id)));
    } else {
      // Select all students in this section
      setSelectedStudents(prev => {
        const newSelection = [...prev];
        studentsInSection.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Filter students based on search and section
  const filteredStudents = allStudents.filter(student => {
    const searchLower = studentSearchTerm.toLowerCase();
    const fullName = `${student.person?.firstName || ''} ${student.person?.middleName || ''} ${student.person?.lastName || ''}`.toLowerCase();
    const studentNumber = student.studentNumber?.toLowerCase() || '';
    
    const matchesSearch = fullName.includes(searchLower) || studentNumber.includes(searchLower);
    const matchesSection = selectedSection === 'all' || student.section?.sectionName === selectedSection;
    
    return matchesSearch && matchesSection;
  });

  const handlePost = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const validQuestions = questions.filter(q => q.trim() !== '');

      if (selectedStudents.length === 0) {
        setError('Please select at least one student.');
        setLoading(false);
        return;
      }

      const guidanceStaffId = localStorage.getItem("guidanceStaffId");
      const token = localStorage.getItem("jwtToken");
      
      if (!token || !guidanceStaffId) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const payload = {
        questionTexts: validQuestions,
        studentIds: selectedStudents // Include selected student IDs
      };

      const response = await fetch(
        `${API_BASE_URL}/exit-interview/create/${guidanceStaffId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to post questions');
      }

      const data = await response.json();
      console.log('Questions posted successfully:', data);
      showSuccess(`Questions posted successfully to ${selectedStudents.length} student(s)!`, '', 2000);
      setQuestions(['']);
      setSuccess(`Successfully posted ${data.length} question(s) to ${selectedStudents.length} student(s)!`);
      closeStudentSelectionModal();
      fetchPostedQuestions();

      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 2000);

    } catch (err) {
      console.error('Error posting questions:', err);
      setError(err.message || 'Failed to post questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestions(['']);
    setError('');
    setSuccess('');
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const openEditModal = (questionId, questionText) => {
    setEditModal({ isOpen: true, questionId, questionText });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, questionId: null, questionText: '' });
  };

  const handleUpdateQuestion = async () => {
    if (!editModal.questionText.trim()) {
      setError('Question text cannot be empty');
      return;
    }

    const { questionId, questionText } = editModal;
    closeEditModal();

    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/exit-interview/questions/${questionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ questionText: questionText.trim() })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update question' }));
        throw new Error(errorData.message || 'Failed to update question');
      }

      const updatedQuestion = await response.json();
      setSuccess('Question updated successfully!');
      fetchPostedQuestions();

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error updating question:', err);
      setError(err.message || 'Failed to update question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportStudentResponse = async (studentId, studentName) => {
    try {
      const token = localStorage.getItem("jwtToken");
      
      if (!token) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/exit-interview/student-response`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch student responses');
      }

      const allResponses = await response.json();
      
      const studentResponses = allResponses.filter(r => 
        r.student?.id === studentId && r.responseText && r.responseText.trim() !== ''
      ).sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

      if (studentResponses.length === 0) {
        alert('No responses found for this student');
        return;
      }

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Exit Interview Responses - ${studentName}</title>
            <style>
              table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .header { background-color: #16a34a; color: white; }
            </style>
          </head>
          <body>
            <h2>Exit Interview Response Report</h2>
            <table>
              <tr class="header"><td colspan="4"><strong>Student Information</strong></td></tr>
              <tr>
                <td><strong>Name:</strong></td>
                <td>${studentName}</td>
                <td><strong>Student Number:</strong></td>
                <td>${studentResponses[0]?.student?.studentNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td><strong>Export Date:</strong></td>
                <td>${formatFullDateTimePH(new Date().toISOString())}</td>
                <td><strong>Total Responses:</strong></td>
                <td>${studentResponses.length}</td>
              </tr>
              <tr><td colspan="4">&nbsp;</td></tr>
              <tr class="header">
                <th>Response #</th>
                <th>Question</th>
                <th>Response</th>
                <th>Submitted Date</th>
              </tr>
              ${studentResponses.map((response, index) => `
                <tr>
                  <td>${studentResponses.length - index}</td>
                  <td>${response.question?.questionText || 'N/A'}</td>
                  <td>${response.responseText}</td>
                  <td>${formatFullDateTimePH(response.submittedDate)}</td>
                </tr>
              `).join('')}
            </table>
            <p><em>Generated on ${formatFullDateTimePH(new Date().toISOString())}</em></p>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `${studentName.replace(/\s+/g, '_')}_Exit_Interview_${currentDate}.xls`;
      link.setAttribute('download', fileName);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`Excel file exported: ${fileName}`);
    } catch (error) {
      console.error('Error exporting student response:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  const filteredQuestions = questionsData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const staffName = `${item.guidanceStaff?.person?.firstName || ''} ${item.guidanceStaff?.person?.lastName || ''}`.toLowerCase();
    const questionText = item.questionText?.toLowerCase() || '';
    
    const matchesSearch = staffName.includes(searchLower) || questionText.includes(searchLower);
    const matchesDate = filterByDateRange(item.dateCreated, filterDate);
    
    return matchesSearch && matchesDate;
  })
  .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  const filteredResponses = responsesData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const questionText = item.question?.questionText?.toLowerCase() || '';
    const responseText = item.responseText?.toLowerCase() || '';
    
    const matchesSearch = questionText.includes(searchLower) || responseText.includes(searchLower);
    const matchesDate = filterByDateRange(item.submittedDate, filterDate);
    
    return matchesSearch && matchesDate;
  })
  .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

  return (
    <div className="page-container">
      <div className="assessment-form-card">
        <h2 className="form-title">Create Exit Interview Questions</h2>
        <p className="form-description">Add Questions (Maximum 5 questions)</p>
        
        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            color: '#155724'
          }}>
            {success}
          </div>
        )}
        
        <div className="questions-list">
          {questions.map((question, index) => (
            <div key={index} className="question-item">
              <div className="question-header">
                <label className="question-label">Question {index + 1}</label>
                {questions.length > 1 && (
                  <button
                    className="remove-question-btn"
                    onClick={() => handleRemoveQuestion(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
              <textarea
                className="question-textarea"
                placeholder="Enter your question here..."
                value={question}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                rows={3}
              />
            </div>
          ))}
        </div>

        <button 
          className="add-question-btn" 
          onClick={handleAddQuestion}
          disabled={questions.length >= 5}
          style={{
            opacity: questions.length >= 5 ? 0.5 : 1,
            cursor: questions.length >= 5 ? 'not-allowed' : 'pointer'
          }}
        >
          + Add Question {questions.length >= 5 && '(Maximum reached)'}
        </button>

        <div className="form-actions">
          <button 
            className="action-btn action-btn-clear" 
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </button>
          <button 
            className="action-btn action-btn-post btn-color-primary" 
            onClick={openStudentSelectionModal}
            disabled={loading}
          >
            Post Exit Interview
          </button>
        </div>
      </div>

      <div className="assessment-tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'questions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Posted Questions  
          </button>
          <button
            className={`tab-button ${activeTab === 'responses' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('responses')}
          >
            Student Responses
          </button>
        </div>

        <div className="assessment-filter-bar">
          <div className="assessment-filter-row">
            <div className="assessment-filter-group assessment-search-group">
              <label className="assessment-filter-label">Search</label>
              <div className="assessment-filter-input-wrapper">
                <input
                  type="text"
                  className="assessment-filter-input"
                  placeholder={activeTab === 'questions' ? 'Search by counselor or questions...' : 'Search by question or response...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="assessment-clear-filter-icon" onClick={handleClearSearch}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="assessment-filter-group assessment-date-group">
              <label className="assessment-filter-label">Date Range</label>
              <select
                className="assessment-filter-select"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        <div className="appointments-content">
          {activeTab === 'questions' ? (
            <div className="appointments-table-container">
              {fetchingQuestions ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  Loading questions...
                </div>
              ) : (
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Question Text</th>
                      <th>Posted By</th>
                      <th>Date Posted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                          {searchTerm ? 'No questions found matching your search' : 'No questions posted yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredQuestions.map((item) => (
                        <tr key={item.id} className="appointment-row">
                          <td className="questions-cell">
                            {item.questionText}
                          </td>
                          <td className="counselor-cell">
                            {item.guidanceStaff?.person?.firstName} {item.guidanceStaff?.person?.lastName}
                          </td>
                          <td className="date-cell">
                            {formatFullDateTimePH(item.dateCreated)}
                          </td>
                          <td className="action-cell">
                            <button
                              className="update-button"
                              onClick={() => openEditModal(item.id, item.questionText)}
                              disabled={loading}
                              title="Edit question"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="appointments-table-container">
              {fetchingResponses ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  Loading responses...
                </div>
              ) : (
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Question</th>
                      <th>Response</th>
                      <th>Submitted Date</th>
                      <th>Posted By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                          {searchTerm ? 'No responses found matching your search' : 'No student responses yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredResponses.map((item) => {
                        const studentName = `${item.student?.person?.firstName || ''} ${item.student?.person?.middleName || ''} ${item.student?.person?.lastName || ''}`.trim();
                        
                        return (
                          <tr key={item.id} className="appointment-row">
                            <td className="student-cell">
                              {studentName}
                            </td>
                            <td className="questions-cell" style={{ maxWidth: '250px' }}>
                              {item.question?.questionText}
                            </td>
                            <td className="response-cell" style={{ maxWidth: '300px' }}>
                              {item.responseText}
                            </td>
                            <td className="date-cell">
                              {formatFullDateTimePH(item.submittedDate)}
                            </td>
                            <td className="counselor-cell">
                              {item.question?.guidanceStaff?.person?.firstName} {item.question?.guidanceStaff?.person?.lastName}
                            </td>
                            <td className="action-cell">
                              <button
                                className="export-button"
                                onClick={() => exportStudentResponse(item.student?.id, studentName)}
                                title="Export student responses"
                              >
                                <Download size={14} style={{ marginRight: '4px' }} />
                                Export
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Student Selection Modal */}
      {studentSelectionModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '700px', width: '90%' }}>
            <div className="modal-header-row">
              <h2>Select Students</h2>
              <button className="close-btn" onClick={closeStudentSelectionModal}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Search, Section Filter, and Select All */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div className="input-with-clear" style={{ flex: 2 }}>
                    <input
                      type="text"
                      className="table-input"
                      placeholder="Search by name or student number..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                    />
                    {studentSearchTerm && (
                      <button 
                        className="clear-filter-icon"
                        onClick={() => setStudentSearchTerm('')}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <select
                    className="table-input"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    <option value="all">All Sections</option>
                    {getUniqueSections().map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                  
                  <button 
                    className="btn-green-outline"
                    onClick={handleSelectAll}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 
                      ? 'Deselect All' 
                      : 'Select All'}
                  </button>
                </div>
                
                {/* Section Quick Select Buttons */}
                {getUniqueSections().length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      alignSelf: 'center',
                      marginRight: '8px'
                    }}>
                      Quick Select:
                    </span>
                    {getUniqueSections().map(section => {
                      const studentsInSection = allStudents.filter(s => s.section?.sectionName === section);
                      const selectedInSection = studentsInSection.filter(s => selectedStudents.includes(s.id)).length;
                      const allSelected = selectedInSection === studentsInSection.length && studentsInSection.length > 0;
                      
                      return (
                        <button
                          key={section}
                          onClick={() => handleSelectSection(section)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `2px solid ${allSelected ? '#16a34a' : '#cbd5e0'}`,
                            background: allSelected ? '#16a34a' : 'white',
                            color: allSelected ? 'white' : '#374151',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            if (!allSelected) {
                              e.target.style.borderColor = '#16a34a';
                              e.target.style.background = '#f0fdf4';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!allSelected) {
                              e.target.style.borderColor = '#cbd5e0';
                              e.target.style.background = 'white';
                            }
                          }}
                        >
                          {section} ({selectedInSection}/{studentsInSection.length})
                        </button>
                      );
                    })}
                  </div>
                )}
                
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  padding: '8px 12px',
                  background: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  {selectedStudents.length} of {filteredStudents.length} students selected
                  {selectedSection !== 'all' && ` in ${selectedSection}`}
                </div>
              </div>

              {/* Students List */}
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px'
              }}>
                {fetchingStudents ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Loading students...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    {studentSearchTerm ? 'No students found matching your search' : 'No students available'}
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const fullName = `${student.person?.firstName || ''} ${student.person?.middleName || ''} ${student.person?.lastName || ''}`.trim();
                    const isSelected = selectedStudents.includes(student.id);
                    
                    return (
                      <div
                        key={student.id}
                        onClick={() => handleStudentToggle(student.id)}
                        style={{
                          padding: '12px 14px',
                          marginBottom: '6px',
                          border: `2px solid ${isSelected ? '#16a34a' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: isSelected ? '#f0fdf4' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="table-checkbox"
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '2px'
                          }}>
                            {fullName}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#6b7280',
                            display: 'flex',
                            gap: '12px'
                          }}>
                            <span>Student #: {student.studentNumber}</span>
                            {student.section?.sectionName && (
                              <>
                                <span>•</span>
                                <span>Section: {student.section.sectionName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={closeStudentSelectionModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handlePost}
                disabled={loading || selectedStudents.length === 0}
              >
                {loading ? 'Posting...' : `Post to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Edit Question Modal */}
      {editModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card edit-modal">
            <div className="modal-header-row">
              <h2>Edit Question</h2>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-question-text">Question Text</label>
                <textarea
                  id="edit-question-text"
                  className="edit-textarea"
                  value={editModal.questionText}
                  onChange={(e) => setEditModal({ ...editModal, questionText: e.target.value })}
                  rows={6}
                  placeholder="Enter your question here..."
                />
                {editModal.questionText && !editModal.questionText.trim() && (
                  <span style={{ color: 'red', fontSize: '12px' }}>Question text cannot be empty</span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={closeEditModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleUpdateQuestion}
                disabled={loading || !editModal.questionText.trim()}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExitInterview;
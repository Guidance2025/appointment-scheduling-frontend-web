import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import "../../css/ExitInterview.css";
import "../../css/button/button.css";
import { API_BASE_URL } from '../../../constants/api';
import { formatFullDateTimePH, isTodayPH, isThisWeekPH, isThisMonthPH } from '../../utils/dateTime';
import { usePopUp } from '../../helper/message/pop/up/provider/PopUpModalProvider';

const getFriendlyError = (raw = '') => {
  const msg = typeof raw === 'string' ? raw : JSON.stringify(raw);

  if (msg.includes('EmptyFieldException') || msg.toLowerCase().includes('user id list cannot be empty'))
    return 'No students found. Please ensure students are enrolled and assigned before posting questions.';
  if (msg.includes('401') || msg.toLowerCase().includes('unauthorized'))
    return 'Your session has expired. Please log in again.';
  if (msg.includes('403') || msg.toLowerCase().includes('forbidden'))
    return 'You do not have permission to perform this action.';
  if (msg.includes('404'))
    return 'The requested resource was not found. Please refresh and try again.';
  if (msg.includes('409') || msg.toLowerCase().includes('conflict'))
    return 'A conflict occurred. This question may already exist.';
  if (msg.includes('500') || msg.toLowerCase().includes('internal server'))
    return 'No students found. Please ensure students are enrolled and assigned before posting questions.';
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror'))
    return 'Network error. Please check your connection and try again.';
  if (msg.toLowerCase().includes('question text cannot be empty'))
    return 'Question text cannot be empty.';
  if (msg.trim())
    return msg;

  return 'Something went wrong. Please try again.';
};

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
  const [fetchQuestionsError, setFetchQuestionsError] = useState('');
  const [responsesData, setResponsesData] = useState([]);
  const [fetchingResponses, setFetchingResponses] = useState(false);
  const [fetchResponsesError, setFetchResponsesError] = useState('');
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
      case 'today': return isTodayPH(dateString);
      case 'week':  return isThisWeekPH(dateString);
      case 'month': return isThisMonthPH(dateString);
      default:      return true;
    }
  };

  const fetchPostedQuestions = async () => {
    try {
      setFetchingQuestions(true);
      setFetchQuestionsError('');
      const token = localStorage.getItem("jwtToken");
      if (!token) { setFetchingQuestions(false); return; }

      const response = await fetch(`${API_BASE_URL}/exit-interview/student/all-questions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => '');
        throw new Error(raw || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setQuestionsData(data);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setFetchQuestionsError(getFriendlyError(err.message));
    } finally {
      setFetchingQuestions(false);
    }
  };

  const fetchStudentResponses = async () => {
    try {
      setFetchingResponses(true);
      setFetchResponsesError('');
      const token = localStorage.getItem("jwtToken");
      if (!token) { setFetchingResponses(false); return; }

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
        const raw = await response.text().catch(() => '');
        throw new Error(raw || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const answered = data.filter(item => item.responseText && item.responseText.trim() !== '');
      setResponsesData(answered);
    } catch (err) {
      console.error('Error fetching responses:', err);
      setFetchResponsesError(getFriendlyError(err.message));
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
    if (questions.length >= 5) { setError('You can only create up to 5 questions.'); return; }
    setQuestions([...questions, '']);
    setError('');
    setSuccess('');
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, value) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const handlePost = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const validQuestions = questions.filter(q => q.trim() !== '');

      if (validQuestions.length === 0) {
        setError('Please add at least one question.');
        setLoading(false);
        return;
      }

      if (validQuestions.length > 5) {
        setError('You can only create up to 5 questions.');
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
        questionTexts: validQuestions
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
        let raw = '';
        try { raw = await response.text(); } catch (_) {}
        throw new Error(raw || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Questions posted successfully:', data);
      showSuccess('Questions posted successfully!', '', 2000);
      setQuestions(['']);
      setSuccess(`Successfully posted ${data.length} question(s) to ${selectedStudents.length} student(s)!`);
      closeStudentSelectionModal();
      fetchPostedQuestions();

      setTimeout(() => { setSuccess(''); setError(''); }, 2000);
    } catch (err) {
      console.error('Error posting questions:', err);
      setError(err.message || 'Failed to post questions. Please try again.');
    } finally { 
      setLoading(false);
    }
  };

  const handleClear = () => { setQuestions(['']); setError(''); setSuccess(''); };
  const handleClearSearch = () => setSearchTerm('');

  const openEditModal  = (questionId, questionText) => setEditModal({ isOpen: true, questionId, questionText });
  const closeEditModal = () => setEditModal({ isOpen: false, questionId: null, questionText: '' });

  const handleUpdateQuestion = async () => {
    if (!editModal.questionText.trim()) { setError('Question text cannot be empty.'); return; }

    const { questionId, questionText } = editModal;
    closeEditModal();

    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      if (!token) { setError('Your session has expired. Please log in again.'); return; }

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
      setError(getFriendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const exportStudentResponse = async (studentId, studentName) => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) { alert('Authentication required. Please log in again.'); return; }

      const response = await fetch(`${API_BASE_URL}/exit-interview/student-response`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => '');
        throw new Error(raw || `HTTP ${response.status}`);
      }

      const allResponses = await response.json();
      const studentResponses = allResponses
        .filter(r => r.student?.id === studentId && r.responseText && r.responseText.trim() !== '')
        .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

      if (studentResponses.length === 0) {
        alert(`No responses found for ${studentName}.`);
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
                <td><strong>Name:</strong></td><td>${studentName}</td>
                <td><strong>Student Number:</strong></td><td>${studentResponses[0]?.student?.studentNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td><strong>Export Date:</strong></td><td>${formatFullDateTimePH(new Date().toISOString())}</td>
                <td><strong>Total Responses:</strong></td><td>${studentResponses.length}</td>
              </tr>
              <tr><td colspan="4">&nbsp;</td></tr>
              <tr class="header">
                <th>Response #</th><th>Question</th><th>Response</th><th>Submitted Date</th>
              </tr>
              ${studentResponses.map((r, i) => `
                <tr>
                  <td>${studentResponses.length - i}</td>
                  <td>${r.question?.questionText || 'N/A'}</td>
                  <td>${r.responseText}</td>
                  <td>${formatFullDateTimePH(r.submittedDate)}</td>
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
      link.setAttribute('download', `${studentName.replace(/\s+/g, '_')}_Exit_Interview_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting student response:', err);
      alert(getFriendlyError(err.message));
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

  const EmptyState = ({ icon, title, subtitle, colSpan = 6 }) => (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '13px', color: '#6B7280' }}>{subtitle}</div>}
      </td>
    </tr>
  );

  const ErrorState = ({ message, onRetry, colSpan = 6 }) => (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
        <div style={{ fontWeight: '600', color: '#DC2626', marginBottom: '4px' }}>Failed to load data</div>
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>{message}</div>
        {onRetry && (
          <button onClick={onRetry} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>
            Try again
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="page-container">
      <div className="assessment-form-card">
        <h2 className="form-title">Create Exit Interview Questions</h2>
        <p className="form-description">Add Questions (Maximum 5 questions)</p>

        {error && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span></span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', color: '#15803D', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span></span>
            <span>{success}</span>
          </div>
        )}

        <div className="questions-list">
          {questions.map((question, index) => (
            <div key={index} className="question-item">
              <div className="question-header">
                <label className="question-label">Question {index + 1}</label>
                {questions.length > 1 && (
                  <button className="remove-question-btn" onClick={() => handleRemoveQuestion(index)}>✕</button>
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
          style={{ opacity: questions.length >= 5 ? 0.5 : 1, cursor: questions.length >= 5 ? 'not-allowed' : 'pointer' }}
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
            onClick={handlePost}
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Exit Interview'}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="assessment-tabs-container">
        <div className="tabs-header">
          <button className={`tab-button ${activeTab === 'questions' ? 'tab-active' : ''}`} onClick={() => setActiveTab('questions')}>
            Posted Questions
          </button>
          <button className={`tab-button ${activeTab === 'responses' ? 'tab-active' : ''}`} onClick={() => setActiveTab('responses')}>
            Student Responses
          </button>
        </div>

        {/* Filter bar */}
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
                  <button className="assessment-clear-filter-icon" onClick={handleClearSearch}>✕</button>
                )}
              </div>
            </div>
            <div className="assessment-filter-group assessment-date-group">
              <label className="assessment-filter-label">Date Range</label>
              <select className="assessment-filter-select" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table content */}
        <div className="appointments-content">
          {activeTab === 'questions' ? (
            <div className="appointments-table-container">
              {fetchingQuestions ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading questions…</div>
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
                    {fetchQuestionsError ? (
                      <ErrorState message={fetchQuestionsError} onRetry={fetchPostedQuestions} colSpan={4} />
                    ) : filteredQuestions.length === 0 ? (
                      <EmptyState
                        colSpan={4}
                        icon="📋"
                        title={searchTerm ? 'No matching questions found' : 'No questions posted yet'}
                        subtitle={
                          searchTerm
                            ? `No questions match "${searchTerm}". Try a different search term.`
                            : 'Create your first exit interview question using the form above.'
                        }
                      />
                    ) : (
                      filteredQuestions.map((item) => (
                        <tr key={item.id} className="appointment-row">
                          <td className="questions-cell">{item.questionText}</td>
                          <td className="counselor-cell">
                            {item.guidanceStaff?.person?.firstName} {item.guidanceStaff?.person?.lastName}
                          </td>
                          <td className="date-cell">{formatFullDateTimePH(item.dateCreated)}</td>
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
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading responses…</div>
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
                    {fetchResponsesError ? (
                      <ErrorState message={fetchResponsesError} onRetry={fetchStudentResponses} colSpan={6} />
                    ) : filteredResponses.length === 0 ? (
                      <EmptyState
                        colSpan={6}
                        icon="💬"
                        title={searchTerm ? 'No matching responses found' : 'No student responses yet'}
                        subtitle={
                          searchTerm
                            ? `No responses match "${searchTerm}". Try a different search term.`
                            : 'Student responses will appear here once they answer posted questions.'
                        }
                      />
                    ) : (
                      filteredResponses.map((item) => {
                        const studentName = `${item.student?.person?.firstName || ''} ${item.student?.person?.middleName || ''} ${item.student?.person?.lastName || ''}`.trim();
                        return (
                          <tr key={item.id} className="appointment-row">
                            <td className="student-cell">{studentName}</td>
                            <td className="questions-cell" style={{ maxWidth: '250px' }}>{item.question?.questionText}</td>
                            <td className="response-cell" style={{ maxWidth: '300px' }}>{item.responseText}</td>
                            <td className="date-cell">{formatFullDateTimePH(item.submittedDate)}</td>
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
};

export default ExitInterview;
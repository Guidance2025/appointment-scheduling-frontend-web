import React, { useState, useEffect } from 'react';
import "../../css/ExitInterview.css";
import { API_BASE_URL } from '../../../constants/api';
import { formatFullDateTimePH, parseUTCToPH, isTodayPH, isThisWeekPH, isThisMonthPH } from '../../utils/dateTime';

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
    
    const itemDate = new Date(dateString);
    const now = new Date();
    
    now.setHours(0, 0, 0, 0);
    itemDate.setHours(0, 0, 0, 0);
    
    switch (filterType) {
      case 'today':
        return itemDate.getTime() === now.getTime();
        
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
        
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return itemDate >= monthAgo;
        
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
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to post questions');
      }

      const data = await response.json();
      console.log('Questions posted successfully:', data);
      
      setQuestions(['']);
      setSuccess(`Successfully posted ${data.length} question(s)!`);
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
  .sort((a, b) => new Date(b.responseDate) - new Date(a.responseDate));

  return (
    <div className="page-container">
      <div className="assessment-form-card">
        <h2 className="form-title">Create Exit Interview Questions</h2>
        <p className="form-description">Add questions for graduating students (Maximum 5 questions)</p>
        
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
            className="action-btn action-btn-post" 
            onClick={handlePost}
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Exit Interview'}
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
                      <th>Question</th>
                      <th>Response</th>
                      <th>Response Date</th>
                      <th>Posted By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                          {searchTerm ? 'No responses found matching your search' : 'No student responses yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredResponses.map((item) => (
                        <tr key={item.id} className="appointment-row">
                          <td className="questions-cell" style={{ maxWidth: '250px' }}>
                            {item.question?.questionText}
                          </td>
                          <td className="response-cell" style={{ maxWidth: '300px' }}>
                            {item.responseText}
                          </td>
                          <td className="date-cell">
                            {new Date(item.submittedDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="counselor-cell">
                            {item.question?.guidanceStaff?.person?.firstName} {item.question?.guidanceStaff?.person?.lastName}
                          </td>
                        </tr>
                      ))
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
}

export default ExitInterview;
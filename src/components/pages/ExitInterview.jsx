import React, { useState, useEffect } from 'react';
import "../../css/ExitInterview.css";
import { API_BASE_URL } from '../../../constants/api';

const ExitInterview = () => {
  const [activeTab, setActiveTab] = useState('posted');  // Default to Posted Questions
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
      const guidanceStaffId = localStorage.getItem("guidanceStaffId");
      const token = localStorage.getItem("jwtToken");
      
      if (!guidanceStaffId || !token) {
        console.log("No guidance staff ID or token found");
        setFetchingQuestions(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/exit-interview/retrieve-questions/${guidanceStaffId}`,
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
        `${API_BASE_URL}/api/exit-interview/student-response`,
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

      const response = await fetch(
        `${API_BASE_URL}/api/exit-interview/create/${guidanceStaffId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(validQuestions)
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

  const filteredQuestions = questionsData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const staffName = `${item.guidanceStaff?.person?.firstName || ''} ${item.guidanceStaff?.person?.lastName || ''}`.toLowerCase();
    const questionText = item.questionText?.toLowerCase() || '';
    
    const matchesSearch = staffName.includes(searchLower) || questionText.includes(searchLower);
    
    const matchesDate = filterByDateRange(item.dateCreated, filterDate);
    
    return matchesSearch && matchesDate;
  });

  const filteredResponses = responsesData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const questionText = item.question?.questionText?.toLowerCase() || '';
    const responseText = item.responseText?.toLowerCase() || '';
    
    const matchesSearch = questionText.includes(searchLower) || responseText.includes(searchLower);
    
    const matchesDate = filterByDateRange(item.submittedDate, filterDate);
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="page-container">
      {/* Form at top, mirroring SelfAssessment */}
      <div className="exit-form-card">
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
            {loading ? 'Posting...' : 'Post Questions'}
          </button>
        </div>
      </div>

      {/* Tabs: Posted Questions and Student Responses */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "posted" ? "active" : ""}`}
          onClick={() => setActiveTab("posted")}
          type="button"
        >
          Posted Questions
        </button>
        <button
          className={`tab-button ${activeTab === "responses" ? "active" : ""}`}
          onClick={() => setActiveTab("responses")}
          type="button"
        >
          Student Responses
        </button>
      </div>

      {/* POSTED QUESTIONS TAB */}
      {activeTab === "posted" && (
        <>
          <div className="assessment-filter-bar">
            <div className="filter-row">
              <div className="filter-group search-group">
                <label className="filter-label">Search</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search by counselor or questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="clear-filter-icon" onClick={handleClearSearch}>
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="filter-group date-group">
                <label className="filter-label">Date Range</label>
                <select
                  className="filter-select"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="filter-actions">
                <button className="filter-button secondary" onClick={() => {
                  setSearchTerm('');
                  setFilterDate('all');
                }}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="appointments-content">
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>
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
                            {new Date(item.dateCreated).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* STUDENT RESPONSES TAB (responses from mobile app) */}
      {activeTab === "responses" && (
        <>
          <div className="assessment-filter-bar">
            <div className="filter-row">
              <div className="filter-group search-group">
                <label className="filter-label">Search</label>
                <div className="filter-input-wrapper">
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search by question or response..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="clear-filter-icon" onClick={handleClearSearch}>
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="filter-group date-group">
                <label className="filter-label">Date Range</label>
                <select
                  className="filter-select"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="filter-actions">
                <button className="filter-button secondary" onClick={() => {
                  setSearchTerm('');
                  setFilterDate('all');
                }}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="appointments-content">
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
          </div>
        </>
      )}
    </div>
  );
};

export default ExitInterview;
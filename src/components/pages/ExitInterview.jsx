import React, { useState, useEffect } from 'react';
import { Download, Users, CheckSquare, Square } from 'lucide-react';
import "../../css/ExitInterview.css";
import "../../css/button/button.css";
import { API_BASE_URL } from '../../../constants/api';
import { formatFullDateTimePH, isTodayPH, isThisWeekPH, isThisMonthPH } from '../../utils/dateTime';
import { usePopUp } from '../../helper/message/pop/up/provider/PopUpModalProvider';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getFriendlyError = (raw = '') => {
  const msg = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (msg.includes('EmptyFieldException') || msg.toLowerCase().includes('user id list cannot be empty'))
    return 'No students found. Please ensure students are enrolled before posting questions.';
  if (msg.includes('401') || msg.toLowerCase().includes('unauthorized'))
    return 'Your session has expired. Please log in again.';
  if (msg.includes('403') || msg.toLowerCase().includes('forbidden'))
    return 'You do not have permission to perform this action.';
  if (msg.includes('404'))
    return 'The requested resource was not found. Please refresh and try again.';
  if (msg.includes('500') || msg.toLowerCase().includes('internal server'))
    return 'Server error. Please ensure students are enrolled before posting.';
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror'))
    return 'Network error. Please check your connection and try again.';
  if (msg.toLowerCase().includes('question text cannot be empty'))
    return 'Question text cannot be empty.';
  if (msg.trim()) return msg;
  return 'Something went wrong. Please try again.';
};


const ExitInterview = () => {
  const [activeTab, setActiveTab]     = useState('questions');
  const [questions, setQuestions]     = useState(['']);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterDate, setFilterDate]   = useState('all');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const [questionsData, setQuestionsData]             = useState([]);
  const [fetchingQuestions, setFetchingQuestions]     = useState(true);
  const [fetchQuestionsError, setFetchQuestionsError] = useState('');
  const [responsesData, setResponsesData]             = useState([]);
  const [fetchingResponses, setFetchingResponses]     = useState(false);
  const [fetchResponsesError, setFetchResponsesError] = useState('');

  const [editModal, setEditModal] = useState({ isOpen: false, questionId: null, questionText: '' });

  const [studentModal, setStudentModal]           = useState(false);
  const [allStudents, setAllStudents]             = useState([]);
  const [selectedStudents, setSelectedStudents]   = useState([]);   
  const [studentSearch, setStudentSearch]         = useState('');
  const [filterSection, setFilterSection]         = useState('all');
  const [fetchingStudents, setFetchingStudents]   = useState(false);

  const { showSuccess } = usePopUp();

  useEffect(() => { 
    fetchPostedQuestions(); 
    fetchStudentResponses();  
  }, []);

  const filterByDate = (dateStr, type) => {
    if (type === 'all' || !dateStr) return type === 'all';
    switch (type) {
      case 'today': return isTodayPH(dateStr);
      case 'week':  return isThisWeekPH(dateStr);
      case 'month': return isThisMonthPH(dateStr);
      default:      return true;
    }
  };

  const authHeader = () => {
    const token = localStorage.getItem('jwtToken');
    return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : null;
  };

  const fetchPostedQuestions = async () => {
    try {
      setFetchingQuestions(true);
      setFetchQuestionsError('');
      const hdrs = authHeader();
      if (!hdrs) { setFetchingQuestions(false); return; }
      const res = await fetch(`${API_BASE_URL}/exit-interview/student/all-questions`, { headers: hdrs });
      if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`);
      setQuestionsData(await res.json());
    } catch (e) {
      setFetchQuestionsError(getFriendlyError(e.message));
    } finally {
      setFetchingQuestions(false);
    }
  };

  const fetchStudentResponses = async () => {
    try {
      setFetchingResponses(true);
      setFetchResponsesError('');
      const hdrs = authHeader();
      if (!hdrs) { setFetchingResponses(false); return; }
      const res = await fetch(`${API_BASE_URL}/exit-interview/student-response`, { headers: hdrs });
      if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`);
      const data = await res.json();
      setResponsesData(data.filter(i => i.responseText?.trim()));
    } catch (e) {
      setFetchResponsesError(getFriendlyError(e.message));
    } finally {
      setFetchingResponses(false);
    }
  };

  const fetchAllStudents = async () => {
  try {
    setFetchingStudents(true);
    setError('');
    const hdrs = authHeader();
    if (!hdrs) return;
    const res = await fetch(`${API_BASE_URL}/exit-interview/students/all`, { headers: hdrs });
    if (!res.ok) throw new Error('Failed to fetch students');
    const data = await res.json();
    
    console.log('Raw API response:', data);
    console.log('Total students from API:', data.length);
    
    // Filter to ONLY show students from sections ending with '-801'
    const students801 = data.filter(student => {
      const sectionName = student.section?.sectionName ?? student.sectionName ?? '';
      const is801Section = sectionName.endsWith('-801');
      return is801Section;
    });

    setAllStudents(students801);
  } catch (e) {
    console.error('Error fetching students:', e);
    setError('Failed to load students. Please try again.');
  } finally {
    setFetchingStudents(false);
  }
};

  const handleAddQuestion    = () => {
    if (questions.length >= 5) { setError('You can only create up to 5 questions.'); return; }
    setQuestions(prev => [...prev, '']);
    setError('');
  };
  const handleRemoveQuestion = (i) => { if (questions.length > 1) setQuestions(prev => prev.filter((_, idx) => idx !== i)); };
  const handleQuestionChange = (i, v) => { const u = [...questions]; u[i] = v; setQuestions(u); };
  const handleClear          = () => { setQuestions(['']); setError(''); setSuccess(''); };

  const handleOpenStudentModal = () => {
    const valid = questions.filter(q => q.trim());
    if (!valid.length) { setError('Please add at least one question.'); return; }
    if (valid.length > 5) { setError('You can only create up to 5 questions.'); return; }
    setSelectedStudents([]);
    setStudentSearch('');
    setFilterSection('all');
    setStudentModal(true);
    fetchAllStudents();
  };

  const closeStudentModal = () => {
    setStudentModal(false);
    setSelectedStudents([]);
    setStudentSearch('');
    setFilterSection('all');
  };

  const toggleStudent = (studentId) =>
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );

  const getFilteredStudents = () => {
    const filtered = allStudents.filter(s => {
      // Handle both nested person object and flat structure
      const firstName = s.person?.firstName ?? s.firstName ?? '';
      const middleName = s.person?.middleName ?? s.middleName ?? '';
      const lastName = s.person?.lastName ?? s.lastName ?? '';
      const name = `${firstName} ${middleName} ${lastName}`.toLowerCase();
      const num = (s.studentNumber ?? '').toLowerCase();
      const section = (s.section?.sectionName ?? s.sectionName ?? '').toLowerCase();
      
      const searchLower = studentSearch.toLowerCase();
      const matchSearch = !studentSearch || name.includes(searchLower) || num.includes(searchLower);
      const matchSection = filterSection === 'all' || section === filterSection.toLowerCase();
      
      return matchSearch && matchSection;
    });
    
    console.log('Search term:', studentSearch);
    console.log('Total 801 students:', allStudents.length);
    console.log('After filtering:', filtered.length);
    
    return filtered;
  };

  const getUniqueSections = () =>
    [...new Set(allStudents.map(s => s.section?.sectionName ?? s.sectionName).filter(Boolean))].sort();

  const isAllFilteredSelected = () => {
    const filtered = getFilteredStudents();
    return filtered.length > 0 && filtered.every(s => selectedStudents.includes(s.id));
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = getFilteredStudents().map(s => s.id);
    if (isAllFilteredSelected()) {
      setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudents(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handlePost = async () => {
    try {
      setLoading(true);
      setError('');
      const validQuestions = questions.filter(q => q.trim());
      if (!validQuestions.length) { setError('Please add at least one question.'); return; }

      const guidanceStaffId = localStorage.getItem('guidanceStaffId');
      const hdrs = authHeader();
      if (!hdrs || !guidanceStaffId) { setError('Authentication required.'); return; }

      const payload = {
        questionTexts: validQuestions,
        selectedStudentIds: selectedStudents.length > 0 ? selectedStudents : null,
      };

      const res = await fetch(`${API_BASE_URL}/exit-interview/create/${guidanceStaffId}`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`);

      const data = await res.json();
      const msg = selectedStudents.length > 0
        ? `Successfully posted ${data.length} question(s) to ${selectedStudents.length} selected student(s)!`
        : `Successfully posted ${data.length} question(s) to all students!`;

      showSuccess(msg, '', 2000);
      setSuccess(msg);
      setQuestions(['']);
      closeStudentModal();
      fetchPostedQuestions();
      setTimeout(() => { setSuccess(''); setError(''); }, 3000);
    } catch (e) {
      setError(getFriendlyError(e.message));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal  = (id, text) => setEditModal({ isOpen: true, questionId: id, questionText: text });
  const closeEditModal = () => setEditModal({ isOpen: false, questionId: null, questionText: '' });

  const handleUpdateQuestion = async () => {
    if (!editModal.questionText.trim()) { setError('Question text cannot be empty.'); return; }
    const { questionId, questionText } = editModal;
    closeEditModal();
    try {
      setLoading(true);
      const hdrs = authHeader();
      if (!hdrs) { setError('Session expired. Please log in again.'); return; }
      const res = await fetch(`${API_BASE_URL}/exit-interview/questions/${questionId}`, {
        method: 'PUT', headers: hdrs, body: JSON.stringify({ questionText: questionText.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to update question' }));
        throw new Error(err.message || 'Failed to update question');
      }
      setSuccess('Question updated successfully!');
      fetchPostedQuestions();
      setTimeout(() => setSuccess(''), 2000);
    } catch (e) {
      setError(getFriendlyError(e.message));
    } finally {
      setLoading(false);
    }
  };

  const exportStudentResponse = async (studentId, studentName) => {
    try {
      const hdrs = authHeader();
      if (!hdrs) { alert('Authentication required.'); return; }
      const res = await fetch(`${API_BASE_URL}/exit-interview/student-response`, { headers: hdrs });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const all = await res.json();
      const rows = all
        .filter(r => r.student?.id === studentId && r.responseText?.trim())
        .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
      if (!rows.length) { alert(`No responses found for ${studentName}.`); return; }

      const html = `<html><head><meta charset="utf-8"><title>Exit Interview – ${studentName}</title>
        <style>table{border-collapse:collapse;width:100%;font-family:Arial}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f2f2f2}.hdr{background:#16a34a;color:#fff}</style></head>
        <body><h2>Exit Interview Response Report</h2><table>
        <tr class="hdr"><td colspan="4"><strong>Student Information</strong></td></tr>
        <tr><td><strong>Name:</strong></td><td>${studentName}</td><td><strong>Student No.:</strong></td><td>${rows[0]?.student?.studentNumber ?? 'N/A'}</td></tr>
        <tr><td><strong>Export Date:</strong></td><td>${formatFullDateTimePH(new Date().toISOString())}</td><td><strong>Total Responses:</strong></td><td>${rows.length}</td></tr>
        <tr><td colspan="4">&nbsp;</td></tr>
        <tr class="hdr"><th>#</th><th>Question</th><th>Response</th><th>Submitted</th></tr>
        ${rows.map((r, i) => `<tr><td>${rows.length - i}</td><td>${r.question?.questionText ?? 'N/A'}</td><td>${r.responseText}</td><td>${formatFullDateTimePH(r.submittedDate)}</td></tr>`).join('')}
        </table><p><em>Generated on ${formatFullDateTimePH(new Date().toISOString())}</em></p></body></html>`;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const link = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: `${studentName.replace(/\s+/g, '_')}_Exit_Interview_${new Date().toISOString().split('T')[0]}.xls`,
        style: 'display:none',
      });
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      alert(getFriendlyError(e.message));
    }
  };

  const filteredQuestions = questionsData
    .filter(item => {
      const s = searchTerm.toLowerCase();
      return (
        (`${item.guidanceStaff?.person?.firstName ?? ''} ${item.guidanceStaff?.person?.lastName ?? ''}`).toLowerCase().includes(s) ||
        (item.questionText ?? '').toLowerCase().includes(s)
      ) && filterByDate(item.dateCreated, filterDate);
    })
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  const filteredResponses = responsesData
    .filter(item => {
      const s = searchTerm.toLowerCase();
      return (
        (item.question?.questionText ?? '').toLowerCase().includes(s) ||
        (item.responseText ?? '').toLowerCase().includes(s)
      ) && filterByDate(item.submittedDate, filterDate);
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
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', display: 'flex', gap: '8px' }}>
            <span>⚠</span><span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', color: '#15803D', display: 'flex', gap: '8px' }}>
            <span>✓</span><span>{success}</span>
          </div>
        )}

        <div className="questions-list">
          {questions.map((q, i) => (
            <div key={i} className="question-item">
              <div className="question-header">
                <label className="question-label">Question {i + 1}</label>
                {questions.length > 1 && (
                  <button className="remove-question-btn" onClick={() => handleRemoveQuestion(i)}>✕</button>
                )}
              </div>
              <textarea
                className="question-textarea"
                placeholder="Enter your question here..."
                value={q}
                rows={3}
                onChange={e => handleQuestionChange(i, e.target.value)}
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
          <button className="action-btn action-btn-clear" onClick={handleClear} disabled={loading}>Clear</button>
          <button className="action-btn action-btn-post" onClick={handleOpenStudentModal} disabled={loading}>
            {loading ? 'Processing…' : 'Select Students & Post'}
          </button>
        </div>
      </div>

      {studentModal && (
        <div className="modal-overlay">
          <div className="modal-card student-selection-modal">

            <div className="modal-header-row">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> Select Target Students
              </h2>
              <button className="close-btn" onClick={closeStudentModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Info banner */}
              <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '13px', color: '#1D4ED8' }}>
                <strong>ℹ Visibility:</strong> Leave all unchecked to post to <em>all students</em>.
                Select specific students to restrict who can see and answer these questions.
              </div>

              {/* Filters row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '160px' }}>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search by name or student number…"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <select
                    className="filter-select"
                    value={filterSection}
                    onChange={e => setFilterSection(e.target.value)}
                  >
                    <option value="all">All Sections</option>
                    {getUniqueSections().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button className="btn-green-outline" onClick={toggleSelectAllFiltered} style={{ whiteSpace: 'nowrap' }}>
                  {isAllFilteredSelected() ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span style={{ marginLeft: '6px' }}>
                    {isAllFilteredSelected() ? 'Deselect Visible' : 'Select Visible'}
                  </span>
                </button>
              </div>

              {/* Selection counter */}
              <div style={{ marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: selectedStudents.length > 0 ? '#16a34a' : '#6B7280' }}>
                {selectedStudents.length > 0
                  ? `✓ ${selectedStudents.length} student(s) selected — only they will see this question`
                  : 'No students selected — question will be visible to all students'}
              </div>

              {/* Student list */}
              <div className="students-list-container">
                {fetchingStudents ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading students…</div>
                ) : getFilteredStudents().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    <Users size={40} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                    <div>No students match your filter</div>
                  </div>
                ) : (
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Student No.</th>
                        <th>Name</th>
                        <th>Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStudents().map(student => {
                        const sid = student.id;
                        const isSelected = selectedStudents.includes(sid);
                        // Handle both nested person object and flat structure
                        const firstName = student.person?.firstName ?? student.firstName ?? '';
                        const middleName = student.person?.middleName ?? student.middleName ?? '';
                        const lastName = student.person?.lastName ?? student.lastName ?? '';
                        const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
                        const sectionName = student.section?.sectionName ?? student.sectionName ?? 'N/A';
                        
                        return (
                          <tr
                            key={sid}
                            className={`student-row${isSelected ? ' selected' : ''}`}
                            onClick={() => toggleStudent(sid)}
                          >
                            <td>
                              <input
                                type="checkbox"
                                className="table-checkbox"
                                checked={isSelected}
                                onChange={() => toggleStudent(sid)}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                            <td>{student.studentNumber ?? 'N/A'}</td>
                            <td>{fullName || 'N/A'}</td>
                            <td>{sectionName}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeStudentModal} disabled={loading}>Cancel</button>
              <button className="btn-save" onClick={handlePost} disabled={loading}>
                {loading ? 'Posting…' : selectedStudents.length > 0
                  ? `Post to ${selectedStudents.length} Student(s)`
                  : 'Post to All Students'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  placeholder={activeTab === 'questions' ? 'Search by counselor or question…' : 'Search by question or response…'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="assessment-clear-filter-icon" onClick={() => setSearchTerm('')}>✕</button>
                )}
              </div>
            </div>
            <div className="assessment-filter-group assessment-date-group">
              <label className="assessment-filter-label">Date Range</label>
              <select className="assessment-filter-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
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
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading questions…</div>
              ) : (
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Question Text</th>
                      <th>Posted By</th>
                      <th>Visibility</th>
                      <th>Date Posted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fetchQuestionsError ? (
                      <ErrorState message={fetchQuestionsError} onRetry={fetchPostedQuestions} colSpan={5} />
                    ) : filteredQuestions.length === 0 ? (
                      <EmptyState
                        colSpan={5} icon="📋"
                        title={searchTerm ? 'No matching questions' : 'No questions posted yet'}
                        subtitle={searchTerm ? `No questions match "${searchTerm}".` : 'Create your first question above.'}
                      />
                    ) : filteredQuestions.map(item => (
                      <tr key={item.id} className="appointment-row">
                        <td className="questions-cell">{item.questionText}</td>
                        <td className="counselor-cell">
                          {item.guidanceStaff?.person?.firstName} {item.guidanceStaff?.person?.lastName}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                            background: '#F0FDF4', color: '#16a34a', border: '1px solid #BBF7D0'
                          }}>
                            Posted
                          </span>
                        </td>
                        <td className="date-cell">{formatFullDateTimePH(item.dateCreated)}</td>
                        <td className="action-cell">
                          <button
                            className="update-button"
                            onClick={() => openEditModal(item.id, item.questionText)}
                            disabled={loading}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
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
                      <ErrorState message={fetchResponsesError} onRetry={fetchStudentResponses} />
                    ) : filteredResponses.length === 0 ? (
                      <EmptyState
                        icon="💬"
                        title={searchTerm ? 'No matching responses' : 'No student responses yet'}
                        subtitle={searchTerm ? `No responses match "${searchTerm}".` : 'Responses appear here once students submit answers.'}
                      />
                    ) : filteredResponses.map(item => {
                      const name = `${item.student?.person?.firstName ?? ''} ${item.student?.person?.middleName ?? ''} ${item.student?.person?.lastName ?? ''}`.trim();
                      return (
                        <tr key={item.id} className="appointment-row">
                          <td className="student-cell">{name}</td>
                          <td className="questions-cell" style={{ maxWidth: '250px' }}>{item.question?.questionText}</td>
                          <td className="response-cell" style={{ maxWidth: '300px' }}>{item.responseText}</td>
                          <td className="date-cell">{formatFullDateTimePH(item.submittedDate)}</td>
                          <td className="counselor-cell">
                            {item.question?.guidanceStaff?.person?.firstName} {item.question?.guidanceStaff?.person?.lastName}
                          </td>
                          <td className="action-cell">
                            <button
                              className="export-button"
                              onClick={() => exportStudentResponse(item.student?.id, name)}
                              title="Export student responses"
                            >
                              <Download size={14} style={{ marginRight: '4px' }} /> Export
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {editModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card edit-modal">
            <div className="modal-header-row">
              <h2>Edit Question</h2>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-q-text">Question Text</label>
                <textarea
                  id="edit-q-text"
                  className="edit-textarea"
                  rows={6}
                  placeholder="Enter your question here…"
                  value={editModal.questionText}
                  onChange={e => setEditModal(prev => ({ ...prev, questionText: e.target.value }))}
                />
                {editModal.questionText && !editModal.questionText.trim() && (
                  <span style={{ color: 'red', fontSize: '12px' }}>Question text cannot be empty</span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeEditModal} disabled={loading}>Cancel</button>
              <button
                className="btn-save"
                onClick={handleUpdateQuestion}
                disabled={loading || !editModal.questionText.trim()}
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExitInterview;
import React, { useEffect, useState } from "react";
import "./../../../css/Account.css";
import "./../../../css/Pagination.css";
import "./../../../css/table.css";
import { getGuidanceStaffAccounts, getStudentAccounts } from "../../../service/admin";
import CreateAccountModal from './modal/CreateAccountModal';
import { Search } from "lucide-react";
import ActionModal from "./modal/ActionModal";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("guidance");   

  const [isActionModalisOpen,setIsActionModalIsOpen] = useState(false);
  const [isSelectedStudentNumber,setIsSelectedStudentNumber] = useState();
  const [isSelectedEmployee,setIsSelectedEmployee] = useState();
  const [selectedUser,setSelecetedUser] = useState("guidanceStaffId");
  const [selectedUserData, setSelectedUserData] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchGuidanceAccounts = async () => {
    try {
      setLoading(true);
      const data = await getGuidanceStaffAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAccounts = async () => {
    try {
      setLoading(true);
      const data = await getStudentAccounts();
      setStudentAccounts(data);
    } catch (error) {
      console.error("Error fetching student accounts:", error);
      setStudentAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccounts = () => {
  fetchGuidanceAccounts();
  fetchStudentAccounts();
};

  useEffect(() => {
   refreshAccounts();
  }, []);

  const currentData = activeTab === "guidance" ? accounts : studentAccounts;

  const filteredAccounts = currentData.filter((acc) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    
    if (activeTab === "guidance") {
      return (
        acc.username?.toLowerCase().includes(searchLower) ||
        acc.role?.toLowerCase().includes(searchLower) ||
        acc.firstname?.toLowerCase().includes(searchLower) ||
        acc.lastname?.toLowerCase().includes(searchLower)
      );
    } else {
      return (
        acc.username?.toLowerCase().includes(searchLower) ||
        acc.studentNumber?.toLowerCase().includes(searchLower) ||
        acc.firstname?.toLowerCase().includes(searchLower) ||
        acc.lastname?.toLowerCase().includes(searchLower)
      );
    }
  });

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const hidePassword = (password) => {
    if (!password) return "N/A";
    return "*".repeat(password.length);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
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
  };


  const handleSelectedUser = (user) => {
    setSelectedUserData(user);
    setIsActionModalIsOpen(true);
    if(user.studentNumber){
        setSelecetedUser("studentNumber");
        setIsSelectedStudentNumber(user.studentNumber);
    } else {
        setSelecetedUser("guidanceStaffId");
        setIsSelectedEmployee(user.employeeNumber);
    }
}


  const studentFullName = (student) => {
    return `${student.firstname || ""} ${student.lastname || ""}`.trim() || "N/A";
  };
  
  const guidanceFullName = (account) => {
    return `${account.firstname || ""} ${account.lastname || ""}`.trim() || "N/A";
  }


  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm(""); 
  };

  const displayGuidanceTab = () => {
    return (
      <>
        <div className="appointments-table-container">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>FullName</th>
                <th>Username</th>
                <th>Password</th>
                <th>Position</th>
                <th>Join Date</th>
                <th>Is Active</th>
                <th>Is Locked</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.map((account) => (
                <tr key={account.employeeNumber}
                 onDoubleClick={() =>handleSelectedUser(account)}
                 className="appointment-row">
                  <td>{guidanceFullName(account) || "N/A"}</td>
                  <td>{account.username || "N/A"}</td>
                  <td>{hidePassword(account.password)}</td>
                  <td>{account.positionInRc || "N/A"}</td>
                  <td>
                    {account.joinDate
                      ? new Date(account.joinDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{account.isActive ? "Yes" : "No"}</td>
                  <td>{account.isLocked ? "Yes" : "No"}</td>
                  <td>{account.role || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </>
    );
  };

  const displayStudentTab = () => {
    return (
      <>
        <div className="appointments-table-container">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Student Number</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Join Date</th>
                <th>Is Active</th>
                <th>Is Locked</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.map((student) => (
                <tr key={student.studentNumber}
                 onDoubleClick={() => handleSelectedUser(student)}
                 className="appointment-row">
                  <td>{student.studentNumber || "N/A"}</td>
                  <td>{studentFullName(student)}</td>
                  <td>{student.username || "N/A"}</td>
                  <td>{hidePassword(student.password)}</td>
                  <td>
                    {student.joinDate
                      ? new Date(student.joinDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{student.isActive ? "Yes" : "No"}</td>
                  <td>{student.isLocked ? "Yes" : "No"}</td>
                  <td>{student.role || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </>
    );
  };

  const renderPagination = () => {
    if (filteredAccounts.length === 0) return null;

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAccounts.length)} of {filteredAccounts.length} accounts
        </div>

        <div className="pagination-controls">
          <select
            className="pagination-select"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
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
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
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
    );
  };

  return (
    <div className="page-container">
      <div className="appointments-header">
        <div className="tab-container">
          <button 
            className="guidance-button"
            onClick={() => handleTabChange("guidance")}
            style={{ 
              backgroundColor: activeTab === "guidance" ? '#4CAF50' : '#e7e7e7', 
              color: activeTab === "guidance" ? 'white' : 'black',
              fontWeight: activeTab === "guidance" ? 'bold' : 'normal',
            }}
          >
            Guidance
          </button>

          <button 
            className="student-button"
            onClick={() => handleTabChange("student")}
            style={{ 
              backgroundColor: activeTab === "student" ? '#4CAF50' : '#e7e7e7', 
              color: activeTab === "student" ? 'white' : 'black',
              fontWeight: activeTab === "student" ? 'bold' : 'normal'
            }}
          >
            Student
          </button>
        </div>

        <div className="search-filters-row">
          <div className="filter-container">
            <label htmlFor="search-input">SEARCH</label>
            <Search size={12}  className = "search-icon-icon" style={{ display : 'block', marginRight: '4px' }} />
            <input
              id="search-input"
              type="text"
              className="search-input"
              placeholder={`Search by ${activeTab === "guidance" ? "staff" : "student"} name or number...`}
              value={searchTerm}
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

          <div className="right-controls">
            <button 
              className="create-account-button"
              onClick={() => setIsModalOpen(true)}
            >
              New Account
            </button>
          </div>
        </div>
      </div>

      <div className="appointments-content">
        <CreateAccountModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
           activeTab={activeTab} 
          onAccountCreated={() => {
            fetchGuidanceAccounts();
            fetchStudentAccounts();
          }}
        />

        <ActionModal 
            isOpen={isActionModalisOpen} 
            selectedUserType={selectedUser}
            studentNumber={isSelectedStudentNumber}
            employeeNumber={isSelectedEmployee}
            onClose={() => setIsActionModalIsOpen(false)}
            onDeleteSuccess={() => {
                fetchGuidanceAccounts();
                fetchStudentAccounts();
            }}
           selectedUserData={selectedUserData}
        />        
        {loading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading accounts...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="empty-message">
            {searchTerm ? (
              <div>
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No accounts found</h3>
                <p className="empty-description">
                  No accounts found matching "{searchTerm}"
                </p>
              </div>
            ) : (
              <div>
                <div className="empty-icon">👥</div>
                <h3 className="empty-title">No accounts found</h3>
                <p className="empty-description">
                  There are currently no {activeTab === "guidance" ? "guidance staff" : "student"} accounts.
                </p>
              </div>
            )}
          </div>
        ) : (
          activeTab === "guidance" ? displayGuidanceTab() : displayStudentTab()
        )}
      </div>
    </div>
  );
}

export default Accounts;
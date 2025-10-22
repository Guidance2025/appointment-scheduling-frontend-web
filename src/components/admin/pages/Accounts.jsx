import React, { useEffect, useState } from "react";
import "./../../../css/Appointment.css";
import "./../../../css/Account.css";
import { getAllAccounts } from "../../../service/admin";
import CreateAccountModal from './modal/CreateAccountModal';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen,setIsModalOpen] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAllAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((acc) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      acc.username?.toLowerCase().includes(searchLower) ||
      acc.role?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="page-container">
      <div className="appointments-header">
      <button className="create-account-button"
      onClick={() => setIsModalOpen(true)}
      > Create a account?</button>

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
        <CreateAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
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
                  <th>Username</th>
                  <th>Password</th>
                  <th>Join Date</th>
                  <th>Is Active</th>
                  <th>Is Locked</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.userId} className="appointment-row">
                    <td>{account.username || "N/A"}</td>
                    <td>{account.password || "N/A"}</td>
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
        )}
      </div>
    </div>
  );
}

export default Accounts;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2, FiAlertCircle, FiAward } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { submissionAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, searchTerm]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await submissionAPI.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.data.success) {
        setSubmissions(response.data.submissions || []);
        setTotalPages(response.data.totalPages || 1);

        // Calculate stats
        const all = response.data.allSubmissions || response.data.submissions || [];
        setStats({
          total: response.data.total || all.length,
          draft: all.filter(s => s.status === 'draft').length,
          pending: all.filter(s => s.status === 'pending').length,
          verified: all.filter(s => s.status === 'verified').length,
          rejected: all.filter(s => s.status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this submission?')) return;

    try {
      const response = await submissionAPI.delete(id);
      if (response.data.success) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    return Number(amount).toLocaleString();
  };

  return (
    <div className="app-container">
      <Header />

      <main className="dashboard-container">
        <div className="dashboard-header">
          <h2>My Submissions</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="certificates-btn"
              onClick={() => navigate('/certificates')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              <FiAward /> My Certificates
            </button>
            <button className="new-submission-btn" onClick={() => navigate('/form')}>
              <FiPlus /> New Submission
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FiFileText />
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Submissions</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon draft">
              <FiAlertCircle />
            </div>
            <div className="stat-info">
              <h3>{stats.draft}</h3>
              <p>Incomplete Drafts</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending">
              <FiClock />
            </div>
            <div className="stat-info">
              <h3>{stats.pending}</h3>
              <p>Pending Review</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon verified">
              <FiCheckCircle />
            </div>
            <div className="stat-info">
              <h3>{stats.verified}</h3>
              <p>Verified</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon rejected">
              <FiXCircle />
            </div>
            <div className="stat-info">
              <h3>{stats.rejected}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="submissions-section">
          <div className="section-header">
            <h3>Recent Submissions</h3>
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search by name or agreement..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
              <p style={{ marginTop: '20px' }}>Loading submissions...</p>
            </div>
          ) : submissions.length > 0 ? (
            <>
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Court Agreement No</th>
                    <th>Name</th>
                    <th>Amount (AED)</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((item, index) => (
                    <tr
                      key={item._id}
                      onClick={() => navigate(item.status === 'draft' ? `/form/${item._id}` : `/view/${item._id}`)}
                      className={item.status === 'draft' ? 'draft-row' : ''}
                    >
                      <td>{(currentPage - 1) * 10 + index + 1}</td>
                      <td className="agreement-number">
                        {item.courtAgreementNumber || 'N/A'}
                      </td>
                      <td>{item.personalInfo?.fullName || 'N/A'}</td>
                      <td className="amount-cell">
                        {formatAmount(item.investmentDetails?.amount)}
                      </td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'draft'
                            ? `Draft (${item.completedSections?.length || 0}/7)`
                            : item.status}
                        </span>
                      </td>
                      <td>{formatDate(item.submittedAt || item.createdAt)}</td>
                      <td>
                        <div className="action-btns">
                          {item.status === 'draft' ? (
                            <button
                              className="action-btn edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/form/${item._id}`);
                              }}
                              title="Continue editing"
                            >
                              <FiEdit2 />
                            </button>
                          ) : (
                            <button
                              className="action-btn view"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/view/${item._id}`);
                              }}
                            >
                              <FiEye />
                            </button>
                          )}
                          {(item.status === 'draft' || item.status === 'pending') && (
                            <button
                              className="action-btn edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/form/${item._id}`);
                              }}
                            >
                              <FiEdit2 />
                            </button>
                          )}
                          {item.status !== 'verified' && (
                            <button
                              className="action-btn delete"
                              onClick={(e) => handleDelete(item._id, e)}
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <FiFileText style={{ fontSize: '4rem', opacity: 0.3 }} />
              <h4>No Submissions Found</h4>
              <p>
                {searchTerm
                  ? 'No submissions match your search criteria.'
                  : 'You haven\'t submitted any forms yet.'}
              </p>
              {!searchTerm && (
                <button
                  className="btn btn-primary"
                  style={{
                    width: 'auto',
                    padding: '15px 30px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onClick={() => navigate('/form')}
                >
                  <FiPlus style={{ fontSize: '1.5rem' }} />
                  <span>Create Your First Submission</span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiEdit2, FiExternalLink } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { submissionAPI } from '../services/api';

const ViewSubmission = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      const response = await submissionAPI.getById(id);
      if (response.data.success) {
        setSubmission(response.data.submission);
      } else {
        alert('Submission not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading submission:', error);
      alert('Failed to load submission');
      navigate('/dashboard');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="app-container">
        <Header />
        <div className="form-page-container">
          <div className="empty-state">
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            <p style={{ marginTop: '20px' }}>Loading submission...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!submission) return null;

  const {
    courtAgreementNumber,
    personalInfo,
    bankDetails,
    investmentDetails,
    paymentMethod,
    dividendHistory,
    documents,
    remarks,
    declaration,
    status,
    submittedAt,
  } = submission;

  return (
    <div className="app-container">
      <Header />

      <main className="form-page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--primary-gold)',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            <FiArrowLeft /> Back to Dashboard
          </button>
          {status === 'pending' && (
            <button
              onClick={() => navigate(`/form/${id}`)}
              className="btn btn-primary"
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              <FiEdit2 /> Edit Submission
            </button>
          )}
        </div>

        <div className="form-card">
          <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Submission Details</h2>
              <p>Court Agreement: {courtAgreementNumber || 'N/A'}</p>
            </div>
            <span className={`status-badge ${status}`} style={{ fontSize: '1rem', padding: '8px 20px' }}>
              {status}
            </span>
          </div>

          <div style={{ padding: '30px' }}>
            {/* Personal Information */}
            <div style={{ marginBottom: '40px' }}>
              <h3 className="section-title">Personal Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Full Name</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Email</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.email || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Phone</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mobile</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.mobile || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Country</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.country || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>City</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.city || 'N/A'}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Address</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.address || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>State</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.state || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Postal Code</label>
                  <p style={{ marginTop: '5px' }}>{personalInfo?.pincode || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div style={{ marginBottom: '40px' }}>
              <h3 className="section-title">Bank Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Bank Name</label>
                  <p style={{ marginTop: '5px' }}>{bankDetails?.bankName || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account Number</label>
                  <p style={{ marginTop: '5px' }}>{bankDetails?.accountNumber || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account Holder</label>
                  <p style={{ marginTop: '5px' }}>{bankDetails?.accountHolderName || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Branch</label>
                  <p style={{ marginTop: '5px' }}>{bankDetails?.branchName || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>IBAN/SWIFT</label>
                  <p style={{ marginTop: '5px' }}>{bankDetails?.iban || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div style={{ marginBottom: '40px' }}>
              <h3 className="section-title">Investment Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Reference Number</label>
                  <p style={{ marginTop: '5px' }}>{investmentDetails?.referenceNumber || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Investment Amount</label>
                  <p style={{ marginTop: '5px', color: 'var(--primary-gold)', fontWeight: '600' }}>
                    AED {formatAmount(investmentDetails?.amount)}
                  </p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Investment Date</label>
                  <p style={{ marginTop: '5px' }}>{formatDate(investmentDetails?.investmentDate)}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Duration</label>
                  <p style={{ marginTop: '5px' }}>{investmentDetails?.duration || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Annual Dividend %</label>
                  <p style={{ marginTop: '5px' }}>{investmentDetails?.annualDividendPercentage || 'N/A'}%</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Dividend Frequency</label>
                  <p style={{ marginTop: '5px', textTransform: 'capitalize' }}>{investmentDetails?.dividendFrequency || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Investment Status</label>
                  <p style={{ marginTop: '5px', textTransform: 'capitalize' }}>{investmentDetails?.status || 'N/A'}</p>
                </div>
              </div>

              {/* Payment Method */}
              <h4 style={{ color: 'var(--text-muted)', marginTop: '30px', marginBottom: '15px' }}>Payment Method</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Method</label>
                  <p style={{ marginTop: '5px', textTransform: 'capitalize' }}>{paymentMethod?.method?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Paid by Cheque</label>
                  <p style={{ marginTop: '5px' }}>{paymentMethod?.paidByCheque ? 'Yes' : 'No'}</p>
                </div>
                {paymentMethod?.paidByCheque && (
                  <>
                    <div>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cheque Number</label>
                      <p style={{ marginTop: '5px' }}>{paymentMethod?.chequeNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cheque Date</label>
                      <p style={{ marginTop: '5px' }}>{formatDate(paymentMethod?.chequeDate)}</p>
                    </div>
                    <div>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cheque Bank</label>
                      <p style={{ marginTop: '5px' }}>{paymentMethod?.chequeBankName || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dividend History */}
            <div style={{ marginBottom: '40px' }}>
              <h3 className="section-title">Dividend History</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Received</label>
                  <p style={{ marginTop: '5px' }}>AED {formatAmount(dividendHistory?.totalReceived)}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Last Received Date</label>
                  <p style={{ marginTop: '5px' }}>{formatDate(dividendHistory?.lastReceivedDate)}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Last Amount</label>
                  <p style={{ marginTop: '5px' }}>AED {formatAmount(dividendHistory?.lastAmount)}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Has Pending Dividends</label>
                  <p style={{ marginTop: '5px' }}>{dividendHistory?.hasPending ? 'Yes' : 'No'}</p>
                </div>
                {dividendHistory?.hasPending && (
                  <div>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending Amount</label>
                    <p style={{ marginTop: '5px' }}>AED {formatAmount(dividendHistory?.pendingAmount)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            {documents && Object.keys(documents).some(key => documents[key]) && (
              <div style={{ marginBottom: '40px' }}>
                <h3 className="section-title">Documents</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  {documents.agreementCopy && (
                    <a
                      href={documents.agreementCopy}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 15px',
                        background: 'var(--bg-input)',
                        borderRadius: '8px',
                        color: 'var(--primary-gold)',
                        textDecoration: 'none',
                      }}
                    >
                      <FiExternalLink /> Agreement Copy
                    </a>
                  )}
                  {documents.paymentProof && (
                    <a
                      href={documents.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 15px',
                        background: 'var(--bg-input)',
                        borderRadius: '8px',
                        color: 'var(--primary-gold)',
                        textDecoration: 'none',
                      }}
                    >
                      <FiExternalLink /> Payment Proof
                    </a>
                  )}
                  {documents.dividendReceipts && (
                    <a
                      href={documents.dividendReceipts}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 15px',
                        background: 'var(--bg-input)',
                        borderRadius: '8px',
                        color: 'var(--primary-gold)',
                        textDecoration: 'none',
                      }}
                    >
                      <FiExternalLink /> Dividend Receipts
                    </a>
                  )}
                  {documents.otherDocuments && (
                    <a
                      href={documents.otherDocuments}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 15px',
                        background: 'var(--bg-input)',
                        borderRadius: '8px',
                        color: 'var(--primary-gold)',
                        textDecoration: 'none',
                      }}
                    >
                      <FiExternalLink /> Other Documents
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Remarks */}
            {(remarks?.discrepancies || remarks?.additionalDetails || remarks?.contactPerson) && (
              <div style={{ marginBottom: '40px' }}>
                <h3 className="section-title">Remarks</h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {remarks?.discrepancies && (
                    <div>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Discrepancies</label>
                      <p style={{ marginTop: '5px' }}>{remarks.discrepancies}</p>
                    </div>
                  )}
                  {remarks?.additionalDetails && (
                    <div>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Additional Details</label>
                      <p style={{ marginTop: '5px' }}>{remarks.additionalDetails}</p>
                    </div>
                  )}
                  {remarks?.contactPerson && (
                    <div>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Contact Person</label>
                      <p style={{ marginTop: '5px' }}>{remarks.contactPerson}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Declaration & Submission Info */}
            <div>
              <h3 className="section-title">Declaration</h3>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Declaration Confirmed</label>
                  <p style={{ marginTop: '5px' }}>{declaration?.confirmed ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Digital Signature</label>
                  <p style={{ marginTop: '5px', fontStyle: 'italic' }}>{declaration?.signature || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Submitted On</label>
                  <p style={{ marginTop: '5px' }}>{formatDate(submittedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ViewSubmission;

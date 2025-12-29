import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiEdit2, FiExternalLink, FiClipboard, FiUpload, FiCheck, FiClock } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { submissionAPI } from '../services/api';
import ConsentModal from '../components/ConsentModal';

const ViewSubmission = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

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

  const handleDownloadPDF = () => {
    if (!submission) return;

    // Create print-friendly HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Investment Submission - ${submission.courtAgreementNumber || 'N/A'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #D4AF37;
            padding-bottom: 20px;
          }
          .print-header h1 {
            color: #D4AF37;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .print-header p {
            color: #666;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 10px;
          }
          .status-badge.pending { background: #FEF3C7; color: #92400E; }
          .status-badge.verified { background: #D1FAE5; color: #065F46; }
          .status-badge.rejected { background: #FEE2E2; color: #991B1B; }
          .status-badge.draft { background: #E5E7EB; color: #374151; }
          .section { margin-bottom: 25px; }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #D4AF37;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .field { margin-bottom: 10px; }
          .field label {
            display: block;
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .field p {
            font-size: 14px;
            color: #333;
          }
          .field.highlight p {
            color: #D4AF37;
            font-weight: 600;
          }
          .full-width { grid-column: span 2; }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          @media print {
            body { padding: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Matajar Group - Investor Portal</h1>
          <p>Investment Submission Details</p>
          <span class="status-badge ${submission.status}">${submission.status}</span>
        </div>

        <div class="section">
          <h3 class="section-title">Reference Information</h3>
          <div class="grid">
            <div class="field">
              <label>Court Agreement Number</label>
              <p>${submission.courtAgreementNumber || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Submission Date</label>
              <p>${formatDate(submission.submittedAt || submission.createdAt)}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Personal Information</h3>
          <div class="grid">
            <div class="field">
              <label>Full Name</label>
              <p>${submission.personalInfo?.fullName || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Email</label>
              <p>${submission.personalInfo?.email || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Phone</label>
              <p>${submission.personalInfo?.phone || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Mobile</label>
              <p>${submission.personalInfo?.mobile || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Country</label>
              <p>${submission.personalInfo?.country || 'N/A'}</p>
            </div>
            <div class="field">
              <label>City</label>
              <p>${submission.personalInfo?.city || 'N/A'}</p>
            </div>
            <div class="field full-width">
              <label>Address</label>
              <p>${submission.personalInfo?.address || 'N/A'}</p>
            </div>
            <div class="field">
              <label>State</label>
              <p>${submission.personalInfo?.state || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Postal Code</label>
              <p>${submission.personalInfo?.pincode || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Bank Details</h3>
          <div class="grid">
            <div class="field">
              <label>Bank Name</label>
              <p>${submission.bankDetails?.bankName || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Account Number</label>
              <p>${submission.bankDetails?.accountNumber || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Account Holder</label>
              <p>${submission.bankDetails?.accountHolderName || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Branch</label>
              <p>${submission.bankDetails?.branchName || 'N/A'}</p>
            </div>
            <div class="field">
              <label>IBAN/SWIFT</label>
              <p>${submission.bankDetails?.iban || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Investment Details</h3>
          <div class="grid">
            <div class="field highlight">
              <label>Investment Amount</label>
              <p>AED ${formatAmount(submission.investmentDetails?.amount)}</p>
            </div>
            <div class="field">
              <label>Investment Date</label>
              <p>${formatDate(submission.investmentDetails?.investmentDate)}</p>
            </div>
            <div class="field">
              <label>Duration</label>
              <p>${submission.investmentDetails?.duration || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Annual Dividend %</label>
              <p>${submission.investmentDetails?.annualDividendPercentage || 'N/A'}%</p>
            </div>
            <div class="field">
              <label>Dividend Frequency</label>
              <p style="text-transform: capitalize;">${submission.investmentDetails?.dividendFrequency || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Investment Status</label>
              <p style="text-transform: capitalize;">${submission.investmentDetails?.status || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Payment Method</label>
              <p style="text-transform: capitalize;">${submission.paymentMethod?.method?.replace('_', ' ') || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Paid by Cheque</label>
              <p>${submission.paymentMethod?.paidByCheque ? 'Yes' : 'No'}</p>
            </div>
            ${submission.paymentMethod?.paidByCheque ? `
            <div class="field">
              <label>Cheque Number</label>
              <p>${submission.paymentMethod?.chequeNumber || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Cheque Date</label>
              <p>${formatDate(submission.paymentMethod?.chequeDate)}</p>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Dividend History</h3>
          <div class="grid">
            <div class="field">
              <label>Total Received</label>
              <p>AED ${formatAmount(submission.dividendHistory?.totalReceived)}</p>
            </div>
            <div class="field">
              <label>Last Received Date</label>
              <p>${formatDate(submission.dividendHistory?.lastReceivedDate)}</p>
            </div>
            <div class="field">
              <label>Last Amount</label>
              <p>AED ${formatAmount(submission.dividendHistory?.lastAmount)}</p>
            </div>
            <div class="field">
              <label>Has Pending</label>
              <p>${submission.dividendHistory?.hasPending ? 'Yes - AED ' + formatAmount(submission.dividendHistory?.pendingAmount) : 'No'}</p>
            </div>
          </div>
        </div>

        ${(submission.remarks?.discrepancies || submission.remarks?.additionalDetails) ? `
        <div class="section">
          <h3 class="section-title">Remarks</h3>
          <div class="grid">
            ${submission.remarks?.discrepancies ? `
            <div class="field full-width">
              <label>Discrepancies</label>
              <p>${submission.remarks.discrepancies}</p>
            </div>
            ` : ''}
            ${submission.remarks?.additionalDetails ? `
            <div class="field full-width">
              <label>Additional Details</label>
              <p>${submission.remarks.additionalDetails}</p>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h3 class="section-title">Declaration</h3>
          <div class="grid">
            <div class="field">
              <label>Declaration Confirmed</label>
              <p>${submission.declaration?.confirmed ? 'Yes' : 'No'}</p>
            </div>
            <div class="field">
              <label>Digital Signature</label>
              <p style="font-style: italic;">${submission.declaration?.signature || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p>Matajar Group - Investor Portal</p>
        </div>
      </body>
      </html>
    `;

    // Open new window for print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  };

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

  const handleConsentUpdate = (updatedSubmission) => {
    setSubmission(updatedSubmission);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadPDF}
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FiDownload /> Download PDF
            </button>
            {(status === 'pending' || status === 'rejected') && (
              <button
                onClick={() => navigate(`/form/${id}`)}
                className="btn btn-primary"
                style={{ width: 'auto', padding: '10px 20px' }}
              >
                <FiEdit2 /> Edit Submission
              </button>
            )}
          </div>
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

          {/* Rejection Reason Alert */}
          {status === 'rejected' && submission?.rejectionReason && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '16px',
              margin: '20px 30px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <h4 style={{ color: '#991B1B', fontWeight: '600', marginBottom: '8px', fontSize: '1rem' }}>
                  Submission Rejected
                </h4>
                <p style={{ color: '#7F1D1D', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {submission.rejectionReason}
                </p>
                {submission.rejectedAt && (
                  <p style={{ color: '#991B1B', fontSize: '0.8rem', marginTop: '8px', opacity: 0.8 }}>
                    Rejected on: {formatDate(submission.rejectedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Discrepancy Alert */}
          {status === 'discrepancy' && (
            <div style={{
              background: '#FFFBEB',
              border: '2px solid #F59E0B',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 30px',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div>
                  <h4 style={{ color: '#92400E', fontWeight: '700', marginBottom: '4px', fontSize: '1.1rem' }}>
                    Clarification Required
                  </h4>
                  <p style={{ color: '#A16207', fontSize: '0.9rem' }}>
                    We found discrepancies between your submission and our records. Please review the details below.
                  </p>
                </div>
              </div>

              {/* Discrepancy Details Table */}
              {submission.discrepancyDetails && (
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h5 style={{ color: '#92400E', fontWeight: '600', marginBottom: '12px', fontSize: '0.95rem' }}>
                    Discrepancy Details
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {submission.discrepancyDetails.investmentAmount && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '10px',
                        padding: '10px',
                        background: '#FEF3C7',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#92400E', display: 'block' }}>Field</span>
                          <span style={{ fontWeight: '600', color: '#78350F' }}>Investment Amount</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#0369A1', display: 'block' }}>Your Claim</span>
                          <span style={{ fontWeight: '600', color: '#0369A1' }}>AED {formatAmount(submission.discrepancyDetails.investmentAmount.claimed)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>Our Records</span>
                          <span style={{ fontWeight: '600', color: '#166534' }}>AED {formatAmount(submission.discrepancyDetails.investmentAmount.actual)}</span>
                        </div>
                      </div>
                    )}
                    {submission.discrepancyDetails.investmentDate && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '10px',
                        padding: '10px',
                        background: '#FEF3C7',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#92400E', display: 'block' }}>Field</span>
                          <span style={{ fontWeight: '600', color: '#78350F' }}>Investment Date</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#0369A1', display: 'block' }}>Your Claim</span>
                          <span style={{ fontWeight: '600', color: '#0369A1' }}>{formatDate(submission.discrepancyDetails.investmentDate.claimed)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>Our Records</span>
                          <span style={{ fontWeight: '600', color: '#166534' }}>{formatDate(submission.discrepancyDetails.investmentDate.actual)}</span>
                        </div>
                      </div>
                    )}
                    {submission.discrepancyDetails.dividendAmount && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '10px',
                        padding: '10px',
                        background: '#FEF3C7',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#92400E', display: 'block' }}>Field</span>
                          <span style={{ fontWeight: '600', color: '#78350F' }}>Total Dividends</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#0369A1', display: 'block' }}>Your Claim</span>
                          <span style={{ fontWeight: '600', color: '#0369A1' }}>AED {formatAmount(submission.discrepancyDetails.dividendAmount.claimed)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>Our Records</span>
                          <span style={{ fontWeight: '600', color: '#166534' }}>AED {formatAmount(submission.discrepancyDetails.dividendAmount.actual)}</span>
                        </div>
                      </div>
                    )}
                    {submission.discrepancyDetails.duration && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '10px',
                        padding: '10px',
                        background: '#FEF3C7',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#92400E', display: 'block' }}>Field</span>
                          <span style={{ fontWeight: '600', color: '#78350F' }}>Duration</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#0369A1', display: 'block' }}>Your Claim</span>
                          <span style={{ fontWeight: '600', color: '#0369A1' }}>{submission.discrepancyDetails.duration.claimed} months</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>Our Records</span>
                          <span style={{ fontWeight: '600', color: '#166534' }}>{submission.discrepancyDetails.duration.actual} months</span>
                        </div>
                      </div>
                    )}
                    {submission.discrepancyDetails.referenceNumber && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '10px',
                        padding: '10px',
                        background: '#FEF3C7',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#92400E', display: 'block' }}>Field</span>
                          <span style={{ fontWeight: '600', color: '#78350F' }}>Reference Number</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#0369A1', display: 'block' }}>Your Claim</span>
                          <span style={{ fontWeight: '600', color: '#0369A1' }}>{submission.discrepancyDetails.referenceNumber.claimed || 'Not provided'}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>Our Records</span>
                          <span style={{ fontWeight: '600', color: '#166534' }}>{submission.discrepancyDetails.referenceNumber.actual || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Notes */}
                  {submission.discrepancyDetails.adminNotes && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: '#F3F4F6',
                      borderRadius: '6px',
                      borderLeft: '4px solid #F59E0B'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Note from Reviewer:</span>
                      <p style={{ color: '#374151', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {submission.discrepancyDetails.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Download Discrepancy Report Button */}
              {submission.discrepancyPdfUrl && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <button
                    onClick={() => window.open(submission.discrepancyPdfUrl, '_blank')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                    }}
                  >
                    <FiDownload /> Download Full Discrepancy Report (PDF)
                  </button>
                </div>
              )}

              {/* Action Required */}
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h5 style={{ color: '#1E40AF', fontWeight: '600', marginBottom: '10px', fontSize: '0.95rem' }}>
                  What You Need To Do
                </h5>
                <ul style={{
                  color: '#1E40AF',
                  fontSize: '0.85rem',
                  lineHeight: '1.8',
                  paddingLeft: '20px',
                  margin: 0
                }}>
                  <li>Review the discrepancies listed above carefully</li>
                  <li>Gather any supporting documents (bank statements, receipts, agreements)</li>
                  <li>If you have documents to upload, please contact our support team</li>
                  <li>If you agree with our records, you can acknowledge the corrected amounts</li>
                </ul>
                <p style={{
                  marginTop: '12px',
                  fontSize: '0.8rem',
                  color: '#6B7280',
                  fontStyle: 'italic'
                }}>
                  Please respond within 14 days to avoid delays in processing your request.
                </p>
              </div>
            </div>
          )}

          {/* Consent Section - Only show for verified submissions with consent */}
          {status === 'verified' && submission.consent && submission.consent.status !== 'not_required' && (
            <div style={{
              background: submission.consent.status === 'fully_executed' ? '#ECFDF5' :
                          submission.consent.status === 'investor_signed' ? '#EFF6FF' : '#FFFBEB',
              border: `2px solid ${submission.consent.status === 'fully_executed' ? '#10B981' :
                       submission.consent.status === 'investor_signed' ? '#3B82F6' : '#F59E0B'}`,
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 30px',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                {submission.consent.status === 'fully_executed' ? (
                  <FiCheck style={{ fontSize: '28px', color: '#10B981', flexShrink: 0 }} />
                ) : submission.consent.status === 'investor_signed' ? (
                  <FiClock style={{ fontSize: '28px', color: '#3B82F6', flexShrink: 0 }} />
                ) : (
                  <FiClipboard style={{ fontSize: '28px', color: '#F59E0B', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    color: submission.consent.status === 'fully_executed' ? '#065F46' :
                           submission.consent.status === 'investor_signed' ? '#1E40AF' : '#92400E',
                    fontWeight: '700',
                    marginBottom: '4px',
                    fontSize: '1.1rem'
                  }}>
                    {submission.consent.status === 'fully_executed' ? 'Consent Completed' :
                     submission.consent.status === 'investor_signed' ? 'Awaiting Company Signature' :
                     'Consent Required'}
                  </h4>
                  <p style={{
                    color: submission.consent.status === 'fully_executed' ? '#047857' :
                           submission.consent.status === 'investor_signed' ? '#2563EB' : '#B45309',
                    fontSize: '0.9rem'
                  }}>
                    {submission.consent.status === 'fully_executed' ?
                      'Both you and the company have signed the consent document. You can download the fully executed copy below.' :
                     submission.consent.status === 'investor_signed' ?
                      'Thank you for signing! The company is now reviewing and will add their authorization.' :
                      'Please download, sign, and upload the consent document to proceed with your investment closure.'}
                  </p>
                </div>
              </div>

              {/* Consent Info */}
              {submission.consent.consentNumber && (
                <div style={{
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Reference No:</span>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827', fontFamily: 'monospace' }}>
                      {submission.consent.consentNumber}
                    </p>
                  </div>
                  {submission.consent.investorSignedAt && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>You Signed On:</span>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>
                        {formatDate(submission.consent.investorSignedAt)}
                      </p>
                    </div>
                  )}
                  {submission.consent.companySignedAt && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Company Signed On:</span>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>
                        {formatDate(submission.consent.companySignedAt)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => setConsentModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: submission.consent.status === 'fully_executed' ?
                      'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                      submission.consent.status === 'investor_signed' ?
                      'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' :
                      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                  }}
                >
                  {submission.consent.status === 'pending' ? (
                    <><FiUpload /> Download & Sign Consent</>
                  ) : submission.consent.status === 'investor_signed' ? (
                    <><FiClock /> View Consent Status</>
                  ) : (
                    <><FiDownload /> Download Final Consent</>
                  )}
                </button>
              </div>
            </div>
          )}

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

      {/* Consent Modal */}
      <ConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        submission={submission}
        onConsentUpdate={handleConsentUpdate}
      />
    </div>
  );
};

export default ViewSubmission;

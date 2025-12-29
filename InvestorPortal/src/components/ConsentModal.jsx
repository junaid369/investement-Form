import { useState, useRef } from 'react';
import { FiX, FiDownload, FiUpload, FiCheck, FiClock, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { consentAPI } from '../services/api';

const ConsentModal = ({ isOpen, onClose, submission, onConsentUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !submission) return null;

  const consent = submission.consent || { status: 'not_required' };
  const { status, blankPdfUrl, investorSignedPdfUrl, fullyExecutedPdfUrl, consentNumber } = consent;

  const handleDownload = (url, filename) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'consent.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('consentPdf', file);

      const response = await consentAPI.uploadInvestorSigned(submission._id, formData);

      if (response.data.success) {
        setUploadSuccess(true);
        if (onConsentUpdate) {
          onConsentUpdate(response.data.data);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload consent document');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return (
          <span className="consent-status-badge pending">
            <FiClock /> Awaiting Your Signature
          </span>
        );
      case 'investor_signed':
        return (
          <span className="consent-status-badge investor-signed">
            <FiCheck /> You Signed - Awaiting Company
          </span>
        );
      case 'fully_executed':
        return (
          <span className="consent-status-badge completed">
            <FiCheck /> Fully Executed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="consent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <FiFileText /> Consent Document
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Status Badge */}
          <div className="consent-status-section">
            {getStatusBadge()}
            {consentNumber && (
              <span className="consent-number">Ref: {consentNumber}</span>
            )}
          </div>

          {/* Submission Info */}
          <div className="consent-info">
            <div className="info-row">
              <span className="label">Investor:</span>
              <span className="value">{submission.personalInfo?.fullName || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Agreement No:</span>
              <span className="value">{submission.courtAgreementNumber || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Amount:</span>
              <span className="value">AED {Number(submission.investmentDetails?.amount || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Instructions based on status */}
          {status === 'pending' && (
            <div className="consent-instructions">
              <h4>Steps to Complete:</h4>
              <ol>
                <li>Download the consent document below</li>
                <li>Print, review, and sign where indicated</li>
                <li>Scan or photograph the signed document</li>
                <li>Upload the signed PDF using the upload button</li>
              </ol>
            </div>
          )}

          {status === 'investor_signed' && (
            <div className="consent-instructions success">
              <FiCheck style={{ fontSize: '1.5rem', color: '#10b981' }} />
              <p>Thank you! Your signed consent has been received. The company will now review and add their authorization.</p>
            </div>
          )}

          {status === 'fully_executed' && (
            <div className="consent-instructions success">
              <FiCheck style={{ fontSize: '1.5rem', color: '#10b981' }} />
              <p>The consent document has been fully executed by both parties. You can download the final copy below.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="consent-actions">
            {/* Download Blank/Latest PDF */}
            {status === 'pending' && blankPdfUrl && (
              <button
                className="consent-btn download"
                onClick={() => handleDownload(blankPdfUrl, `${consentNumber}_blank.pdf`)}
              >
                <FiDownload /> Download Consent Form
              </button>
            )}

            {/* Upload Signed PDF */}
            {status === 'pending' && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  className="consent-btn upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-small"></span> Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload /> Upload Signed Consent
                    </>
                  )}
                </button>
              </>
            )}

            {/* View Signed Copy */}
            {(status === 'investor_signed' || status === 'fully_executed') && investorSignedPdfUrl && (
              <button
                className="consent-btn secondary"
                onClick={() => handleDownload(investorSignedPdfUrl, `${consentNumber}_investor_signed.pdf`)}
              >
                <FiDownload /> Your Signed Copy
              </button>
            )}

            {/* View Fully Executed Copy */}
            {status === 'fully_executed' && fullyExecutedPdfUrl && (
              <button
                className="consent-btn download"
                onClick={() => handleDownload(fullyExecutedPdfUrl, `${consentNumber}_fully_executed.pdf`)}
              >
                <FiDownload /> Download Final Consent
              </button>
            )}
          </div>

          {/* Error/Success Messages */}
          {uploadError && (
            <div className="consent-message error">
              <FiAlertCircle /> {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="consent-message success">
              <FiCheck /> Consent document uploaded successfully!
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .consent-modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%);
          border-radius: 12px 12px 0 0;
        }

        .modal-header h3 {
          margin: 0;
          color: #d4af37;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.25rem;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-body {
          padding: 24px;
        }

        .consent-status-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .consent-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .consent-status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .consent-status-badge.investor-signed {
          background: #dbeafe;
          color: #1e40af;
        }

        .consent-status-badge.completed {
          background: #d1fae5;
          color: #065f46;
        }

        .consent-number {
          font-size: 0.75rem;
          color: #6b7280;
          font-family: monospace;
        }

        .consent-info {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row .label {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .info-row .value {
          color: #111827;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .consent-instructions {
          background: #eff6ff;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #3b82f6;
        }

        .consent-instructions.success {
          background: #ecfdf5;
          border-left-color: #10b981;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .consent-instructions h4 {
          margin: 0 0 10px 0;
          color: #1e40af;
          font-size: 0.9rem;
        }

        .consent-instructions ol {
          margin: 0;
          padding-left: 20px;
          color: #374151;
          font-size: 0.875rem;
        }

        .consent-instructions ol li {
          margin-bottom: 6px;
        }

        .consent-instructions p {
          margin: 0;
          color: #065f46;
          font-size: 0.875rem;
        }

        .consent-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .consent-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .consent-btn.download {
          background: linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%);
          color: #d4af37;
        }

        .consent-btn.download:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26, 58, 42, 0.3);
        }

        .consent-btn.upload {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .consent-btn.upload:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .consent-btn.upload:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .consent-btn.secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .consent-btn.secondary:hover {
          background: #e5e7eb;
        }

        .consent-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-top: 16px;
        }

        .consent-message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .consent-message.success {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ConsentModal;

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheck, FiRefreshCw } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { submissionAPI } from '../services/api';

const COUNTRY_CODES = [
  { code: '+971', country: 'UAE' },
  { code: '+91', country: 'India' },
  { code: '+966', country: 'KSA' },
  { code: '+973', country: 'Bahrain' },
  { code: '+968', country: 'Oman' },
  { code: '+974', country: 'Qatar' },
  { code: '+965', country: 'Kuwait' },
  { code: '+44', country: 'UK' },
  { code: '+1', country: 'USA' },
];

const STORAGE_KEY = 'investorForm_draft';

const initialFormData = {
  courtAgreementNumber: '',
  personalInfo: {
    fullName: '',
    email: '',
    phoneCode: '+971',
    phone: '',
    mobileCode: '+971',
    mobile: '',
    country: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  },
  bankDetails: {
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branchName: '',
    iban: '',
  },
  investmentDetails: {
    referenceNumber: '',
    amount: '',
    investmentDate: '',
    duration: '',
    annualDividendPercentage: '',
    dividendFrequency: '',
    status: '',
  },
  paymentMethod: {
    method: '',
    paidByCheque: false,
    chequeNumber: '',
    chequeDate: '',
    chequeBankName: '',
  },
  dividendHistory: {
    totalReceived: '',
    lastReceivedDate: '',
    lastAmount: '',
    hasPending: false,
    pendingAmount: '',
  },
  remarks: {
    discrepancies: '',
    additionalDetails: '',
    contactPerson: '',
  },
  declaration: {
    confirmed: false,
    signature: '',
  },
  // Track completed sections (1-7)
  completedSections: [],
};

const InvestmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState({
    agreementCopy: null,
    paymentProof: null,
    dividendReceipts: null,
    otherDocuments: null,
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [draftId, setDraftId] = useState(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);

  const totalSections = 7;

  // Load from localStorage on mount (for new forms only)
  useEffect(() => {
    if (!id) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Check if there's meaningful saved data
          if (parsed.formData?.personalInfo?.fullName || parsed.formData?.courtAgreementNumber) {
            setHasSavedDraft(true);
            setShowDraftModal(true);
          }
        } catch (e) {
          console.error('Error checking saved form:', e);
        }
      }
    }
  }, [id]);

  // Load saved draft data
  const loadSavedDraft = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed.formData || initialFormData);
        setCurrentSection(parsed.currentSection || 1);
        setDraftId(parsed.draftId || null);
      } catch (e) {
        console.error('Error loading saved form:', e);
      }
    }
    setShowDraftModal(false);
  };

  // Clear saved draft and start fresh
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(initialFormData);
    setCurrentSection(1);
    setDraftId(null);
    setHasSavedDraft(false);
    setShowDraftModal(false);
  };

  // Load existing submission if editing
  useEffect(() => {
    if (id) {
      loadSubmission();
    }
  }, [id]);

  // Save to localStorage on form change (for new forms)
  useEffect(() => {
    if (!id && (formData.personalInfo.fullName || formData.courtAgreementNumber)) {
      const dataToSave = {
        formData,
        currentSection,
        draftId,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [formData, currentSection, draftId, id]);

  // Auto-save draft to server
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.personalInfo.fullName || formData.courtAgreementNumber) {
        saveDraft();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [formData]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      const response = await submissionAPI.getById(id);
      if (response.data.success) {
        const data = response.data.submission;
        setFormData({
          courtAgreementNumber: data.courtAgreementNumber || '',
          personalInfo: {
            fullName: data.personalInfo?.fullName || '',
            email: data.personalInfo?.email || '',
            phoneCode: data.personalInfo?.phoneCode || '+971',
            phone: data.personalInfo?.phone?.replace(/^\+\d+/, '') || '',
            mobileCode: data.personalInfo?.mobileCode || '+971',
            mobile: data.personalInfo?.mobile?.replace(/^\+\d+/, '') || '',
            country: data.personalInfo?.country || '',
            address: data.personalInfo?.address || '',
            city: data.personalInfo?.city || '',
            state: data.personalInfo?.state || '',
            pincode: data.personalInfo?.pincode || '',
          },
          bankDetails: data.bankDetails || initialFormData.bankDetails,
          investmentDetails: data.investmentDetails || initialFormData.investmentDetails,
          paymentMethod: data.paymentMethod || initialFormData.paymentMethod,
          dividendHistory: data.dividendHistory || initialFormData.dividendHistory,
          remarks: data.remarks || initialFormData.remarks,
          declaration: data.declaration || initialFormData.declaration,
          completedSections: data.completedSections || [],
        });
        // Go to first incomplete section or last section
        if (data.completedSections && data.completedSections.length > 0) {
          const nextIncomplete = [1, 2, 3, 4, 5, 6, 7].find(s => !data.completedSections.includes(s));
          setCurrentSection(nextIncomplete || 7);
        }
      }
    } catch (error) {
      console.error('Error loading submission:', error);
      alert('Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const draftData = {
        ...formData,
        personalInfo: {
          ...formData.personalInfo,
          phone: formData.personalInfo.phoneCode + formData.personalInfo.phone,
          mobile: formData.personalInfo.mobile
            ? formData.personalInfo.mobileCode + formData.personalInfo.mobile
            : null,
        },
        completedSections: formData.completedSections,
        status: 'draft', // Always draft until final submit
      };

      if (id) {
        await submissionAPI.updateDraft(id, draftData);
      } else if (draftId) {
        await submissionAPI.updateDraft(draftId, draftData);
      } else {
        const response = await submissionAPI.saveDraft(draftData);
        if (response.data.success && response.data.submission?._id) {
          setDraftId(response.data.submission._id);
        }
      }
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus('error');
    } finally {
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [formData, id, draftId]);

  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // Clear error for this field
    if (errors[`${section}.${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  const handleRootChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (field, file) => {
    setFiles((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const validateSection = (sectionNum) => {
    const newErrors = {};

    switch (sectionNum) {
      case 1: // Personal Info
        if (!formData.personalInfo.fullName) newErrors['personalInfo.fullName'] = 'Required';
        if (!formData.personalInfo.email) newErrors['personalInfo.email'] = 'Required';
        if (!formData.personalInfo.phone) newErrors['personalInfo.phone'] = 'Required';
        if (!formData.personalInfo.country) newErrors['personalInfo.country'] = 'Required';
        break;
      case 2: // Bank Details
        if (!formData.bankDetails.bankName) newErrors['bankDetails.bankName'] = 'Required';
        if (!formData.bankDetails.accountNumber) newErrors['bankDetails.accountNumber'] = 'Required';
        if (!formData.bankDetails.accountHolderName) newErrors['bankDetails.accountHolderName'] = 'Required';
        break;
      case 3: // Investment Details
        if (!formData.investmentDetails.amount) newErrors['investmentDetails.amount'] = 'Required';
        if (!formData.investmentDetails.investmentDate) newErrors['investmentDetails.investmentDate'] = 'Required';
        if (!formData.investmentDetails.duration) newErrors['investmentDetails.duration'] = 'Required';
        if (!formData.investmentDetails.annualDividendPercentage) newErrors['investmentDetails.annualDividendPercentage'] = 'Required';
        if (!formData.investmentDetails.dividendFrequency) newErrors['investmentDetails.dividendFrequency'] = 'Required';
        if (!formData.investmentDetails.status) newErrors['investmentDetails.status'] = 'Required';
        break;
      case 7: // Declaration
        if (!formData.declaration.confirmed) newErrors['declaration.confirmed'] = 'You must confirm the declaration';
        if (!formData.declaration.signature) newErrors['declaration.signature'] = 'Signature is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextSection = () => {
    if (!validateSection(currentSection)) return;

    // Mark current section as complete
    if (!formData.completedSections.includes(currentSection)) {
      setFormData((prev) => ({
        ...prev,
        completedSections: [...prev.completedSections, currentSection],
      }));
    }

    if (currentSection < totalSections) {
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevSection = () => {
    if (currentSection > 1) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateSection(currentSection)) return;

    // Mark final section as complete
    const allCompleted = [...formData.completedSections];
    if (!allCompleted.includes(7)) {
      allCompleted.push(7);
    }

    setLoading(true);
    try {
      const submitData = new FormData();

      const formDataToSubmit = {
        ...formData,
        personalInfo: {
          ...formData.personalInfo,
          phone: formData.personalInfo.phoneCode + formData.personalInfo.phone,
          mobile: formData.personalInfo.mobile
            ? formData.personalInfo.mobileCode + formData.personalInfo.mobile
            : null,
        },
        completedSections: allCompleted,
        // Only set to 'pending' if all sections complete, otherwise 'draft'
        status: allCompleted.length === 7 ? 'pending' : 'draft',
      };

      submitData.append('formData', JSON.stringify(formDataToSubmit));

      // Add files
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          submitData.append(key, files[key]);
        }
      });

      const response = await submissionAPI.submitForm(submitData);

      if (response.data.success) {
        // Clear localStorage on successful submit
        localStorage.removeItem(STORAGE_KEY);
        alert('Form submitted successfully!');
        navigate('/dashboard');
      } else {
        alert(response.data.message || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
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

  return (
    <div className="app-container">
      <Header />

      {/* Draft Recovery Modal */}
      {showDraftModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Continue Previous Form?</h3>
            </div>
            <div className="modal-body">
              <p>You have an unsaved form in progress. Would you like to continue where you left off or start a new form?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={clearDraft}>
                <FiRefreshCw style={{ marginRight: '8px' }} /> Start Fresh
              </button>
              <button className="btn btn-primary" onClick={loadSavedDraft}>
                Continue Draft
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="form-page-container">
        <div className="form-card">
          <div className="form-header">
            <h2>{isEditing ? 'Edit Submission' : 'Investment Details Form'}</h2>
            <p>Please fill in all required information accurately</p>
            {!isEditing && hasSavedDraft && !showDraftModal && (
              <button
                type="button"
                className="clear-draft-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear this draft and start fresh?')) {
                    clearDraft();
                  }
                }}
                title="Clear draft and start fresh"
              >
                <FiRefreshCw /> Start Fresh
              </button>
            )}
          </div>

          <div className="form-progress">
            <div className="progress-steps">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <div
                  key={step}
                  className={`progress-step ${currentSection === step ? 'active' : ''} ${formData.completedSections.includes(step) ? 'completed' : ''}`}
                  onClick={() => {
                    // Allow jumping to completed sections or current
                    if (formData.completedSections.includes(step) || step <= currentSection) {
                      setCurrentSection(step);
                    }
                  }}
                  title={`Section ${step}${formData.completedSections.includes(step) ? ' (Completed)' : ''}`}
                >
                  {formData.completedSections.includes(step) ? <FiCheck /> : step}
                </div>
              ))}
            </div>
            <p className="progress-text">
              Step {currentSection} of {totalSections}
              {formData.completedSections.length > 0 && (
                <span style={{ color: 'var(--primary-color)', marginLeft: '10px' }}>
                  ({formData.completedSections.length} completed)
                </span>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Section 1: Personal Information */}
            <div className={`form-section ${currentSection === 1 ? 'active' : ''}`}>
              <h3 className="section-title">Personal Information</h3>

              <div className="form-row">
                <div className={`form-group ${errors['personalInfo.fullName'] ? 'error' : ''}`}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.personalInfo.fullName}
                    onChange={(e) => handleChange('personalInfo', 'fullName', e.target.value)}
                    placeholder="Enter your full name"
                  />
                  {errors['personalInfo.fullName'] && <span className="form-error">{errors['personalInfo.fullName']}</span>}
                </div>
                <div className={`form-group ${errors['personalInfo.email'] ? 'error' : ''}`}>
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.personalInfo.email}
                    onChange={(e) => handleChange('personalInfo', 'email', e.target.value)}
                    placeholder="Enter your email"
                  />
                  {errors['personalInfo.email'] && <span className="form-error">{errors['personalInfo.email']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className={`form-group ${errors['personalInfo.phone'] ? 'error' : ''}`}>
                  <label>Phone Number *</label>
                  <div className="phone-input-group">
                    <select
                      value={formData.personalInfo.phoneCode}
                      onChange={(e) => handleChange('personalInfo', 'phoneCode', e.target.value)}
                      className="phone-code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.personalInfo.phone}
                      onChange={(e) => handleChange('personalInfo', 'phone', e.target.value.replace(/\D/g, ''))}
                      placeholder="Phone number"
                      className="phone-number"
                    />
                  </div>
                  {errors['personalInfo.phone'] && <span className="form-error">{errors['personalInfo.phone']}</span>}
                </div>
                <div className="form-group">
                  <label>Mobile Number (Optional)</label>
                  <div className="phone-input-group">
                    <select
                      value={formData.personalInfo.mobileCode}
                      onChange={(e) => handleChange('personalInfo', 'mobileCode', e.target.value)}
                      className="phone-code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.personalInfo.mobile}
                      onChange={(e) => handleChange('personalInfo', 'mobile', e.target.value.replace(/\D/g, ''))}
                      placeholder="Mobile number"
                      className="phone-number"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className={`form-group ${errors['personalInfo.country'] ? 'error' : ''}`}>
                  <label>Country *</label>
                  <input
                    type="text"
                    value={formData.personalInfo.country}
                    onChange={(e) => handleChange('personalInfo', 'country', e.target.value)}
                    placeholder="Enter your country"
                  />
                  {errors['personalInfo.country'] && <span className="form-error">{errors['personalInfo.country']}</span>}
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.personalInfo.city}
                    onChange={(e) => handleChange('personalInfo', 'city', e.target.value)}
                    placeholder="Enter your city"
                  />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.personalInfo.address}
                    onChange={(e) => handleChange('personalInfo', 'address', e.target.value)}
                    placeholder="Enter your full address"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>State/Province</label>
                  <input
                    type="text"
                    value={formData.personalInfo.state}
                    onChange={(e) => handleChange('personalInfo', 'state', e.target.value)}
                    placeholder="Enter state/province"
                  />
                </div>
                <div className="form-group">
                  <label>Postal/PIN Code</label>
                  <input
                    type="text"
                    value={formData.personalInfo.pincode}
                    onChange={(e) => handleChange('personalInfo', 'pincode', e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Bank Details */}
            <div className={`form-section ${currentSection === 2 ? 'active' : ''}`}>
              <h3 className="section-title">Bank Details</h3>

              <div className="form-row">
                <div className={`form-group ${errors['bankDetails.bankName'] ? 'error' : ''}`}>
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => handleChange('bankDetails', 'bankName', e.target.value)}
                    placeholder="Enter bank name"
                  />
                  {errors['bankDetails.bankName'] && <span className="form-error">{errors['bankDetails.bankName']}</span>}
                </div>
                <div className={`form-group ${errors['bankDetails.accountNumber'] ? 'error' : ''}`}>
                  <label>Account Number *</label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => handleChange('bankDetails', 'accountNumber', e.target.value)}
                    placeholder="Enter account number"
                  />
                  {errors['bankDetails.accountNumber'] && <span className="form-error">{errors['bankDetails.accountNumber']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className={`form-group ${errors['bankDetails.accountHolderName'] ? 'error' : ''}`}>
                  <label>Account Holder Name *</label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountHolderName}
                    onChange={(e) => handleChange('bankDetails', 'accountHolderName', e.target.value)}
                    placeholder="Enter account holder name"
                  />
                  {errors['bankDetails.accountHolderName'] && <span className="form-error">{errors['bankDetails.accountHolderName']}</span>}
                </div>
                <div className="form-group">
                  <label>Branch Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails.branchName}
                    onChange={(e) => handleChange('bankDetails', 'branchName', e.target.value)}
                    placeholder="Enter branch name"
                  />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label>IBAN / SWIFT Code</label>
                  <input
                    type="text"
                    value={formData.bankDetails.iban}
                    onChange={(e) => handleChange('bankDetails', 'iban', e.target.value)}
                    placeholder="Enter IBAN or SWIFT code"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Investment Details */}
            <div className={`form-section ${currentSection === 3 ? 'active' : ''}`}>
              <h3 className="section-title">Investment Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Court Agreement Number</label>
                  <input
                    type="text"
                    value={formData.courtAgreementNumber}
                    onChange={(e) => handleRootChange('courtAgreementNumber', e.target.value)}
                    placeholder="e.g., SN2025/0000440833"
                  />
                </div>
                <div className="form-group">
                  <label>Reference Number</label>
                  <input
                    type="text"
                    value={formData.investmentDetails.referenceNumber}
                    onChange={(e) => handleChange('investmentDetails', 'referenceNumber', e.target.value)}
                    placeholder="Enter reference number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className={`form-group ${errors['investmentDetails.amount'] ? 'error' : ''}`}>
                  <label>Investment Amount (AED) *</label>
                  <input
                    type="number"
                    value={formData.investmentDetails.amount}
                    onChange={(e) => handleChange('investmentDetails', 'amount', e.target.value)}
                    placeholder="Enter amount"
                  />
                  {errors['investmentDetails.amount'] && <span className="form-error">{errors['investmentDetails.amount']}</span>}
                </div>
                <div className={`form-group ${errors['investmentDetails.investmentDate'] ? 'error' : ''}`}>
                  <label>Investment Date *</label>
                  <input
                    type="date"
                    value={formData.investmentDetails.investmentDate}
                    onChange={(e) => handleChange('investmentDetails', 'investmentDate', e.target.value)}
                  />
                  {errors['investmentDetails.investmentDate'] && <span className="form-error">{errors['investmentDetails.investmentDate']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className={`form-group ${errors['investmentDetails.duration'] ? 'error' : ''}`}>
                  <label>Investment Duration *</label>
                  <select
                    value={formData.investmentDetails.duration}
                    onChange={(e) => handleChange('investmentDetails', 'duration', e.target.value)}
                  >
                    <option value="">Select Duration</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                    <option value="2 years">2 Years</option>
                    <option value="3 years">3 Years</option>
                    <option value="5 years">5 Years</option>
                  </select>
                  {errors['investmentDetails.duration'] && <span className="form-error">{errors['investmentDetails.duration']}</span>}
                </div>
                <div className={`form-group ${errors['investmentDetails.annualDividendPercentage'] ? 'error' : ''}`}>
                  <label>Annual Dividend Percentage *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.investmentDetails.annualDividendPercentage}
                    onChange={(e) => handleChange('investmentDetails', 'annualDividendPercentage', e.target.value)}
                    placeholder="e.g., 12"
                  />
                  {errors['investmentDetails.annualDividendPercentage'] && <span className="form-error">{errors['investmentDetails.annualDividendPercentage']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className={`form-group ${errors['investmentDetails.dividendFrequency'] ? 'error' : ''}`}>
                  <label>Dividend Frequency *</label>
                  <select
                    value={formData.investmentDetails.dividendFrequency}
                    onChange={(e) => handleChange('investmentDetails', 'dividendFrequency', e.target.value)}
                  >
                    <option value="">Select Frequency</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annually">Semi-Annually</option>
                    <option value="annually">Annually</option>
                  </select>
                  {errors['investmentDetails.dividendFrequency'] && <span className="form-error">{errors['investmentDetails.dividendFrequency']}</span>}
                </div>
                <div className={`form-group ${errors['investmentDetails.status'] ? 'error' : ''}`}>
                  <label>Investment Status *</label>
                  <select
                    value={formData.investmentDetails.status}
                    onChange={(e) => handleChange('investmentDetails', 'status', e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="active">Active</option>
                    <option value="matured">Matured</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  {errors['investmentDetails.status'] && <span className="form-error">{errors['investmentDetails.status']}</span>}
                </div>
              </div>

              {/* Payment Method within Investment Details */}
              <h4 style={{ color: 'var(--text-muted)', marginTop: '30px', marginBottom: '20px' }}>Payment Method</h4>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.paymentMethod.method}
                    onChange={(e) => handleChange('paymentMethod', 'method', e.target.value)}
                  >
                    <option value="">Select Method</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card Payment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Paid by Cheque?</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paidByCheque"
                        checked={formData.paymentMethod.paidByCheque === true}
                        onChange={() => handleChange('paymentMethod', 'paidByCheque', true)}
                      />
                      Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paidByCheque"
                        checked={formData.paymentMethod.paidByCheque === false}
                        onChange={() => handleChange('paymentMethod', 'paidByCheque', false)}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              {formData.paymentMethod.paidByCheque && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Cheque Number</label>
                    <input
                      type="text"
                      value={formData.paymentMethod.chequeNumber}
                      onChange={(e) => handleChange('paymentMethod', 'chequeNumber', e.target.value)}
                      placeholder="Enter cheque number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cheque Date</label>
                    <input
                      type="date"
                      value={formData.paymentMethod.chequeDate}
                      onChange={(e) => handleChange('paymentMethod', 'chequeDate', e.target.value)}
                    />
                  </div>
                </div>
              )}
              {formData.paymentMethod.paidByCheque && (
                <div className="form-row single">
                  <div className="form-group">
                    <label>Cheque Bank Name</label>
                    <input
                      type="text"
                      value={formData.paymentMethod.chequeBankName}
                      onChange={(e) => handleChange('paymentMethod', 'chequeBankName', e.target.value)}
                      placeholder="Enter cheque bank name"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Dividend History */}
            <div className={`form-section ${currentSection === 4 ? 'active' : ''}`}>
              <h3 className="section-title">Dividend History</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Dividends Received (AED)</label>
                  <input
                    type="number"
                    value={formData.dividendHistory.totalReceived}
                    onChange={(e) => handleChange('dividendHistory', 'totalReceived', e.target.value)}
                    placeholder="Enter total amount received"
                  />
                </div>
                <div className="form-group">
                  <label>Last Dividend Received Date</label>
                  <input
                    type="date"
                    value={formData.dividendHistory.lastReceivedDate}
                    onChange={(e) => handleChange('dividendHistory', 'lastReceivedDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Last Dividend Amount (AED)</label>
                  <input
                    type="number"
                    value={formData.dividendHistory.lastAmount}
                    onChange={(e) => handleChange('dividendHistory', 'lastAmount', e.target.value)}
                    placeholder="Enter last dividend amount"
                  />
                </div>
                <div className="form-group">
                  <label>Any Pending Dividends?</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="hasPending"
                        checked={formData.dividendHistory.hasPending === true}
                        onChange={() => handleChange('dividendHistory', 'hasPending', true)}
                      />
                      Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="hasPending"
                        checked={formData.dividendHistory.hasPending === false}
                        onChange={() => handleChange('dividendHistory', 'hasPending', false)}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              {formData.dividendHistory.hasPending && (
                <div className="form-row single">
                  <div className="form-group">
                    <label>Pending Dividend Amount (AED)</label>
                    <input
                      type="number"
                      value={formData.dividendHistory.pendingAmount}
                      onChange={(e) => handleChange('dividendHistory', 'pendingAmount', e.target.value)}
                      placeholder="Enter pending amount"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Documents */}
            <div className={`form-section ${currentSection === 5 ? 'active' : ''}`}>
              <h3 className="section-title">Supporting Documents</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Agreement Copy</label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange('agreementCopy', e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Proof</label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange('paymentProof', e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dividend Receipts</label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange('dividendReceipts', e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
                <div className="form-group">
                  <label>Other Documents</label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange('otherDocuments', e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Remarks */}
            <div className={`form-section ${currentSection === 6 ? 'active' : ''}`}>
              <h3 className="section-title">Additional Information & Remarks</h3>

              <div className="form-row single">
                <div className="form-group">
                  <label>Any Discrepancies or Issues</label>
                  <textarea
                    value={formData.remarks.discrepancies}
                    onChange={(e) => handleChange('remarks', 'discrepancies', e.target.value)}
                    placeholder="Describe any discrepancies or issues you have encountered"
                    rows={4}
                  />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label>Additional Details</label>
                  <textarea
                    value={formData.remarks.additionalDetails}
                    onChange={(e) => handleChange('remarks', 'additionalDetails', e.target.value)}
                    placeholder="Any additional information you would like to share"
                    rows={4}
                  />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label>Preferred Contact Person (if applicable)</label>
                  <input
                    type="text"
                    value={formData.remarks.contactPerson}
                    onChange={(e) => handleChange('remarks', 'contactPerson', e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </div>
              </div>
            </div>

            {/* Section 7: Declaration */}
            <div className={`form-section ${currentSection === 7 ? 'active' : ''}`}>
              <h3 className="section-title">Declaration</h3>

              <div className="form-row single">
                <div className={`form-group ${errors['declaration.confirmed'] ? 'error' : ''}`}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.declaration.confirmed}
                      onChange={(e) => handleChange('declaration', 'confirmed', e.target.checked)}
                      style={{ marginTop: '5px' }}
                    />
                    <span>
                      I hereby declare that all the information provided above is true and accurate to the best of my knowledge.
                      I understand that providing false information may result in rejection of my submission and potential legal consequences.
                    </span>
                  </label>
                  {errors['declaration.confirmed'] && <span className="form-error">{errors['declaration.confirmed']}</span>}
                </div>
              </div>

              <div className="form-row single">
                <div className={`form-group ${errors['declaration.signature'] ? 'error' : ''}`}>
                  <label>Digital Signature (Type your full name) *</label>
                  <input
                    type="text"
                    value={formData.declaration.signature}
                    onChange={(e) => handleChange('declaration', 'signature', e.target.value)}
                    placeholder="Type your full name as digital signature"
                    style={{ fontStyle: 'italic' }}
                  />
                  {errors['declaration.signature'] && <span className="form-error">{errors['declaration.signature']}</span>}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="form-navigation">
              <button
                type="button"
                className="nav-btn prev"
                onClick={prevSection}
                style={{ visibility: currentSection === 1 ? 'hidden' : 'visible' }}
              >
                <FiArrowLeft /> Previous
              </button>

              {currentSection < totalSections ? (
                <button type="button" className="nav-btn next" onClick={nextSection}>
                  Next <FiArrowRight />
                </button>
              ) : (
                <button type="submit" className="nav-btn submit" disabled={loading}>
                  {loading ? <span className="spinner"></span> : <><FiCheck /> Submit Form</>}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Auto-save Indicator */}
        {saveStatus && (
          <div className={`auto-save-indicator ${saveStatus}`}>
            {saveStatus === 'saving' && <><span className="spinner"></span> Saving...</>}
            {saveStatus === 'saved' && <><FiCheck /> Draft saved</>}
            {saveStatus === 'error' && <>Failed to save</>}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default InvestmentForm;

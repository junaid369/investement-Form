import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import logo from '../assets/logo.avif';

const Register = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [step, setStep] = useState('details'); // 'details' or 'otp'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneCode: '+971',
    phone: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'phone' ? value.replace(/\D/g, '') : value,
    }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fullPhone = formData.phoneCode + formData.phone;
      const response = await authAPI.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: fullPhone,
      });

      if (response.data.success) {
        setStep('otp');
        setTimer(120); // 2 minutes
      } else {
        setError(response.data.message || 'Failed to register');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete OTP');
      setLoading(false);
      return;
    }

    try {
      const fullPhone = formData.phoneCode + formData.phone;
      const response = await authAPI.verifyOtp(fullPhone, otpValue);

      if (response.data.success) {
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError('');
    setLoading(true);

    try {
      const fullPhone = formData.phoneCode + formData.phone;
      const response = await authAPI.sendOtp(fullPhone);

      if (response.data.success) {
        setTimer(120);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(response.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Matajar Group" />
          <h1>Matajar Group</h1>
          <p>Investor Portal</p>
        </div>

        {step === 'details' ? (
          <>
            <div className="auth-title">
              <h2>Create Account</h2>
              <p>Register to manage your investments</p>
            </div>

            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="phone-input-group">
                  <select
                    name="phoneCode"
                    value={formData.phoneCode}
                    onChange={handleChange}
                    className="phone-code"
                  >
                    <option value="+971">+971 (UAE)</option>
                    <option value="+91">+91 (India)</option>
                    <option value="+966">+966 (KSA)</option>
                    <option value="+973">+973 (Bahrain)</option>
                    <option value="+968">+968 (Oman)</option>
                    <option value="+974">+974 (Qatar)</option>
                    <option value="+965">+965 (Kuwait)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+1">+1 (USA)</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="phone-number"
                    required
                  />
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Send OTP'}
              </button>
            </form>

            <div className="auth-links">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </>
        ) : (
          <>
            <div className="auth-title">
              <h2>Verify OTP</h2>
              <p>Enter the 6-digit code sent to {formData.phoneCode}{formData.phone}</p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                  />
                ))}
              </div>

              {error && <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>}

              <div className="otp-timer">
                {timer > 0 ? (
                  <>Resend OTP in <span>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span></>
                ) : (
                  <button type="button" className="btn-link" onClick={handleResendOtp} disabled={loading}>
                    Resend OTP
                  </button>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Verify & Register'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '10px' }}
                onClick={() => {
                  setStep('details');
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                }}
              >
                Back to Details
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;

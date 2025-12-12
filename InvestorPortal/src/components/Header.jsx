import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome } from 'react-icons/fi';
import logo from '../assets/logo.avif';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isFormPage = location.pathname.startsWith('/form');

  return (
    <header className="header">
      <div className="header-left" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="Matajar Group" className="header-logo" />
        <div className="header-title">
          <h1>Matajar Group</h1>
          <span>Investor Portal</span>
        </div>
      </div>
      <div className="header-right">
        {isFormPage && (
          <button className="home-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
            <FiHome /> <span className="home-btn-text">Dashboard</span>
          </button>
        )}
        <span className="user-info">
          {user?.fullName || user?.phone}
        </span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;

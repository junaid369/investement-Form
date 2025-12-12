import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.avif';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <img src={logo} alt="Matajar Group" className="header-logo" />
        <div className="header-title">
          <h1>Matajar Group</h1>
          <span>Investor Portal</span>
        </div>
      </div>
      <div className="header-right">
        <span className="user-info">
          Welcome, {user?.fullName || user?.phone}
        </span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import './App.css';

function App() {
  const [registerMessage, setRegisterMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', role: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [userRole, setUserRole] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');

  // Admin Role Assignment State
  const [assignRoleEmail, setAssignRoleEmail] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [assignMessage, setAssignMessage] = useState('');

  const handleRegisterChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setRegisterMessage('Passwords do not match!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          role: formData.role || 'user',
        }),
      });

      const result = await response.json();
      setRegisterMessage(result.message);
    } catch (error) {
      setRegisterMessage('An error occurred. Please try again.');
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleGenerateOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email }),
      });

      const result = await response.json();
      if (response.ok) {
        setOtpGenerated(true);
        setLoginMessage(result.message);
      } else {
        setLoginMessage(result.message || 'Error generating OTP.');
      }
    } catch (error) {
      setLoginMessage('An error occurred. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          otp: enteredOtp,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setUserRole(result.role); // Set user role from backend
        setIsLoggedIn(true); // Mark the user as logged in
        setLoginMessage('');
      } else {
        setLoginMessage(result.message || 'Login failed.');
      }
    } catch (error) {
      setLoginMessage('An error occurred. Please try again.');
    }
  };

  const handleAccess = (level) => {
    if (level === 'user') {
      setAccessMessage('You have entered the User Access Level.');
    } else if (level === 'admin') {
      if (userRole === 'admin' || userRole === 'developer') {
        setAccessMessage(<AdminDashboard />);
      } else {
        setAccessMessage('Access denied. You must be an admin or developer to enter.');
      }
    } else if (level === 'developer') {
      if (userRole === 'developer') {
        setAccessMessage('You have entered the Developer Access Level.');
      } else {
        setAccessMessage('Access denied. You must be a developer to enter.');
      }
    } else {
      setAccessMessage('Invalid access level.');
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'email': loginData.email, // Add the admin email here for verification
        },
        body: JSON.stringify({ email: assignRoleEmail, role: assignRole }),
      });

      const result = await response.json();
      setAssignMessage(result.message);
    } catch (error) {
      setAssignMessage('An error occurred. Please try again.');
    }
  };

  const AdminDashboard = () => (
    <div className="admin-dashboard">
      <h2>Admin Access</h2>
      <form onSubmit={handleAssignRole}>
        <input
          type="email"
          placeholder="User Email"
          value={assignRoleEmail}
          onChange={(e) => setAssignRoleEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Role (e.g., user, admin, developer)"
          value={assignRole}
          onChange={(e) => setAssignRole(e.target.value)}
          required
        />
        <button type="submit">Assign Role</button>
      </form>
      {assignMessage && <p>{assignMessage}</p>}
    </div>
  );

  if (isLoggedIn) {
    return (
      <div className="welcome-container">
        <div className="access-buttons">
          <button onClick={() => handleAccess('user')}>User Access</button>
          <button onClick={() => handleAccess('admin')}>Admin Access</button>
          <button onClick={() => handleAccess('developer')}>Developer Access</button>
        </div>
        <h1>Welcome, {userRole}!</h1>
        {typeof accessMessage === 'string' ? <p className="access-message">{accessMessage}</p> : accessMessage}
        <button className="logout-button" onClick={() => { setIsLoggedIn(false); setAccessMessage(''); }}>Logout</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>User Management System</h1>
      <div className="form-container">
        {/* Registration Form */}
        <div className="form-box">
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <input type="email" name="email" placeholder="Email" onChange={handleRegisterChange} required />
            <input type="password" name="password" placeholder="Password" onChange={handleRegisterChange} required />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleRegisterChange} required />
            <input type="text" name="role" placeholder="Role (Optional, e.g., admin)" onChange={handleRegisterChange} />
            <button type="submit">Register</button>
            {registerMessage && <p className="message">{registerMessage}</p>}
          </form>
        </div>

        {/* Login Form */}
        <div className="form-box">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input type="email" name="email" placeholder="Email" onChange={handleLoginChange} required />
            <input type="password" name="password" placeholder="Password" onChange={handleLoginChange} required />
            <button type="button" onClick={handleGenerateOtp}>Generate OTP</button>
            {otpGenerated && (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  required
                />
              </>
            )}
            <button type="submit">Login</button>
            {loginMessage && <p className="message">{loginMessage}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;

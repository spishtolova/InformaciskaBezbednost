import React, { useState } from 'react';
import './App.css';

function App() {
  const [registerMessage, setRegisterMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

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
        }),
      });

      const result = await response.json();
      setRegisterMessage(result.message); // Display backend message
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
        setLoginMessage(result.message); // Use backend-provided message
      } else {
        setLoginMessage(result.message || "Error generating OTP.");
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
          otp: enteredOtp
        }),
      });

      const result = await response.json();
      setLoginMessage(result.message);
    } catch (error) {
      setLoginMessage('An error occurred. Please try again.');
    }
  };

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

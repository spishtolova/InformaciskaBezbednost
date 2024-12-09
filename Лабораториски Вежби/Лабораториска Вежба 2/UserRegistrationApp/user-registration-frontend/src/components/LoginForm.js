import React, { useState } from "react";
import "./LoginFormStyle.css";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
  });
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

 const generateOTP = async () => {
  try {
    const response = await fetch("http://127.0.0.1:5000/generate-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: formData.email }),
    });

    const data = await response.json();
    if (response.ok) {
      setOtpGenerated(true);
      setOtpMessage(data.message);
    } else {
      setOtpMessage(data.message || "Error generating OTP.");
    }
  } catch (error) {
    setOtpMessage("An error occurred. Please try again.");
  }
};


  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Login successful!");
      } else {
        setMessage(data.message || "Login failed!");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        {otpGenerated && (
          <div className="form-group">
            <label>OTP:</label>
            <input
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              required
            />
          </div>
        )}
        {!otpGenerated ? (
          <button type="button" className="btn" onClick={generateOTP}>
            Generate OTP
          </button>
        ) : (
          <button type="submit" className="btn">
            Login
          </button>
        )}
      </form>
      {otpMessage && <p className="info-message">{otpMessage}</p>}
      {message && <p className="info-message">{message}</p>}
    </div>
  );
};

export default LoginForm;

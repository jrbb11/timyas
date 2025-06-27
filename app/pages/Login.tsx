import React, { useState } from 'react';
import loginIllustration from '../assets/login-illustration.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(90deg, #19d3c5 50%, #f8f9fa 50%)' }}>
      {/* Left: Illustration */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={loginIllustration} alt="Login Illustration" style={{ maxWidth: 400, width: '100%' }} />
      </div>
      {/* Right: Login Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', padding: 40, minWidth: 350, maxWidth: 400, width: '100%' }}>
          <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24, textAlign: 'center', letterSpacing: 1 }}>LOGIN</h2>
          <div style={{ marginBottom: 18 }}>
            <input
              type="text"
              placeholder="Email or user name"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 16 }}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 16 }}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Remember me
            </label>
            <a href="#" style={{ color: '#888', fontSize: 14, textDecoration: 'none' }}>Forgot Password</a>
          </div>
          <button
            type="submit"
            style={{ width: '100%', background: '#ff4081', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 18, boxShadow: '0 2px 8px rgba(255,64,129,0.08)', marginBottom: 12, cursor: 'pointer' }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import CustomerApp from './components/CustomerApp';
import AdminDashboard from './components/AdminDashboard';
import './index.css'; // Nhập stylesheet Cyberpunk mới (đã ghi đè vào index.css)

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <div className="cyber-root-wrapper">
      {/* App Header & Navigation */}
      <header className="app-header glass-panel">
        <div className="logo">
          ⚡ CINE<span>.MATRIX</span>
        </div>
        
        {/* Toggle Mode Control */}
        <div className="nav-toggle-container">
          <button 
            className={`nav-toggle-btn ${!isAdminMode ? 'active' : ''}`}
            onClick={() => setIsAdminMode(false)}
          >
            [🎟️ BUY TICKET]
          </button>
          <button 
            className={`nav-toggle-btn ${isAdminMode ? 'active' : ''}`}
            onClick={() => setIsAdminMode(true)}
          >
            [⚙️ ADMIN.SYS]
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="container">
        {!isAdminMode ? (
          <CustomerApp />
        ) : (
          <AdminDashboard />
        )}
      </main>
      
      {/* Decorative footer */}
      <footer style={{ textAlign: 'center', color: 'var(--accent-cyan)', fontSize: '0.8rem', padding: '2rem 0', textShadow: '0 0 5px var(--accent-cyan-glow)' }}>
        // SYSTEM STATUS: SECURE // CORE TEMPERATURE: 34°C // MATRIX TERMINAL v2.0
      </footer>
    </div>
  );
}

export default App;

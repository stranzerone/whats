import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [messageStatus, setMessageStatus] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [file, setFile] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
 const BACKEND = 'https://whatsappbulk-cta5.onrender.com:5000'
  // Check if backend is ready (only once)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(BACKEND +'/api/status');
        setServerRunning(true); // Server is running
      } catch (err) {
        setError('❌ Server not available.');
      }
    };
    checkStatus();
  }, []);

  // Fetch message status every 3 seconds if the server is running
  useEffect(() => {
    if (serverRunning) {
      const interval = setInterval(() => {
        axios.get(BACKEND + '/api/message-status')
          .then((res) => {
            setMessageStatus(res.data);
            setStatusData(res.data); // Update table when backend sends status
                      })
          .catch((err) => {
            console.error('Error fetching status', err.message);
          });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [serverRunning]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(BACKEND +'/api/login', { password });
      if (response.status === 200) {
        setIsLoggedIn(true);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Error logging in');
    }
  };

  const resetLogs = async () => {
    try {
      const response = await axios.post(BACKEND + '/api/reset');
      if (response.status === 200) {
        setMessageStatus([]); // Clear the table and chart
        setStatusData([]);
        setFile(null);
        console.log('Logs reset successfully');
      }
    } catch (err) {
      console.error('❌ Error resetting logs:', err.message);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("📂 Please select a file!");

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      await axios.post(BACKEND + '/api/send-messages', formData);
      setIsUploading(false); // Set uploading to false once the request is sent
    } catch (err) {
      console.error(err);
      setError('❌ Upload failed.');
      setIsUploading(false);
    }
  };

  const countByStatus = (status) =>
    messageStatus.filter(item => item.status === status).length;

  const data = {
    labels: ['Sent', 'Failed', 'Remaining'],
    datasets: [
      {
        data: [
          countByStatus('sent'),
          countByStatus('failed'),
          countByStatus('pending'),
        ],
        backgroundColor: ['#1996D3', '#FF5733', '#FFC300'],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#121212', color: '#fff' }}>
      {!isLoggedIn ? (
        <div style={{ textAlign: 'center', padding: '50px',height:'100vh' }}>
          <h2>Enter Password to Continue</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            style={{
              padding: '10px',
              width: '200px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #074B7C',
              backgroundColor: '#1e1e1e',
              color: 'white',
            }}
          />
          <br />
          <button
            onClick={handleLogin}
            style={{
              padding: '10px 20px',
              backgroundColor: '#074B7C',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      ) : (
        <>
          <h2>📤 WhatsApp Bulk Sender</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button
              onClick={resetLogs}
              style={{
                padding: '10px 20px',
                backgroundColor: '#074B7C',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Reset Logs
            </button>

            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ padding: '10px', borderRadius: '5px' }}
            />

            <button
              onClick={handleUpload}
              disabled={isUploading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#074B7C',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginLeft: '10px',
              }}
            >
              {isUploading ? 'Sending...' : 'Upload & Send'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {/* Left side: Pie chart and status */}
            <div style={{ width: '48%' }}>
              <h3>📊 Status Dashboard</h3>
              <div style={{ height: '50vh', marginBottom: '20px' }}>
                <Pie data={data} />
              </div>
              <p>Total: {messageStatus.length}</p>
              <p>✅ Sent: {countByStatus('sent')}</p>
              <p>❌ Failed: {countByStatus('failed')}</p>
              <p>⏳ Remaining: {countByStatus('pending')}</p>
            </div>

            {/* Right side: Table */}
            <div style={{ width: '48%' }}>
              <h3>📋 Message Details</h3>
              <input
  type="text"
  placeholder="Search Phone Number"
  style={{
    padding: '10px',
    marginBottom: '10px',
    width: '100%',
    borderRadius: '5px',
  }}
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px', backgroundColor: '#074B7C', color: 'white' }}>Phone</th>
                    <th style={{ padding: '10px', backgroundColor: '#074B7C', color: 'white' }}>Message</th>
                    <th style={{ padding: '10px', backgroundColor: '#074B7C', color: 'white' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statusData.length > 0 ? (
                    (statusData?.filter(item =>
                      item?.phone.includes(searchQuery)
                    )).map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>{item.phone}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>{item.message}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>{item.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

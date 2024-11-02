import React, { useState, useEffect } from 'react';
import axios from 'axios';

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  return (
    <div>
      <h2>Translation History</h2>
      <ul>
        {history.map((item) => (
          <li key={item._id}>
            <p>Translation: {item.translation}</p>
            <p>Confidence: {item.confidence}</p>
            <p>Timestamp: {new Date(item.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default History;
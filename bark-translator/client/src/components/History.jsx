// components/History.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faTrash, faPlay, faPause } from '@fortawesome/free-solid-svg-icons';

const History = () => {
  const [translations, setTranslations] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTranslationHistory();
  }, []);

  const fetchTranslationHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/history');
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      setError('Failed to load translation history');
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTranslation = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/history/${id}`, {
        method: 'DELETE',
      });
      setTranslations(translations.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error deleting translation:', error);
    }
  };

  const playAudio = (audioUrl, id) => {
    if (playing === id) {
      // Stop playing
      setPlaying(null);
    } else {
      // Start playing new audio
      const audio = new Audio(audioUrl);
      audio.play();
      setPlaying(id);
      audio.onended = () => setPlaying(null);
    }
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Loading translation history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <p>{error}</p>
        <button onClick={fetchTranslationHistory}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Translation History</h2>
        <p>Your recent bark translations</p>
      </div>

      {translations.length === 0 ? (
        <div className="no-history">
          <FontAwesomeIcon icon={faPaw} size="3x" />
          <p>No translations yet! Start by recording or uploading a bark.</p>
        </div>
      ) : (
        <div className="history-list">
          {translations.map((item) => (
            <div key={item._id} className="history-item">
              <div className="history-item-content">
                <div className="history-item-icon">
                  <FontAwesomeIcon icon={faPaw} />
                </div>
                
                <div className="history-item-details">
                  <div className="translation-text">
                    {item.translation}
                  </div>
                  
                  <div className="translation-meta">
                    <span className="timestamp">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span className="confidence">
                      Confidence: {item.confidence}%
                    </span>
                  </div>

                  <div className="confidence-meter">
                    <div 
                      className="confidence-bar"
                      style={{ width: `${item.confidence}%` }}
                    ></div>
                  </div>
                </div>

                <div className="history-item-actions">
                  <button 
                    className="action-button play"
                    onClick={() => playAudio(item.audioUrl, item._id)}
                  >
                    <FontAwesomeIcon icon={playing === item._id ? faPause : faPlay} />
                  </button>
                  
                  <button 
                    className="action-button delete"
                    onClick={() => deleteTranslation(item._id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
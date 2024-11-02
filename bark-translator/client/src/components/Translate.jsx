// components/Translate.jsx
import React, { useState } from 'react';
import AudioRecorder from './AudioRecorder';
import AudioUploader from './AudioUploader';
import AudioVisualizer from './AudioVisualizer';

function Translate() {
  const [activeTab, setActiveTab] = useState('record');
  const [translation, setTranslation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioData, setAudioData] = useState(null);

  const processAudio = async (audio, type) => {
    try {
      const formData = new FormData();
      formData.append('audio', audio);
      formData.append('type', type);

      // For testing without backend
      // Return mock data after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        text: "Woof! I'm hungry and want to play!",
        confidence: 85,
        emotion: 'happy'
      };

      // When backend is ready, use this code instead:
      /*
      const response = await fetch('http://localhost:3000/api/translate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      return {
        text: data.translation,
        confidence: data.confidence,
        emotion: getEmotionFromText(data.translation)
      };
      */
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  };

  const handleTranslation = async (audio, type) => {
    setIsProcessing(true);
    try {
      const result = await processAudio(audio, type);
      setTranslation(result);
      setAudioData(audio);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="translate-page">
      <div className="translate-container">
        <div className="translate-header">
          <h2>Bark Translator</h2>
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'record' ? 'active' : ''}`}
              onClick={() => setActiveTab('record')}
            >
              Record Bark
            </button>
            <button 
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Audio
            </button>
          </div>
        </div>

        <div className="translate-content">
          {activeTab === 'record' ? (
            <AudioRecorder onTranslate={(audio) => handleTranslation(audio, 'record')} />
          ) : (
            <AudioUploader onUpload={(audio) => handleTranslation(audio, 'upload')} />
          )}

          {isProcessing && (
            <div className="processing-overlay">
              <div className="spinner"></div>
              <p>Analyzing bark pattern...</p>
            </div>
          )}

          {translation && !isProcessing && (
            <div className="translation-result">
              <h3>Translation Result</h3>
              <div className="result-card">
                <div className="translation-text">
                  <p>{translation.text}</p>
                  <div className="confidence-meter">
                    <span>Confidence: {translation.confidence}%</span>
                    <div className="meter">
                      <div 
                        className="meter-fill" 
                        style={{width: `${translation.confidence}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Translate;
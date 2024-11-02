import React, { useState, useRef, useEffect } from 'react';

const Translate = () => {
  const [translation, setTranslation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleTranslate = async (audioBlob) => {
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await fetch('http://localhost:3000/api/translate', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type with FormData, let the browser handle it
        }
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslation(data.translation);
      setSentiment(data.sentiment);
      playTranslation(data.translation);
    } catch (error) {
      console.error('Translation error:', error);
      setError('Failed to translate audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        handleTranslate(file);
      } else {
        setError('Please upload an audio file');
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        handleTranslate(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioRef.current.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playTranslation = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="container">
      <div className="translate-options">
        <div className="record-section">
          <h2>Record Bark</h2>
          <div className="record-button-container">
            <button 
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              disabled={isLoading}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
        </div>

        <div className="upload-section">
          <h2>Upload Audio</h2>
          <div className="file-upload-container">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="file-upload-input"
              disabled={isLoading || isRecording}
            />
            <div className="file-upload-text">
              <i className="fas fa-upload"></i>
              <p>Click to upload audio file or drag and drop</p>
              <span className="file-upload-subtext">Supports WAV, MP3, M4A</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Translating...</p>
        </div>
      )}

      {translation && !isLoading && (
        <div className="translation-result card">
          <h3>Translation</h3>
          <p className="translation-text">{translation}</p>
          {sentiment && (
            <div className="sentiment-info">
              <p>Mood: {sentiment.mood}</p>
              <p>Intensity: {sentiment.intensity}</p>
            </div>
          )}
          <button 
            onClick={() => playTranslation(translation)} 
            className="button"
          >
            <i className="fas fa-play"></i> Play Translation
          </button>
        </div>
      )}
    </div>
  );
};

export default Translate;
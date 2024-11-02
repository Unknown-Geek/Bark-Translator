// components/AudioRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';

const AudioRecorder = ({ onTranslate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const mediaRecorder = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const audioData = useRef([]);

  useEffect(() => {
    // Initialize Audio Context
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    analyser.current = audioContext.current.createAnalyser();
    analyser.current.fftSize = 2048;
  }, []);

  const analyzeBark = (frequencyData) => {
    // Get average frequency
    const average = frequencyData.reduce((a, b) => a + b) / frequencyData.length;
    
    // Define frequency thresholds for different interpretations
    if (average > 2000) {
      return "Alert! Your dog seems scared or detecting danger!";
    } else if (average > 1500) {
      return "Your dog is excited or trying to get attention!";
    } else if (average > 1000) {
      return "Your dog is probably hungry or wants food!";
    } else if (average > 500) {
      return "Your dog is relaxed and making casual communication.";
    } else {
      return "Your dog is calm or tired.";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      // Connect to audio analyzer
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioData.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioData.current, { type: 'audio/wav' });
        onTranslate(audioBlob);
        audioData.current = [];
      };

      // Start frequency analysis
      const analyzeFrequency = () => {
        if (isRecording) {
          analyser.current.getByteFrequencyData(dataArray);
          const interpretation = analyzeBark(dataArray);
          setInterpretation(interpretation);
          requestAnimationFrame(analyzeFrequency);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      analyzeFrequency();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="recording-container">
      <button 
        className={`record-button ${isRecording ? 'recording' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      
      {interpretation && (
        <div className="interpretation-container">
          <h3>Real-time Interpretation:</h3>
          <p>{interpretation}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
import React, { useState } from 'react';
import axios from 'axios';

function Translate() {
  const [file, setFile] = useState(null);
  const [translation, setTranslation] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post('http://localhost:3000/api/translate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTranslation(response.data.translation);
    } catch (error) {
      console.error('Error translating bark:', error);
    }
  };

  return (
    <div>
      <h2>Translate Bark</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button type="submit">Translate</button>
      </form>
      {translation && (
        <div>
          <h3>Translation:</h3>
          <p>{translation}</p>
        </div>
      )}
    </div>
  );
}

export default Translate;
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import BackgroundParticles from './components/BackgroundParticles/BackgroundParticles';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BackgroundParticles id="particles" />
    <App />
  </React.StrictMode>
);
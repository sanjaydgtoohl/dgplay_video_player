import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './styles/tailwind.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element with id "root" not found');
}

const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/device/:deviceId" element={<App />} />
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
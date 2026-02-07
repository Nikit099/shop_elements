import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Navigate from './navigate';
import { SocketProvider } from './context';
import { BrowserRouter as Router } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
    <SocketProvider>
      <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="de">
        <Navigate />
      </LocalizationProvider>
  </SocketProvider>
  </Router>
);

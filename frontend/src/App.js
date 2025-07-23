import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';
import Payment from './Payment';

function App() {
  return (
    <div className="App">
      <Payment />
    </div>
  );
}

export default App;

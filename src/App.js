import React from 'react';
import './App.css';
import UserTable from './components/UserTable';
import DynamicContent from './components/DynamicContent';

function App() {
  return (
    <div className="App">
      <DynamicContent componentKey="welcome" />
      <DynamicContent componentKey="counter" />
      <DynamicContent componentKey="userTable" />
    </div>
  );
}

export default App;

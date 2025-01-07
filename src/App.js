import React, { useState } from 'react';
import './App.css';
import UserTable from './components/UserTable';
import FileReader from './components/FileReader';
import Welcome from './components/welcomeComponent';
import Compteur from './components/CompteurComponent';

function App() {
  const [generatedComponents, setGeneratedComponents] = useState([]);

  const handleComponentGenerated = (fileName, componentCode) => {
    // Create the component file
    const componentPath = `src/components/${fileName}`;
    
    // Add to list of generated components
    setGeneratedComponents(prev => [...prev, { name: fileName, code: componentCode }]);

    // Create the actual file
    const blob = new Blob([componentCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <Welcome />
      <FileReader onComponentGenerated={handleComponentGenerated} />
      {generatedComponents.length > 0 && (
        <div className="generated-components-list">
          <h3>Generated Components:</h3>
          <ul>
            {generatedComponents.map((component, index) => (
              <li key={index}>{component.name}</li>
            ))}
          </ul>
        </div>
      )}
      <Compteur />
      <UserTable />
    </div>
  );
}

export default App;

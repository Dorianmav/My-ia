import React, { useState } from 'react';
import './App.css';
import UserTable from './components/UserTable';
import DynamicContent from './components/DynamicContent';
import MarkdownRenderer from './components/MarkdownRenderer';

const defaultMarkdown = `# Examples

## 1. Flowchart

\`\`\`mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
    D-->A;
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant Arthur
    participant Sylvie
    Arthur->>Dorian: Hello Dorian, how are you?
    loop HealthCheck
        Dorian->>Dorian: Fight against hypochondria
    end
    Note right of Dorian: Rational thoughts <br/>prevail!
    Dorian-->>Arthur: Great!
    Dorian->>Sylvie: How about you?
    Sylvie-->>Dorian: Jolly good!
\`\`\`

## 2. Code Example

\`\`\`javascript
// This is a simple JavaScript function
function greet(name) {
    console.log('Hello, ' + name + '! 👋');
}
\`\`\`

## 3. Emojis
- I love coding! :heart: :computer:
- This is awesome! :star: :rocket:
- Great job! :+1: :tada:
`;

function App() {
  const [inputText, setInputText] = useState('');
  const [displayText, setDisplayText] = useState(defaultMarkdown);

  const handleShow = () => {
    setDisplayText(inputText || defaultMarkdown);
  };

  return (
    <div className="App">
      <DynamicContent componentKey="welcome" />
      <DynamicContent componentKey="counter" />
      <DynamicContent componentKey="userTable" />
      <div style={{ 
        padding: '20px 40px', 
        maxWidth: '1000px', 
        margin: '20px',
        backgroundColor: '#ffffff',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        borderRadius: '8px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
            placeholder="Enter your markdown here..."
          />
          <button
            onClick={handleShow}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Show
          </button>
        </div>
        <MarkdownRenderer content={displayText} />
      </div>
    </div>
  );
}

export default App;

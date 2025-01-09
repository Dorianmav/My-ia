import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import UserTable from './components/UserTable';
import DynamicContent from './components/DynamicContent';
import MarkdownRenderer from './components/MarkdownRenderer';
import Groq from 'groq-sdk';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    htmlLabels: true,
    curve: 'basis'
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35
  }
});

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY, dangerouslyAllowBrowser: true
});

const defaultMarkdown = `# Examples

## 1. Flowchart



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
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetText, setTargetText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const animationSpeed = 10; // milliseconds per character
  const animationRef = useRef(null);
  const contentRef = useRef(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    // Initial display
    handleShow();
  }, []);

  const askGroq = async (prompt) => {
    setIsLoading(true);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        stream: true,
        stop: null
      });

      let accumulatedText = '';
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        accumulatedText += content;
        setInputText(accumulatedText);
      }
    } catch (error) {
      console.error('Error:', error);
      setInputText('Error occurred while fetching response');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAnimating) {
      let currentIndex = displayText.length;
      
      if (currentIndex < targetText.length) {
        animationRef.current = setTimeout(() => {
          setDisplayText(targetText.slice(0, currentIndex + 1));
          
          // Scroll to the bottom of the new content
          if (contentRef.current) {
            const container = contentRef.current;
            const scrollHeight = container.scrollHeight;
            
            // Only scroll if content height has increased
            if (scrollHeight > lastScrollRef.current) {
              container.scrollTop = scrollHeight;
              lastScrollRef.current = scrollHeight;
            }
          }
        }, animationSpeed);
      } else {
        setIsAnimating(false);
        // Reinitialize mermaid after animation is complete
        setTimeout(() => {
          mermaid.contentLoaded();
        }, 100);
      }
    }
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [displayText, targetText, isAnimating]);

  const handleShow = () => {
    const newText = inputText || defaultMarkdown;
    setTargetText(newText);
    setDisplayText('');
    setIsAnimating(true);
    lastScrollRef.current = 0; // Reset scroll position tracking
  };

  const handleAskGroq = async () => {
    await askGroq("Generate a creative markdown example with code, emojis, and a mermaid diagram");
  };

  return (
    <div className="App">
      <DynamicContent componentKey="welcome" />
      {/* <DynamicContent componentKey="counter" /> */}
      {/* <DynamicContent componentKey="userTable" /> */}
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleShow}
              disabled={isAnimating}
              style={{
                padding: '8px 16px',
                backgroundColor: isAnimating ? '#cccccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
            >
              {isAnimating ? 'Animating...' : 'Show'}
            </button>
            <button
              onClick={handleAskGroq}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: isLoading ? '#cccccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
            >
              {isLoading ? 'Loading...' : 'Ask Groq'}
            </button>
          </div>
        </div>
        <div 
          ref={contentRef}
          style={{
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '20px',
            border: '1px solid #eee',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
            scrollBehavior: 'smooth'
          }}
        >
          <MarkdownRenderer content={displayText} />
        </div>
      </div>
    </div>
  );
}

export default App;

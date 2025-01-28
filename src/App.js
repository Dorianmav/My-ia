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
  logLevel: 'error',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    useMaxWidth: true
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
    messageMargin: 35,
    mirrorActors: false,
    bottomMarginAdj: 1
  },
  gantt: {
    titleTopMargin: 25,
    barHeight: 20,
    barGap: 4,
    topPadding: 50,
    leftPadding: 75,
    gridLineStartPadding: 35,
    fontSize: 11,
    numberSectionStyles: 4
  }
});

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef(null);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      localStorage.removeItem('chatHistory');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText(''); // Clear input
    
    // Save to localStorage
    localStorage.setItem('chatHistory', JSON.stringify(updatedMessages));
    
    // Send to Groq
    setIsLoading(true);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        stream: true,
        stop: null
      });

      let assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };

      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        assistantMessage.content += content;
        setMessages([...updatedMessages, { ...assistantMessage }]);
      }

      // Save final version to localStorage
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      localStorage.setItem('chatHistory', JSON.stringify(finalMessages));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'system',
        content: 'Error occurred while fetching response',
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      localStorage.setItem('chatHistory', JSON.stringify(finalMessages));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="App">
      {/* <DynamicContent componentKey="welcome" /> */}
      <div style={{ 
        padding: '20px 40px', 
        maxWidth: '1000px', 
        margin: '20px auto',
        backgroundColor: '#ffffff',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        height: '80vh'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>Chat with Millia</h2>
          <button
            onClick={clearHistory}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear History
          </button>
        </div>
        
        <div 
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            border: '1px solid #eee',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
            marginBottom: '20px',
            scrollBehavior: 'smooth'
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                marginBottom: '20px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: message.role === 'user' ? '#e3f2fd' : '#fff',
                border: '1px solid #e0e0e0',
                maxWidth: '80%',
                marginLeft: message.role === 'user' ? 'auto' : '0'
              }}
            >
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '5px',
                color: message.role === 'user' ? '#1976d2' : '#2e7d32'
              }}>
                {message.role === 'user' ? 'You' : 'Millia'}
              </div>
              <MarkdownRenderer content={message.content} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              resize: 'vertical',
              minHeight: '50px',
              maxHeight: '150px'
            }}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoading || !inputText.trim() ? '#cccccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s ease',
              alignSelf: 'flex-end'
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

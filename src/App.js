import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import UserTable from './components/UserTable';
import DynamicContent from './components/DynamicContent';
import MarkdownRenderer from './components/MarkdownRenderer';
import ConversationHistory from './components/ConversationHistory';
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
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const contentRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('conversations');
    return saved ? JSON.parse(saved) : [];
  });

  // Load current conversation from localStorage on initial load
  useEffect(() => {
    const currentConv = localStorage.getItem('currentConversation');
    if (currentConv) {
      const parsed = JSON.parse(currentConv);
      setMessages(parsed.messages);
      setCurrentConversationId(parsed.id);
    }
  }, []);

  // Save current conversation whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const conversationData = {
        id: currentConversationId || messages[0].timestamp,
        messages,
        timestamp: messages[0].timestamp,
        summary: messages[0].content.substring(0, 100) + '...',
        keywords: extractKeywords(messages)
      };

      // Update currentConversationId if it's a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(conversationData.id);
      }

      // Save current conversation state
      localStorage.setItem('currentConversation', JSON.stringify(conversationData));

      // Update the conversation in the conversations list if it exists
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationData.id ? conversationData : conv
      );

      // If this is a new conversation that's not in the list yet, add it
      if (!conversations.some(conv => conv.id === conversationData.id)) {
        updatedConversations.unshift(conversationData);
      }

      setConversations(updatedConversations);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
  }, [messages]);

  const extractKeywords = (messages) => {
    // Simple keyword extraction from the first user message
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const words = userMessage.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 3);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    localStorage.removeItem('currentConversation');
    setIsHistoryVisible(false);
  };

  const handleSelectConversation = (conversationId) => {
    const selectedConv = conversations.find(conv => conv.id === conversationId);
    if (selectedConv) {
      setMessages(selectedConv.messages);
      setCurrentConversationId(selectedConv.id);
      localStorage.setItem('currentConversation', JSON.stringify(selectedConv));
      setIsHistoryVisible(false);
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
      localStorage.setItem('currentConversation', JSON.stringify({
        id: finalMessages[0].timestamp,
        messages: finalMessages,
        timestamp: finalMessages[0].timestamp,
        summary: finalMessages[0].content.substring(0, 100) + '...',
        keywords: extractKeywords(finalMessages)
      }));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'system',
        content: 'Error occurred while fetching response',
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      localStorage.setItem('currentConversation', JSON.stringify({
        id: finalMessages[0].timestamp,
        messages: finalMessages,
        timestamp: finalMessages[0].timestamp,
        summary: finalMessages[0].content.substring(0, 100) + '...',
        keywords: extractKeywords(finalMessages)
      }));
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

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      setCurrentConversationId(null);
      setConversations([]);
      localStorage.removeItem('currentConversation');
      localStorage.removeItem('conversations');
    }
  };

  return (
    <div className="App">
      <button 
        className="toggle-history" 
        onClick={() => setIsHistoryVisible(!isHistoryVisible)}
      >
        {isHistoryVisible ? '×' : '≡'}
      </button>
      
      <ConversationHistory 
        messages={messages}
        conversations={conversations}
        isVisible={isHistoryVisible}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      
      <div className="app-container">
        <DynamicContent componentKey="welcome" />
        <div className="chat-container" style={{ 
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
            <h2 style={{ margin: 0 }}>Chat with Milla</h2>
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
                  {message.role === 'user' ? 'You' : 'Milla'}
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
    </div>
  );
}

export default App;

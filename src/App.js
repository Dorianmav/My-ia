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

  // Fonction pour optimiser le stockage des messages
  const optimizeMessages = (messages) => {
    return messages.map(msg => {
      // Ne garde que les champs essentiels
      const { role, content, timestamp } = msg;
      return { role, content, timestamp };
    });
  };

  // Fonction pour compresser le contenu des messages
  const compressContent = (content) => {
    // Supprime les espaces multiples et les sauts de ligne inutiles
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  // Fonction pour optimiser une conversation complète
  const optimizeConversation = (messages) => {
    if (messages.length === 0) return null;

    const optimizedMessages = optimizeMessages(messages).map(msg => ({
      ...msg,
      content: compressContent(msg.content)
    }));

    // Extraction des mots-clés
    const keywords = extractKeywords(messages);

    // Création d'un résumé basé sur le premier message utilisateur
    const firstUserMessage = messages.find(m => m.role === 'user');
    const summary = firstUserMessage 
      ? compressContent(firstUserMessage.content).substring(0, 100) + '...'
      : 'Nouvelle conversation';

    return {
      id: currentConversationId || messages[0].timestamp,
      timestamp: messages[0].timestamp,
      lastUpdate: new Date().toISOString(),
      summary,
      keywords,
      messages: optimizedMessages
    };
  };

  // Effet pour sauvegarder la conversation courante de manière optimisée
  useEffect(() => {
    if (messages.length > 0) {
      const optimizedConv = optimizeConversation(messages);
      if (!optimizedConv) return;

      // Mise à jour des conversations
      const updatedConversations = conversations.map(conv => 
        conv.id === optimizedConv.id ? optimizedConv : conv
      );

      // Ajout d'une nouvelle conversation si elle n'existe pas
      if (!conversations.some(conv => conv.id === optimizedConv.id)) {
        updatedConversations.unshift(optimizedConv);
      }

      // Limite le nombre de conversations stockées
      const maxConversations = 50; // Ajustez selon vos besoins
      const trimmedConversations = updatedConversations.slice(0, maxConversations);

      setConversations(trimmedConversations);
      localStorage.setItem('conversations', JSON.stringify(trimmedConversations));
      localStorage.setItem('currentConversation', JSON.stringify(optimizedConv));
    }
  }, [messages]);

  // Charge la conversation initiale de manière optimisée
  useEffect(() => {
    const currentConv = localStorage.getItem('currentConversation');
    if (currentConv) {
      const parsed = JSON.parse(currentConv);
      setMessages(parsed.messages);
      setCurrentConversationId(parsed.id);
    }
  }, []);

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
    
    const userMessage = {
      role: 'user',
      content: compressContent(inputText), // Optimise le contenu dès l'envoi
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    
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

      // Optimise et sauvegarde la conversation finale
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const extractKeywords = (messages) => {
    // Simple keyword extraction from the first user message
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const words = userMessage.toLowerCase().split(/\W+/);
    const commonWords = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'dans', 'sur', 'au', 'aux', 'a', 'en', 'pour', 'de', 'avec', 'par']);
    return words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5);
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

import React from 'react';
import './ConversationHistory.css';

const ConversationHistory = ({ messages, isVisible, onSelectConversation, onNewConversation }) => {
  // Group messages by date sections
  const groupMessagesByDate = () => {
    const groups = {
      'Hier': [],
      '7 jours précédents': [],
      '30 jours précédents': [],
      '2024': []
    };

    const now = new Date();
    
    messages.forEach(message => {
      if (message.role === 'user') {
        const messageDate = new Date(message.timestamp);
        const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 1) {
          groups['Hier'].push(message);
        } else if (diffDays < 7) {
          groups['7 jours précédents'].push(message);
        } else if (diffDays < 30) {
          groups['30 jours précédents'].push(message);
        } else {
          groups['2024'].push(message);
        }
      }
    });

    return groups;
  };

  const groups = groupMessagesByDate();

  return (
    <div className={`history-sidebar ${isVisible ? 'visible' : ''}`}>
      <div className="history-header">
        <h2>Conversations</h2>
        <button className="new-conversation-btn" onClick={onNewConversation}>
          <span className="plus-icon">+</span>
          Nouvelle conversation
        </button>
      </div>
      
      {Object.entries(groups).map(([period, messages]) => (
        messages.length > 0 && (
          <div key={period} className="history-section">
            <h3 className="history-period">{period}</h3>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className="history-item"
                onClick={() => onSelectConversation(message.timestamp)}
              >
                {message.content.substring(0, 30)}
                {message.content.length > 30 ? '...' : ''}
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  );
};

export default ConversationHistory;

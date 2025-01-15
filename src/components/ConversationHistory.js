import React from 'react';
import './ConversationHistory.css';

const ConversationHistory = ({ messages, conversations, isVisible, onSelectConversation, onNewConversation }) => {
  // Group messages by date sections
  const groupMessagesByDate = () => {
    const groups = {
      'Récent': [],
      'Hier': [],
      '7 jours précédents': [],
      '30 jours précédents': [],
      '2024': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Combine current messages and saved conversations
    const allConversations = [...conversations].map(conv => ({
      ...conv,
      summary: conv.summary || conv.messages[0]?.content || 'Nouvelle conversation',
      timestamp: conv.timestamp || conv.messages[0]?.timestamp
    }));

    allConversations.forEach(conv => {
      const messageDate = new Date(conv.timestamp);
      const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
      
      if (messageDate >= today) {
        groups['Récent'].push(conv);
      } else if (messageDate >= yesterday) {
        groups['Hier'].push(conv);
      } else if (diffDays < 7) {
        groups['7 jours précédents'].push(conv);
      } else if (diffDays < 30) {
        groups['30 jours précédents'].push(conv);
      } else {
        groups['2024'].push(conv);
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
      
      {Object.entries(groups).map(([period, convs]) => (
        convs.length > 0 && (
          <div key={period} className="history-section">
            <h3 className="history-period">{period}</h3>
            {convs.map((conv, index) => (
              <div 
                key={index} 
                className="history-item"
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="history-item-content">
                  <div className="history-item-summary">{conv.summary}</div>
                </div>
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  );
};

export default ConversationHistory;

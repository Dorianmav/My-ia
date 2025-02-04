import React from 'react';

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
    <div style={{ ...styles.historySidebar, ...(isVisible ? styles.visible : {}) }}>
      <div style={styles.historyHeader}>
        <h2 style={styles.historyHeaderH2}>Conversations</h2>
        <button
          style={styles.newConversationBtn}
          onClick={onNewConversation}
        >
          <span style={styles.plusIcon}>+</span>
          Nouvelle conversation
        </button>
      </div>
  
      {Object.entries(groups).map(
        ([period, convs]) =>
          convs.length > 0 && (
            <div key={period} style={styles.historySection}>
              <h3 style={styles.historyPeriod}>{period}</h3>
              {convs.map((conv, index) => (
                <div
                  key={index}
                  style={styles.historyItem}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <div style={styles.historyItemContent}>
                    <div style={styles.historyItemSummary}>{conv.summary}</div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
};

const styles = {
  historySidebar: {
    position: "fixed",
    left: "-300px",
    top: "0",
    width: "300px",
    height: "100vh",
    backgroundColor: "white",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
    transition: "left 0.3s ease",
    overflowY: "auto",
    zIndex: 1000,
  },
  visible: {
    left: "0",
  },
  historyHeader: {
    position: "sticky",
    top: "0",
    backgroundColor: "white",
    padding: "20px",
    borderBottom: "1px solid #eee",
    zIndex: 2,
  },
  historyHeaderH2: {
    margin: "0 0 15px 0",
    fontSize: "20px",
    color: "#333",
  },
  newConversationBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  plusIcon: {
    marginRight: "8px",
    fontSize: "18px",
    fontWeight: "bold",
  },
  historySection: {
    marginBottom: "20px",
    padding: "0 20px",
  },
  historyPeriod: {
    color: "#666",
    fontSize: "14px",
    fontWeight: "600",
    margin: "10px 0",
    paddingBottom: "5px",
    borderBottom: "1px solid #eee",
  },
  historyItem: {
    padding: "12px 0",
    cursor: "pointer",
    color: "#333",
    transition: "all 0.2s",
    textAlign: "left",
    fontSize: "14px",
    borderBottom: "1px solid #eee",
  },
  historyItemContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  historyItemSummary: {
    color: "#333",
    fontWeight: "500",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

export default ConversationHistory;

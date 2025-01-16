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

  const [currentTopicKey, setCurrentTopicKey] = useState(null);
  const [topics, setTopics] = useState(() => {
    const saved = localStorage.getItem('conversationTopics');
    return saved ? JSON.parse(saved) : {};
  });

  // Fonction pour générer une clé unique basée sur les mots-clés
  const generateTopicKey = (keywords) => {
    // keywords est déjà un tableau
    return keywords.sort().join('-').toLowerCase();
  };

  // Fonction pour extraire les mots-clés d'un texte
  const extractKeywords = async (text) => {
    let words = "";
    
    const textResume = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Analyse ce texte et identifie les mots-clés les plus importants et pertinents. 
Exemple 1, dans ce texte: je m'appelle Dorian j'ai un chien bleu qui s'appelle Blue
Exemple de format de réponse attendu, uniquement les mots-clés, séparés par des virgules: Dorian, chien, bleu, blue, s'appelle.
Exemple 2, dans ce texte:  
Lors de ma remise des diplôme de bac en 2018 à Méru j'ai pu revoir ma prof préféré madame Ouin et tous mes amis. Une fois arrivé devant les tableau des résultats j'ai vu que j'ai eu le bac à 10.28 et sans mention alors que mon amis Fara l'a eu avec mention bien à 13.56.
Exemple de format de réponse attendu, uniquement les mots-clés, séparés par des virgules: remise, diplôme, bac, Méru, madame Ouin, amis, résultats, mention.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: true,
      stop: null
    });

    for await (const chunk of textResume) {
      const content = chunk.choices[0]?.delta?.content || '';
      words += content;
    }

    // Convertit la chaîne en tableau et nettoie les mots-clés
    return words
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0); // Filtre les mots vides
  };

  // Fonction pour nettoyer les mots-clés
  const cleanKeywords = (keywords) => {
    if (!Array.isArray(keywords)) {
      keywords = keywords.split(',').map(k => k.trim());
    }
    
    // Liste de phrases et mots à exclure
    const phrasesToExclude = [
      "voici les mots-clés les plus importants et pertinents",
      "séparés par des virgules",
      "les mots-clés",
      "exemple de format",
      "réponse attendu"
    ];

    return keywords
      .filter(keyword => {
        // Vérifie que ce n'est pas une phrase d'introduction ou de formatage
        const isNotPhrase = !phrasesToExclude.some(phrase => 
          keyword.toLowerCase().includes(phrase.toLowerCase())
        );
        // Vérifie que le mot-clé a une longueur raisonnable et ne contient pas de caractères spéciaux
        const isValidKeyword = keyword.length > 1 && 
          keyword.length < 30 && 
          !/[:\/\\]/.test(keyword);
        
        return isNotPhrase && isValidKeyword;
      })
      .map(keyword => keyword.toLowerCase()) // Normalise les mots-clés en minuscules
      .filter((keyword, index, self) => 
        self.indexOf(keyword) === index // Supprime les doublons
      );
  };

  // Fonction pour détecter si un sujet est similaire
  const isSimilarTopic = (existingKeywords, newKeywords) => {
    // Vérifie que les entrées sont des tableaux
    if (!Array.isArray(existingKeywords) || !Array.isArray(newKeywords)) {
      console.warn('Keywords must be arrays:', { existingKeywords, newKeywords });
      return false;
    }

    // Nettoie et normalise les mots-clés
    const cleanedExisting = cleanKeywords(existingKeywords);
    const cleanedNew = cleanKeywords(newKeywords);

    // Trouve les mots-clés communs
    const commonKeywords = cleanedExisting.filter(keyword =>
      cleanedNew.includes(keyword)
    );

    // Calcule le pourcentage de similarité
    const similarityThreshold = 0.3; // 30% de similarité minimum
    const maxKeywords = Math.max(cleanedExisting.length, cleanedNew.length);
    const similarity = commonKeywords.length / maxKeywords;

    return similarity >= similarityThreshold;
  };

  // Fonction pour mettre à jour ou créer un nouveau sujet
  const updateTopic = async (message) => {
    const newKeywords = cleanKeywords(await extractKeywords(message.content));
    
    // Cherche un sujet similaire parmi tous les sujets existants
    const similarTopicEntry = Object.entries(topics).find(([key, topic]) => {
      const topicKeywords = cleanKeywords(topic.keywords);
      return isSimilarTopic(topicKeywords, newKeywords);
    });

    if (similarTopicEntry) {
      const [existingKey, existingTopic] = similarTopicEntry;
      // Fusionne les mots-clés existants avec les nouveaux
      const mergedKeywords = cleanKeywords([
        ...existingTopic.keywords,
        ...newKeywords
      ]);

      const updatedTopics = {
        ...topics,
        [existingKey]: {
          ...existingTopic,
          keywords: mergedKeywords,
          lastUpdate: new Date().toISOString()
        }
      };
      setTopics(updatedTopics);
      localStorage.setItem('conversationTopics', JSON.stringify(updatedTopics));
      return existingKey;
    }

    // Créer un nouveau sujet si aucun sujet similaire n'est trouvé
    const newTopicKey = generateTopicKey(newKeywords);
    const updatedTopics = {
      ...topics,
      [newTopicKey]: {
        keywords: newKeywords,
        created: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        summary: message.content.substring(0, 100)
      }
    };
    setTopics(updatedTopics);
    localStorage.setItem('conversationTopics', JSON.stringify(updatedTopics));
    return newTopicKey;
  };

  // Fonction pour rechercher des sujets similaires
  const findRelatedTopics = async (query) => {
    const queryKeywords = cleanKeywords(await extractKeywords(query));
    
    return Object.entries(topics)
      .filter(([key, topic]) => {
        const topicKeywords = cleanKeywords(topic.keywords);
        return isSimilarTopic(topicKeywords, queryKeywords);
      })
      .map(([key, topic]) => ({
        key,
        ...topic
      }));
  };

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

    // Création d'un résumé basé sur le premier message utilisateur
    const firstUserMessage = messages.find(m => m.role === 'user');
    const summary = firstUserMessage
      ? compressContent(firstUserMessage.content).substring(0, 100) + '...'
      : 'Nouvelle conversation';

    // Création d'un résumé basé sur tous les méssages de la conversation

    return {
      id: currentConversationId || messages[0].timestamp,
      timestamp: messages[0].timestamp,
      lastUpdate: new Date().toISOString(),
      summary,
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
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    // Mettre à jour le sujet actuel
    const topicKey = await updateTopic(userMessage);
    setCurrentTopicKey(topicKey);

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');

    setIsLoading(true);
    try {
      // Rechercher des sujets connexes
      const relatedTopics = await findRelatedTopics(userMessage.content);
      let contextualPrompt = userMessage.content;

      if (relatedTopics.length > 0) {
        // Ajouter le contexte des sujets connexes
        contextualPrompt = `Context from previous conversations about similar topics:
        ${relatedTopics.map(topic => `- ${topic.summary}`).join('\n')}

        Current question: ${userMessage.content}`;
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: contextualPrompt
          }
        ],
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
      }

      // Mettre à jour le sujet avec la réponse de l'assistant
      await updateTopic(assistantMessage);

      // Ajouter la réponse de l'assistant aux messages
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

  const handleTopicSelect = (topicKey) => {
    setCurrentTopicKey(topicKey);
    setIsHistoryVisible(false);
  };

  const renderTopicHistory = () => {
    return Object.entries(topics)
      .sort(([, a], [, b]) => new Date(b.lastUpdate) - new Date(a.lastUpdate))
      .map(([key, topic]) => (
        <div
          key={key}
          className="topic-item"
          onClick={() => handleTopicSelect(key)}
        >
          <div className="topic-summary">{topic.summary}</div>
          <div className="topic-keywords">{topic.keywords}</div>
        </div>
      ));
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
        {isHistoryVisible && (
          <div className="topic-history">
            <h3>Topic History</h3>
            {renderTopicHistory()}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkEmoji from 'remark-emoji';

const CopyButton = ({ code }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
      alert('Failed to copy code');
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        position: 'absolute',
        right: '10px',
        top: '10px',
        padding: '4px 8px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >
      Copy
    </button>
  );
};

CopyButton.propTypes = {
  code: PropTypes.string.isRequired
};

const MermaidDiagram = ({ code }) => {
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const elementId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const timeoutRef = useRef(null);

  useEffect(() => {
    console.log('useEffect called');
    // Nettoyer le timeout précédent si il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Attendre un peu que le texte soit complet
    timeoutRef.current = setTimeout(async () => {
      try {
        // Vérification que le code n'est pas undefined ou vide
        if (!code || typeof code !== 'string') {
          setError('Le code du diagramme est invalide ou manquant');
          return;
        }

        // Nettoyer et corriger la syntaxe
        let cleanCode = code.trim()
          .replace(/\|>/g, '|')  // Remplacer |> par |
          // .replace(/-->/g, ' --> ')  // Ajouter des espaces autour des flèches
          // .replace(/->/g, ' --> ')   // Standardiser les flèches
          // .replace(/\s+/g, ' ')      // Normaliser les espaces
          // .replace(/\[(\w+)\]/g, '["$1"]') // Ajouter des guillemets aux labels si nécessaire

        if (!cleanCode) {
          setError('Le code du diagramme est vide');
          return;
        }

        // Vérifier que le code commence par un type de diagramme valide
        const validDiagramTypes = ['graph', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'flowchart', 'gantt', 'pie'];
        const hasValidType = validDiagramTypes.some(type => cleanCode.startsWith(type));
        
        if (!hasValidType) {
          setError(`Le diagramme doit commencer par un type valide : ${validDiagramTypes.join(', ')}`);
          return;
        }

        setError(null);

        // Réinitialiser mermaid pour chaque rendu
        await mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          logLevel: 'error',
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            curve: 'basis'
          }
        });

        // Vérifier la syntaxe avant le rendu
        try {
          await mermaid.parse(cleanCode);
        } catch (parseError) {
          setError(`Erreur de syntaxe : ${parseError.message}`);
          return;
        }

        // Rendre le diagramme
        console.log('Rendering diagram...');
        const { svg } = await mermaid.render(elementId.current, cleanCode);
        setSvgContent(svg);
      } catch (err) {
        console.error('Erreur Mermaid:', err);
        setError(`Erreur de rendu : ${err.message || 'Erreur inconnue'}`);
      }
    }, 1000); // Attendre 1 seconde après le dernier changement

    // Nettoyer le timeout si le composant est démonté
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [code]);

  if (error) {
    return (
      <div style={{ 
        margin: '10px 0',
        padding: '10px',
        border: '1px solid #dc3545',
        borderRadius: '4px',
        backgroundColor: '#f8d7da',
        color: '#721c24'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Erreur de rendu du diagramme:</p>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error}</pre>
        <div style={{ marginTop: '10px' }}>
          <details>
            <summary>Code source du diagramme</summary>
            <pre style={{ 
              margin: '10px 0 0 0',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}>{code}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '20px 0' }}>
      {/* Bouton pour afficher/cacher le code */}
      <button 
        onClick={() => setShowCode(!showCode)}
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '0.9em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span style={{ 
          fontSize: '1.2em',
          transform: showCode ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s ease'
        }}>▶</span>
        {showCode ? 'Masquer le code source' : 'Afficher le code source'}
      </button>

      {/* Code source */}
      {showCode && (
        <div style={{ 
          position: 'relative',
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '10px',
        }}>
          <CopyButton code={code} />
          <pre style={{ 
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            margin: '0',
            paddingRight: '50px'
          }}>
            {code}
          </pre>
        </div>
      )}

      {/* Diagramme */}
      {svgContent && (
        <div 
          style={{ 
            background: '#fff', 
            padding: '15px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            overflowX: 'auto'
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};

MermaidDiagram.propTypes = {
  code: PropTypes.string.isRequired
};

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-content" style={{ textAlign: 'left' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkEmoji]} 
        components={{
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');

            if (match && match[1] === 'mermaid') {
              return <MermaidDiagram code={code} />;
            }

            return !inline && match ? (
              <div style={{ position: 'relative' }}>
                <CopyButton code={code} />
                <SyntaxHighlighter
                  {...props}
                  style={vs}
                  language={match[1]}
                  PreTag="div"
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

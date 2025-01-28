import React, { useEffect, useState, useRef } from 'react';
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

const MermaidDiagram = ({ code }) => {
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const elementId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // console.log('Code changed:', code);
    const renderDiagram = async () => {
      try {
        const cleanCode = code.trim();
        if (!cleanCode) {
          setError('Le code du diagramme est vide');
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
        await mermaid.parse(cleanCode);

        // Rendre le diagramme
        const { svg } = await mermaid.render(elementId.current, cleanCode);
        setSvgContent(svg);
      } catch (err) {
        console.error('Erreur Mermaid:', err);
        setError(err.message || 'Erreur lors du rendu du diagramme. Vérifiez la syntaxe.');
      }
    };

    renderDiagram();
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
              borderRadius: '4px',
              fontSize: '0.9em'
            }}>{code}</pre>
          </details>
        </div>
      </div>
    );
  }

  return svgContent ? (
    <div style={{ margin: '10px 0' }}>
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
    </div>
  ) : null;
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

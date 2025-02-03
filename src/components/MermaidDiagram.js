import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import mermaid from 'mermaid';
import CopyButton from './CopyButton';

const MermaidDiagram = ({ code }) => {
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const elementId = useRef(`mermaid-${Math.random().toString(36).slice(2, 11)}`);

  useEffect(() => {
    console.log('Rendering diagram');
    const renderDiagram = async () => {
      try {
        // Prétraiter le code
        let processedCode = code.trim();
        
        // S'assurer que le code commence par un type de diagramme
        if (!processedCode.match(/^(graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|flowchart|gantt|pie)/i)) {
          processedCode = `graph TD\n${processedCode}`;
        }

        // Initialiser mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          logLevel: 'error',
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true
          }
        });

        // Vérifier la syntaxe
        try {
          await mermaid.parse(processedCode);
        } catch (parseError) {
          setError(`Erreur de syntaxe : ${parseError.message}`);
          return;
        }

        // Rendre le diagramme
        const { svg } = await mermaid.render(elementId.current, processedCode);
        setSvgContent(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid diagram rendering error:', err);
        setError(`Erreur de rendu : ${err.message || 'Erreur inconnue'}`);
        setSvgContent('');
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div 
        style={{
          color: '#721c24',
          backgroundColor: '#f8d7da',
          padding: '10px',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginTop: '10px'
        }}
      >
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

export default MermaidDiagram;

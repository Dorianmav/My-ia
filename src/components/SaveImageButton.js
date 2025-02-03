import React from 'react';
import PropTypes from 'prop-types';

const SaveImageButton = ({ svgContent }) => {
  const handleSave = () => {
    try {
      // Créer un blob à partir du SVG
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = 'diagram.svg';  
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'image:', err);
    }
  };

  return (
    <button
      onClick={handleSave}
      style={{
        display: 'block',
        margin: '10px auto',
        padding: '8px 16px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#333'
      }}
    >
      Enregistrer en SVG
    </button>
  );
};

SaveImageButton.propTypes = {
  svgContent: PropTypes.string.isRequired
};

export default SaveImageButton;

import React, { useState } from 'react';
import './GeneratedComponent.css';

const Compteur = () => {
    const [count, setCount] = useState(0);

    const handleIncrement = () => {
        setCount(count + 1);
    };

    const handleDecrement = () => {
        setCount(count - 1);
    };

    return (
        <div className="generated-component compteur">
            <h2>Compteur</h2>
            <div className="counter-display">{count}</div>
            <div className="counter-buttons">
                <button 
                    onClick={handleDecrement}
                    className="counter-button decrement"
                >
                    -
                </button>
                <button 
                    onClick={handleIncrement}
                    className="counter-button increment"
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default Compteur;
// client/src/components/common/Button.jsx
import React from 'react';
import { FaSpinner } from 'react-icons/fa';

/**
 * Reusable Button component styled with Tailwind CSS.
 * @param {string} variant - 'primary' (default, indigo) or 'secondary' (gray).
 * @param {boolean} isLoading - Shows a spinner and disables the button.
 * @param {string} children - The content inside the button (e.g., "Submit").
 */
const Button = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    isLoading = false, 
    disabled = false,
    className = ''
}) => {

    // Define base and variant styles
    const baseStyle = 'flex items-center justify-center font-medium rounded-lg px-4 py-2 transition duration-150 ease-in-out';
    
    const primaryStyle = 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300';
    const secondaryStyle = 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-400';

    // Apply disabled/loading styles
    const isDisabled = disabled || isLoading;
    const disabledStyle = 'opacity-50 cursor-not-allowed';

    // Choose style based on variant
    const style = variant === 'primary' ? primaryStyle : secondaryStyle;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`${baseStyle} ${style} ${isDisabled ? disabledStyle : ''} ${className}`}
        >
            {isLoading ? (
                <>
                    <FaSpinner className="animate-spin mr-2" />
                    Loading...
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
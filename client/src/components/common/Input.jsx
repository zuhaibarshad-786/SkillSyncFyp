// client/src/components/common/Input.jsx
import React from 'react';

/**
 * Reusable Input component styled with Tailwind CSS for forms.
 * @param {string} label - The label displayed above the input.
 * @param {string} name - The name attribute (required for forms).
 * @param {string} error - Optional error message.
 * @param {React.ReactNode} icon - Optional icon to place inside the input.
 */
const Input = ({ 
    label, 
    name, 
    type = 'text', 
    placeholder, 
    value, 
    onChange, 
    error,
    icon: IconComponent, // Destructure and rename icon prop
    required = false,
    className = ''
}) => {

    // Style for the input element
    const inputStyle = `
        w-full p-3 border rounded-lg 
        focus:outline-none transition duration-150
        ${error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        }
    `;

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label 
                    htmlFor={name} 
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={inputStyle}
                />
                {IconComponent && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <IconComponent className="h-5 w-5 text-gray-400" />
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default Input;
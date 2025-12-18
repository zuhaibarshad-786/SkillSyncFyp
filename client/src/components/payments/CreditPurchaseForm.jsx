// client/src/components/payments/CreditPurchaseForm.jsx
import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { FaPaypal, FaLock } from 'react-icons/fa';
// Note: JazzCash/Easypaisa icons would need to be custom SVGs or images

const paymentMethods = ['JazzCash', 'Easypaisa', 'PayPal', 'Credit Card'];
const creditPacks = [
    { id: 100, credits: 5, price: 5 },
    { id: 200, credits: 15, price: 12 },
    { id: 300, credits: 30, price: 20 },
];

const CreditPurchaseForm = ({ onPurchaseSuccess }) => {
    const [selectedPack, setSelectedPack] = useState(creditPacks[0]);
    const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        
        // Mock API call simulation
        setTimeout(() => {
            setIsProcessing(false);
            alert(`Successfully purchased ${selectedPack.credits} credits via ${selectedMethod}!`);
            onPurchaseSuccess(selectedPack.credits);
        }, 2000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Credit Pack Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Credit Pack</label>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                    {creditPacks.map(pack => (
                        <div
                            key={pack.id}
                            onClick={() => setSelectedPack(pack)}
                            className={`p-4 border-2 rounded-lg cursor-pointer flex-shrink-0 w-32 text-center transition ${
                                selectedPack.id === pack.id 
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                                    : 'border-gray-300 hover:border-indigo-400'
                            }`}
                        >
                            <p className="text-2xl font-bold text-indigo-900">{pack.credits}</p>
                            <p className="text-sm text-gray-600">Credits</p>
                            <p className="font-semibold text-green-600 mt-1">${pack.price}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Method Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => (
                        <div
                            key={method}
                            onClick={() => setSelectedMethod(method)}
                            className={`p-3 border rounded-lg cursor-pointer flex items-center justify-center transition ${
                                selectedMethod === method 
                                    ? 'border-green-600 bg-green-50 shadow-md' 
                                    : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {/* Simple icon or text for methods */}
                            {method === 'PayPal' ? <FaPaypal className="text-blue-700 mr-2"/> : null}
                            <span className="text-sm font-medium">{method}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Integrated payment gateways: JazzCash, Easypaisa, PayPal, etc.
                </p>
            </div>
            
            {/* Purchase Button */}
            <Button
                type="submit"
                variant="primary"
                isLoading={isProcessing}
                className="w-full text-lg py-3 mt-4"
            >
                <FaLock className="mr-2"/> Pay ${selectedPack.price} Now
            </Button>
        </form>
    );
};

export default CreditPurchaseForm;
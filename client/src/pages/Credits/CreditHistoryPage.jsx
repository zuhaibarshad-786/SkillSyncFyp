// client/src/pages/Credits/CreditHistoryPage.jsx
import React from 'react';
import { FaHistory, FaPlus, FaMinus, FaDollarSign, FaChalkboardTeacher } from 'react-icons/fa';

const mockCreditHistory = [
    { id: 1, date: '2025-12-05', type: 'LEARNING_SESSION', description: 'Used credit to learn React Basics from Alice', change: -1, balance: 14 },
    { id: 2, date: '2025-12-01', type: 'TEACHING_SESSION', description: 'Earned credit teaching Python to Bob', change: +1, balance: 15 },
    { id: 3, date: '2025-11-25', type: 'PURCHASE', description: 'Purchased 10 credits via PayPal', change: +10, balance: 14 },
    { id: 4, date: '2025-11-15', type: 'CONTRIBUTION', description: 'Awarded credits for submitting Node.js notes', change: +3, balance: 4 },
];

const CreditHistoryPage = () => {

    const getIcon = (type) => {
        switch (type) {
            case 'LEARNING_SESSION':
                return { icon: FaMinus, color: 'text-red-500 bg-red-100' };
            case 'TEACHING_SESSION':
                return { icon: FaChalkboardTeacher, color: 'text-green-500 bg-green-100' };
            case 'PURCHASE':
                return { icon: FaDollarSign, color: 'text-blue-500 bg-blue-100' };
            case 'CONTRIBUTION':
                return { icon: FaPlus, color: 'text-purple-500 bg-purple-100' };
            default:
                return { icon: FaHistory, color: 'text-gray-500 bg-gray-100' };
        }
    };

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaHistory className="mr-3 text-purple-600"/> Credit Transaction History
            </h1>
            <p className="text-gray-600 mb-8">
                Track all transactions, including credits earned through teaching and contributions, and credits spent on learning sessions[cite: 75, 250].
            </p>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">New Balance</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {mockCreditHistory.map(item => {
                            const { icon: Icon, color } = getIcon(item.type);
                            return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${color}`}>
                                            <Icon className="mr-1"/> {item.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-center text-sm font-bold ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.change > 0 ? `+${item.change}` : item.change}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-800">
                                        {item.balance}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {mockCreditHistory.length === 0 && (
                 <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                    No credit transactions yet.
                </div>
            )}
        </div>
    );
};

export default CreditHistoryPage;
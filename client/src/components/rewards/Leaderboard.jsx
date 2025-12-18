// client/src/components/rewards/Leaderboard.jsx
import React from 'react';
import { FaMedal } from 'react-icons/fa';

const mockLeaderboard = [
    { rank: 1, name: 'Habib-UL-Rehman', points: 2500, ratio: '3.1:1' },
    { rank: 2, name: 'Zohaib Arshad', points: 2100, ratio: '2.8:1' },
    { rank: 3, name: 'Abuzar Aslam', points: 1950, ratio: '2.5:1' },
    { rank: 4, name: 'Top Teacher', points: 1500, ratio: '2.0:1' },
    { rank: 5, name: 'Master Pro', points: 1200, ratio: '1.8:1' },
];

const Leaderboard = () => {
    return (
        <div className="bg-gray-50 rounded-lg overflow-hidden shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">T-L Ratio</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {mockLeaderboard.map((user) => (
                        <tr key={user.rank} className={user.rank <= 3 ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.rank <= 3 ? <FaMedal className={`inline mr-2 ${user.rank === 1 ? 'text-gold-500' : user.rank === 2 ? 'text-silver-500' : 'text-bronze-500'}`} /> : user.rank}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{user.points}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">{user.ratio}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;
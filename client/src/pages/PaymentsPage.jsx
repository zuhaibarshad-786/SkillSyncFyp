// // client/src/pages/PaymentsPage.jsx
// import React, { useState } from 'react';
// import { FaCreditCard, FaCrown, FaCheckCircle, FaLock } from 'react-icons/fa';
// import Button from '../components/common/Button';
// import CreditPurchaseForm from '../components/payments/CreditPurchaseForm';

// const PaymentsPage = () => {
//     const [currentCredits, setCurrentCredits] = useState(150); // Mock data
//     const [isPremium, setIsPremium] = useState(false); // Mock data

//     const handlePremiumUpgrade = () => {
//         // Mock API call for upgrading
//         console.log("Upgrading to Premium...");
//         // In a real app, this would involve an API call to process payment
//         setTimeout(() => {
//             setIsPremium(true);
//             alert('Congratulations! You are now a Premium Member.');
//         }, 1500);
//     };

//     return (
//         <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
//             <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
//                 <FaCreditCard className="mr-3 text-indigo-600"/> Credits & Membership
//             </h1>
//             <p className="text-gray-600 mb-8">
//                 Manage your skill credits and explore our premium features to enhance your learning experience.
//             </p>

//             {/* Credit Balance */}
//             <div className="bg-indigo-50 p-6 rounded-xl shadow-inner mb-10 border-l-4 border-indigo-500">
//                 <h2 className="text-xl font-semibold text-indigo-700">Your Current Skill Credits</h2>
//                 <p className="text-5xl font-extrabold text-indigo-900 mt-2">{currentCredits}</p>
//                 <p className="text-sm text-gray-600 mt-1">
//                     1 credit = 1 session of learning without teaching in return.
//                 </p>
//             </div>

//             {/* Purchase Credits Section */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
//                 <div className="border p-6 rounded-lg shadow-sm">
//                     <h2 className="text-2xl font-semibold text-gray-800 mb-4">Buy More Credits</h2>
//                     <CreditPurchaseForm 
//                         onPurchaseSuccess={(amount) => setCurrentCredits(c => c + amount)}
//                     />
//                 </div>
                
//                 {/* Premium Membership Section (Freemium Model) */}
//                 <div className={`p-6 rounded-lg ${isPremium ? 'bg-green-50 border border-green-300' : 'bg-purple-50 border border-purple-300'}`}>
//                     <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
//                         <FaCrown className="mr-2"/> Skill Sync Premium
//                     </h2>
                    
//                     {isPremium ? (
//                         <div className="text-center py-4">
//                             <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-3"/>
//                             <p className="text-lg font-bold text-green-700">You are a Premium Member!</p>
//                             <p className="text-sm text-gray-600 mt-2">Enjoy all advanced features, including faster matching and verified badges.</p>
//                         </div>
//                     ) : (
//                         <>
//                             <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-6">
//                                 <li>Faster matching</li>
//                                 <li>Verified profile badge</li>
//                                 <li>Early access to mentors</li>
//                             </ul>
//                             <Button 
//                                 onClick={handlePremiumUpgrade} 
//                                 variant="primary" 
//                                 className="w-full bg-purple-600 hover:bg-purple-700"
//                             >
//                                 <FaLock className="mr-2"/> Upgrade to Premium
//                             </Button>
//                         </>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default PaymentsPage;
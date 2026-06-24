import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const LockedAccountModal: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative animate-fade-in-up">

                {/* Lock Icon Circle */}
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                    <svg
                        className="h-10 w-10 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Account Locked
                </h3>

                {/* Message Body */}
                <div className="mt-2 px-2">
                    <p className="text-gray-500 leading-relaxed">
                        Your account has been deactivated by the administrator due to security or policy reasons.
                    </p>

                    <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-4">
                        <p className="text-sm text-red-800 font-medium">
                            Please contact support to resolve this issue:
                        </p>
                        <a
                            href="mailto:admin@emc.edu.vn"
                            className="text-red-600 font-bold hover:underline text-lg block mt-1"
                        >
                            admin@emc.edu.vn
                        </a>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm transition-all"
                    >
                        I Understand, Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LockedAccountModal;
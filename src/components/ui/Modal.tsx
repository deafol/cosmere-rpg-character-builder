"use client";

import React from 'react';

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'warning' | 'info' | 'success';
}

export const Modal = ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    variant = 'info'
}: ModalProps) => {
    if (!isOpen) return null;

    const variantStyles = {
        warning: 'border-amber-500',
        info: 'border-cosmere-blue',
        success: 'border-cosmere-gold'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className={`relative bg-cosmere-parchment rounded-lg shadow-2xl border-2 ${variantStyles[variant]} max-w-md w-full mx-4 transform transition-all animate-in fade-in zoom-in duration-200`}>
                {/* Header */}
                <div className="px-6 py-4 bg-cosmere-blue rounded-t-lg">
                    <h3 className="text-xl font-display font-bold text-cosmere-gold flex items-center gap-3">
                        {variant === 'warning' && (
                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {variant === 'info' && (
                            <svg className="w-6 h-6 text-cosmere-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {variant === 'success' && (
                            <svg className="w-6 h-6 text-cosmere-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {title}
                    </h3>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    <p className="text-stone-700">{message}</p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-cosmere-gold/30 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded border border-cosmere-blue/30 text-cosmere-blue hover:bg-cosmere-blue/10 font-display font-bold text-sm uppercase tracking-wide transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-cosmere-blue text-cosmere-gold hover:bg-cosmere-blue-hover font-display font-bold text-sm uppercase tracking-wide transition-colors shadow-md"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Simple notification modal (just an OK button)
interface NotificationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
    variant?: 'warning' | 'info' | 'success' | 'error';
}

export const NotificationModal = ({
    isOpen,
    title,
    message,
    onClose,
    variant = 'info'
}: NotificationModalProps) => {
    if (!isOpen) return null;

    const variantStyles = {
        warning: 'border-amber-500',
        info: 'border-cosmere-blue',
        success: 'border-cosmere-gold',
        error: 'border-red-500'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={`relative bg-cosmere-parchment rounded-lg shadow-2xl border-2 ${variantStyles[variant]} max-w-md w-full mx-4`}>
                <div className="px-6 py-4 bg-cosmere-blue rounded-t-lg">
                    <h3 className="text-xl font-display font-bold text-cosmere-gold flex items-center gap-3">
                        {variant === 'success' && (
                            <svg className="w-6 h-6 text-cosmere-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {variant === 'error' && (
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {variant === 'info' && (
                            <svg className="w-6 h-6 text-cosmere-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {variant === 'warning' && (
                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {title}
                    </h3>
                </div>

                <div className="px-6 py-4">
                    <p className="text-stone-700">{message}</p>
                </div>

                <div className="px-6 py-4 border-t border-cosmere-gold/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-cosmere-blue text-cosmere-gold hover:bg-cosmere-blue-hover font-display font-bold text-sm uppercase tracking-wide transition-colors shadow-md"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

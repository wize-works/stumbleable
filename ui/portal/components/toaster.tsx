'use client';

import React, { useEffect, useState } from 'react';

interface ToasterProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToasterProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const typeClasses = {
        success: 'alert-success',
        error: 'alert-error',
        warning: 'alert-warning',
        info: 'alert-info',
    };

    const icons = {
        success: 'fa-solid fa-duotone fa-check-circle',
        error: 'fa-solid fa-duotone fa-times-circle',
        warning: 'fa-solid fa-duotone fa-exclamation-triangle',
        info: 'fa-solid fa-duotone fa-info-circle',
    };

    return (
        <div
            className={`alert ${typeClasses[type]} shadow-lg animate-in slide-in-from-right-full duration-300 max-w-sm`}
            role="alert"
        >
            <i className={`${icons[type]} text-lg`}></i>
            <span>{message}</span>
            <button
                onClick={onClose}
                className="btn btn-sm btn-circle btn-ghost ml-auto"
                aria-label="Close notification"
            >
                <i className="fa-solid fa-duotone fa-times"></i>
            </button>
        </div>
    );
}

interface ToasterContextType {
    showToast: (message: string, type?: ToasterProps['type'], duration?: number) => void;
}

const ToasterContext = React.createContext<ToasterContextType | null>(null);

export function useToaster() {
    const context = React.useContext(ToasterContext);
    if (!context) {
        throw new Error('useToaster must be used within ToasterProvider');
    }
    return context;
}

interface Toast {
    id: string;
    message: string;
    type: ToasterProps['type'];
    duration: number;
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToasterProps['type'] = 'info', duration = 3000) => {
        const id = Date.now().toString();
        const newToast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, newToast]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToasterContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container */}
            <div className="toast toast-end z-50">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToasterContext.Provider>
    );
}
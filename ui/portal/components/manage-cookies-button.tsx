'use client';

export function ManageCookiesButton() {
    const handleClick = () => {
        localStorage.removeItem('cookie-consent');
        window.location.reload();
    };

    return (
        <button
            onClick={handleClick}
            className="text-sm text-base-content/60 hover:text-primary transition-colors text-left"
        >
            Manage Cookies
        </button>
    );
}

'use client';

interface LogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    textSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    className?: string;
    textMode?: 'none' | 'short' | 'full';
    twoColors?: boolean;
    logoShadow?: boolean;
}

const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
};

const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    xxl: 'text-3xl'
};

// App constants
const APP_TITLE = 'stumbleable';
const APP_SHORT_TITLE = 'S';

export default function Logo({
    size = 'md',
    textSize = 'md',
    className = '',
    textMode = 'none',
    twoColors = true,
    logoShadow = true
}: LogoProps) {
    const sizeClass = sizeClasses[size];
    const textSizeClass = textSizeClasses[textSize];
    const shadowClass = logoShadow ? 'logo-shadow' : '';

    // Determine what text to show based on mode
    const displayText = textMode === 'full' ? APP_TITLE :
        textMode === 'short' ? APP_SHORT_TITLE :
            null;

    // Combined paths for single color mode
    const combinedPath = "M64 448C64 465.7 78.3 480 96 480L160 480C190.2 480 218.7 465.8 236.8 441.6L288 373.3C274.7 355.5 261.3 337.7 248 320L185.6 403.2C179.6 411.3 170.1 416 160 416L96 416C78.3 416 64 430.3 64 448zM288 266.7C301.3 284.5 314.7 302.3 328 320L390.4 236.8C396.4 228.7 405.9 224 416 224L448 224L448 256C448 268.9 455.8 280.6 467.8 285.6C479.8 290.6 493.5 287.8 502.7 278.7L566.7 214.7C572.7 208.7 576.1 200.6 576.1 192.1C576.1 183.6 572.7 175.5 566.7 169.5L502.7 105.5C493.5 96.3 479.8 93.6 467.8 98.6C455.8 103.6 448 115.1 448 128L448 160L416 160C385.8 160 357.3 174.2 339.2 198.4L288 266.7z M416 480C385.8 480 357.3 465.8 339.2 441.6L185.6 236.8C179.6 228.7 170.1 224 160 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160C190.2 160 218.7 174.2 236.8 198.4L390.4 403.2C396.4 411.3 405.9 416 416 416L448 416L448 384C448 371.1 455.8 359.4 467.8 354.4C479.8 349.4 493.5 352.2 502.7 361.3L566.7 425.3C572.7 431.3 576.1 439.4 576.1 447.9C576.1 456.4 572.7 464.5 566.7 470.5L502.7 534.5C493.5 543.7 479.8 546.4 467.8 541.4C455.8 536.4 448 524.9 448 512L448 480L416 480z";

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Logo Icon */}
            <div className={`${sizeClass} relative ${shadowClass}`}>
                {twoColors ? (
                    <>
                        {/* Top path - Primary color */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full absolute inset-0 text-primary">
                            <path
                                fill="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M64 448C64 465.7 78.3 480 96 480L160 480C190.2 480 218.7 465.8 236.8 441.6L288 373.3C274.7 355.5 261.3 337.7 248 320L185.6 403.2C179.6 411.3 170.1 416 160 416L96 416C78.3 416 64 430.3 64 448zM288 266.7C301.3 284.5 314.7 302.3 328 320L390.4 236.8C396.4 228.7 405.9 224 416 224L448 224L448 256C448 268.9 455.8 280.6 467.8 285.6C479.8 290.6 493.5 287.8 502.7 278.7L566.7 214.7C572.7 208.7 576.1 200.6 576.1 192.1C576.1 183.6 572.7 175.5 566.7 169.5L502.7 105.5C493.5 96.3 479.8 93.6 467.8 98.6C455.8 103.6 448 115.1 448 128L448 160L416 160C385.8 160 357.3 174.2 339.2 198.4L288 266.7z"
                            />
                        </svg>
                        {/* Bottom path - Secondary color */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full absolute inset-0 text-secondary">
                            <path
                                fill="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M416 480C385.8 480 357.3 465.8 339.2 441.6L185.6 236.8C179.6 228.7 170.1 224 160 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160C190.2 160 218.7 174.2 236.8 198.4L390.4 403.2C396.4 411.3 405.9 416 416 416L448 416L448 384C448 371.1 455.8 359.4 467.8 354.4C479.8 349.4 493.5 352.2 502.7 361.3L566.7 425.3C572.7 431.3 576.1 439.4 576.1 447.9C576.1 456.4 572.7 464.5 566.7 470.5L502.7 534.5C493.5 543.7 479.8 546.4 467.8 541.4C455.8 536.4 448 524.9 448 512L448 480L416 480z"
                            />
                        </svg>
                    </>
                ) : (
                    /* Single color mode */
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full text-primary">
                        <path
                            fill="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={combinedPath}
                        />
                    </svg>
                )}
            </div>

            {/* Text */}
            {displayText && (
                <span className={`font-bold ${textSizeClass} text-primary pb-2`}>
                    {displayText}
                </span>
            )}
        </div>
    );
}
'use client';

/**
 * AnimatedShuffleHero - A hero background featuring an animated, glowing shuffle icon
 * that draws itself from left to right across the viewport.
 */
export function AnimatedShuffleHero() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-40">
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />

            {/* CSS Animation Styles */}
            <style jsx>{`
                @keyframes drawPath {
                    0% {
                        stroke-dashoffset: 2000;
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        stroke-dashoffset: 0;
                        opacity: 0.3;
                    }
                }
                
                @keyframes drawPathDelayed {
                    0% {
                        stroke-dashoffset: 2200;
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        stroke-dashoffset: 0;
                        opacity: 0.3;
                    }
                }

                @keyframes colorShift {
                    0% {
                        stroke: var(--color-primary);
                    }
                    33% {
                        stroke: var(--color-secondary);
                    }
                    66% {
                        stroke: var(--color-accent);
                    }
                    100% {
                        stroke: var(--color-primary);
                    }
                }

                .path-top {
                    stroke-dasharray: 2000;
                    animation: drawPath 6s ease-in-out infinite, colorShift 8s ease-in-out infinite;
                }

                .path-bottom {
                    stroke-dasharray: 2200;
                    animation: drawPathDelayed 6s ease-in-out infinite 0.5s, colorShift 8s ease-in-out infinite 0.5s;
                }

                .glow-filter {
                    filter: drop-shadow(0 0 10px currentColor) drop-shadow(0 0 20px currentColor);
                }
            `}</style>

            {/* Animated SVG Container */}
            <div className="absolute inset-0 flex items-center justify-center">
                <svg
                    viewBox="0 0 640 640"
                    className="w-full h-auto max-h-screen"
                    style={{ minWidth: '200%', transform: 'translateX(-25%)' }}
                >
                    {/* Top path with CSS animation */}
                    <path
                        className="path-top glow-filter"
                        d="M64 448C64 465.7 78.3 480 96 480L160 480C190.2 480 218.7 465.8 236.8 441.6L288 373.3C274.7 355.5 261.3 337.7 248 320L185.6 403.2C179.6 411.3 170.1 416 160 416L96 416C78.3 416 64 430.3 64 448zM288 266.7C301.3 284.5 314.7 302.3 328 320L390.4 236.8C396.4 228.7 405.9 224 416 224L448 224L448 256C448 268.9 455.8 280.6 467.8 285.6C479.8 290.6 493.5 287.8 502.7 278.7L566.7 214.7C572.7 208.7 576.1 200.6 576.1 192.1C576.1 183.6 572.7 175.5 566.7 169.5L502.7 105.5C493.5 96.3 479.8 93.6 467.8 98.6C455.8 103.6 448 115.1 448 128L448 160L416 160C385.8 160 357.3 174.2 339.2 198.4L288 266.7z"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Bottom path with CSS animation (delayed) */}
                    <path
                        className="path-bottom glow-filter"
                        d="M416 480C385.8 480 357.3 465.8 339.2 441.6L185.6 236.8C179.6 228.7 170.1 224 160 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160C190.2 160 218.7 174.2 236.8 198.4L390.4 403.2C396.4 411.3 405.9 416 416 416L448 416L448 384C448 371.1 455.8 359.4 467.8 354.4C479.8 349.4 493.5 352.2 502.7 361.3L566.7 425.3C572.7 431.3 576.1 439.4 576.1 447.9C576.1 456.4 572.7 464.5 566.7 470.5L502.7 534.5C493.5 543.7 479.8 546.4 467.8 541.4C455.8 536.4 448 524.9 448 512L448 480L416 480z"
                        fill="none"
                        stroke="var(--color-secondary)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Static filled paths for base layer */}
                    <g opacity="0.1">
                        <path
                            d="M64 448C64 465.7 78.3 480 96 480L160 480C190.2 480 218.7 465.8 236.8 441.6L288 373.3C274.7 355.5 261.3 337.7 248 320L185.6 403.2C179.6 411.3 170.1 416 160 416L96 416C78.3 416 64 430.3 64 448zM288 266.7C301.3 284.5 314.7 302.3 328 320L390.4 236.8C396.4 228.7 405.9 224 416 224L448 224L448 256C448 268.9 455.8 280.6 467.8 285.6C479.8 290.6 493.5 287.8 502.7 278.7L566.7 214.7C572.7 208.7 576.1 200.6 576.1 192.1C576.1 183.6 572.7 175.5 566.7 169.5L502.7 105.5C493.5 96.3 479.8 93.6 467.8 98.6C455.8 103.6 448 115.1 448 128L448 160L416 160C385.8 160 357.3 174.2 339.2 198.4L288 266.7z"
                            fill="var(--color-primary)"
                        />
                        <path
                            d="M416 480C385.8 480 357.3 465.8 339.2 441.6L185.6 236.8C179.6 228.7 170.1 224 160 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160C190.2 160 218.7 174.2 236.8 198.4L390.4 403.2C396.4 411.3 405.9 416 416 416L448 416L448 384C448 371.1 455.8 359.4 467.8 354.4C479.8 349.4 493.5 352.2 502.7 361.3L566.7 425.3C572.7 431.3 576.1 439.4 576.1 447.9C576.1 456.4 572.7 464.5 566.7 470.5L502.7 534.5C493.5 543.7 479.8 546.4 467.8 541.4C455.8 536.4 448 524.9 448 512L448 480L416 480z"
                            fill="var(--color-secondary)"
                        />
                    </g>
                </svg>
            </div>

            {/* Additional atmospheric effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent opacity-80" />
        </div>
    );
}

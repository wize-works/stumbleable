'use client';

import { useEffect, useRef } from 'react';

export function LavaLampBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match parent container
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.offsetWidth;
                canvas.height = parent.offsetHeight;
                console.log('Canvas resized:', canvas.width, 'x', canvas.height);
            }
        };

        // Lava blob configuration
        interface Blob {
            x: number;
            y: number;
            radius: number;
            vx: number;
            vy: number;
            color: string;
            opacity: number;
        }

        let blobs: Blob[] = [];
        let isInitialized = false;
        let mouseX = -1000;
        let mouseY = -1000;
        let isMouseInside = false;

        // Initialize blobs AFTER canvas is sized - MORE blobs for slime effect!
        const initBlobs = (): Blob[] => {
            console.log('Initializing slime blobs with canvas size:', canvas.width, 'x', canvas.height);
            const colors = [
                { hex: '#FF4D6D', count: 4 },  // Pink-red
                { hex: '#00C49A', count: 4 },  // Aqua/mint
                { hex: '#00E6B3', count: 3 },  // Bright mint
                { hex: '#FFD600', count: 3 },  // Yellow
            ];

            const newBlobs: Blob[] = [];

            colors.forEach(({ hex, count }) => {
                for (let i = 0; i < count; i++) {
                    newBlobs.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        radius: 180 + Math.random() * 200, // Vary size: 180-380px
                        vx: (Math.random() - 0.5) * 0.3,    // Slower for oozing effect
                        vy: (Math.random() - 0.5) * 0.3,
                        color: hex,
                        opacity: 0.15 + Math.random() * 0.25, // 0.15-0.4 for translucent slime
                    });
                }
            });

            return newBlobs;
        };

        let animationFrameId: number;

        // Resize on window resize
        window.addEventListener('resize', resizeCanvas);

        // Also observe parent size changes
        const resizeObserver = new ResizeObserver(resizeCanvas);
        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }

        // Mouse interaction - track cursor position
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
            isMouseInside = true;
        };

        const handleMouseLeave = () => {
            isMouseInside = false;
            mouseX = -1000;
            mouseY = -1000;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        let frameCount = 0;
        const animate = () => {
            // Initialize blobs on first frame when canvas has proper size
            if (!isInitialized && canvas.width > 0 && canvas.height > 0) {
                blobs = initBlobs();
                isInitialized = true;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);


            // Update and draw each blob
            blobs.forEach((blob, index) => {
                // Debug first blob on first frame
                if (frameCount === 1 && index === 0) {
                    console.log('First blob:', blob);
                }

                // Mouse interaction - repel blobs away from cursor
                if (isMouseInside) {
                    const dx = blob.x - mouseX;
                    const dy = blob.y - mouseY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const interactionRadius = 300; // How far the effect reaches

                    if (distance < interactionRadius && distance > 0) {
                        // Repel with inverse square law for natural feel
                        const force = (1 - distance / interactionRadius) * 2;
                        const angle = Math.atan2(dy, dx);
                        blob.vx += Math.cos(angle) * force * 0.5;
                        blob.vy += Math.sin(angle) * force * 0.5;
                    }
                }

                // Apply friction to gradually slow down after interaction
                blob.vx *= 0.95;
                blob.vy *= 0.95;

                // Update position
                blob.x += blob.vx;
                blob.y += blob.vy;

                // Bounce off edges with smooth wraparound effect
                if (blob.x - blob.radius < 0 || blob.x + blob.radius > canvas.width) {
                    blob.vx *= -1;
                    blob.x = Math.max(blob.radius, Math.min(canvas.width - blob.radius, blob.x));
                }
                if (blob.y - blob.radius < 0 || blob.y + blob.radius > canvas.height) {
                    blob.vy *= -1;
                    blob.y = Math.max(blob.radius, Math.min(canvas.height - blob.radius, blob.y));
                }

                // Create gradient for each blob
                const gradient = ctx.createRadialGradient(
                    blob.x,
                    blob.y,
                    0,
                    blob.x,
                    blob.y,
                    blob.radius
                );

                // Convert hex to rgba for gradient (canvas requires rgba format!)
                const hexToRgba = (hex: string, alpha: number) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                };

                // Slime-like gradient: stronger in center, fades out smoothly
                gradient.addColorStop(0, hexToRgba(blob.color, blob.opacity * 1.2));
                gradient.addColorStop(0.3, hexToRgba(blob.color, blob.opacity * 0.8));
                gradient.addColorStop(0.7, hexToRgba(blob.color, blob.opacity * 0.3));
                gradient.addColorStop(1, hexToRgba(blob.color, 0));

                // Draw blob with extra heavy blur for gooey slime effect
                ctx.save();
                ctx.filter = 'blur(120px)'; // Even more blur for slime
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Initial size
        resizeCanvas();

        // Start animation
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-1"
            style={{
                opacity: 1,
                mixBlendMode: 'normal'
            }}
        />
    );
}

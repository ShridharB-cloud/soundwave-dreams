"use client"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface LiquidEffectProps {
    imageUrl: string;
    className?: string;
    intensity?: number;
}

export function LiquidEffect({ imageUrl, className, intensity = 1 }: LiquidEffectProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Create a unique ID for this instance to avoid conflicts
    const uniqueId = useRef(`liquid-canvas-${Math.random().toString(36).substr(2, 9)}`)

    useEffect(() => {
        if (!canvasRef.current) return

        // Load the script dynamically
        const script = document.createElement("script")
        script.type = "module"

        // We inject the unique ID and image URL directly into the script
        script.textContent = `
      import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';

      const canvas = document.getElementById('${uniqueId.current}');
      if (canvas) {
        // Dispose existing if any stored on canvas
        if (canvas.__liquidApp) canvas.__liquidApp.dispose();

        const app = LiquidBackground(canvas);
        app.loadImage('${imageUrl}');
        app.liquidPlane.material.metalness = 0.6; // Slightly less metal for better cover visibility
        app.liquidPlane.material.roughness = 0.3;
        app.liquidPlane.uniforms.displacementScale.value = ${intensity}; // Adjustable intensity
        app.setRain(false); // User might like rain, but let's keep it clean for cover art
        
        // Store app instance on canvas for cleanup
        canvas.__liquidApp = app;
      }
    `

        document.body.appendChild(script)

        return () => {
            const canvas = document.getElementById(uniqueId.current) as any;
            if (canvas && canvas.__liquidApp) {
                canvas.__liquidApp.dispose();
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }
    }, [imageUrl, intensity]) // Re-run when image changes

    return (
        <div className={cn("w-full h-full overflow-hidden", className)}>
            <canvas
                ref={canvasRef}
                id={uniqueId.current}
                className="w-full h-full object-cover"
            />
        </div>
    )
}

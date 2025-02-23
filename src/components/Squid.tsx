
import { useState, useEffect } from "react";

interface SquidProps {
  isPasswordFocused: boolean;
}

const Squid = ({ isPasswordFocused }: SquidProps) => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const squidElement = document.getElementById('squid-container');
      if (!squidElement) return;

      const squidRect = squidElement.getBoundingClientRect();
      const squidCenterX = squidRect.left + (squidRect.width / 2);
      const squidCenterY = squidRect.top + (squidRect.height / 2);

      // Calculate angle and distance between squid center and mouse
      const deltaX = e.clientX - squidCenterX;
      const deltaY = e.clientY - squidCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Normalize the movement to maximum of 3 pixels
      const maxRadius = 3;
      const normalizedX = (deltaX / distance) * maxRadius;
      const normalizedY = (deltaY / distance) * maxRadius;

      setEyePosition({
        x: Number.isFinite(normalizedX) ? normalizedX : 0,
        y: Number.isFinite(normalizedY) ? normalizedY : 0
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div id="squid-container" className="relative w-20 h-20">
      {/* Squid body */}
      <div className="absolute inset-0 bg-purple-200 rounded-full transform-gpu transition-transform hover:scale-105">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          {/* Tentacles */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-8 bg-purple-200 rounded-full"
              style={{
                position: 'absolute',
                left: `${(i - 2) * 8}px`,
                bottom: '-24px',
                transformOrigin: 'top',
                animation: `wave ${1 + i * 0.1}s ease-in-out infinite alternate`,
                transform: `rotate(${Math.sin((Date.now() + i * 500) / 1000) * 10}deg)`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Eyes */}
      <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-white rounded-full overflow-hidden">
        <div 
          className={`absolute w-2 h-2 bg-black rounded-full transition-all duration-300 ease-in-out`}
          style={{
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px) scaleY(${isPasswordFocused ? 0 : 1})`,
            left: '25%',
            top: '25%'
          }}
        />
      </div>
      <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-white rounded-full overflow-hidden">
        <div 
          className={`absolute w-2 h-2 bg-black rounded-full transition-all duration-300 ease-in-out`}
          style={{
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px) scaleY(${isPasswordFocused ? 0 : 1})`,
            left: '25%',
            top: '25%'
          }}
        />
      </div>
    </div>
  );
};

export default Squid;

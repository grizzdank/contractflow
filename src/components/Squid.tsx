
import { useState, useEffect } from "react";

interface SquidProps {
  isPasswordFocused: boolean;
}

const Squid = ({ isPasswordFocused }: SquidProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const squidElement = document.getElementById('squid-container');
      if (!squidElement) return;

      const squidRect = squidElement.getBoundingClientRect();
      const squidCenterX = squidRect.left + squidRect.width / 2;
      const squidCenterY = squidRect.top + squidRect.height / 2;

      // Calculate angle between squid center and mouse position
      const angle = Math.atan2(e.clientY - squidCenterY, e.clientX - squidCenterX);
      
      // Limit eye movement radius
      const maxRadius = 3;
      const eyeX = Math.cos(angle) * maxRadius;
      const eyeY = Math.sin(angle) * maxRadius;

      setMousePosition({ x: e.clientX, y: e.clientY });
      setEyePosition({ x: eyeX, y: eyeY });
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
              className="w-2 h-8 bg-purple-200 rounded-full animate-wave"
              style={{
                position: 'absolute',
                left: `${(i - 2) * 8}px`,
                bottom: '-24px',
                transformOrigin: 'top',
                animation: `wave ${1 + i * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Eyes */}
      <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-white rounded-full">
        <div 
          className={`absolute w-2 h-2 bg-black rounded-full transition-all duration-300 ${
            isPasswordFocused ? 'scale-y-0' : 'scale-100'
          }`}
          style={{
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
          }}
        />
      </div>
      <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-white rounded-full">
        <div 
          className={`absolute w-2 h-2 bg-black rounded-full transition-all duration-300 ${
            isPasswordFocused ? 'scale-y-0' : 'scale-100'
          }`}
          style={{
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
          }}
        />
      </div>
    </div>
  );
};

export default Squid;

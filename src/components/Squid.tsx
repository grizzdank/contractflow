import { useState, useEffect, useRef } from "react";

interface SquidProps {
  isPasswordFocused: boolean;
  isTyping?: boolean; // New prop to animate squid when typing
  size?: 'sm' | 'md' | 'lg'; // Size options
  color?: string; // Primary color option
}

const Squid = ({ 
  isPasswordFocused, 
  isTyping = false, 
  size = 'md',
  color = 'purple'
}: SquidProps) => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const squidRef = useRef<HTMLDivElement>(null);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Size mappings
  const sizeMap = {
    sm: {
      container: "w-12 h-12",
      eye: "w-2 h-2",
      pupil: "w-1 h-1",
      tentacle: "w-1 h-6"
    },
    md: {
      container: "w-16 h-16",
      eye: "w-3 h-3",
      pupil: "w-1.5 h-1.5",
      tentacle: "w-1.5 h-8"
    },
    lg: {
      container: "w-24 h-24",
      eye: "w-4 h-4",
      pupil: "w-2 h-2",
      tentacle: "w-2 h-12"
    }
  };

  // Color mappings
  const colorMap: Record<string, { body: string, tentacle: string }> = {
    purple: { body: "bg-purple-200", tentacle: "bg-purple-200" },
    blue: { body: "bg-blue-200", tentacle: "bg-blue-200" },
    green: { body: "bg-green-200", tentacle: "bg-green-200" },
    pink: { body: "bg-pink-200", tentacle: "bg-pink-200" },
    teal: { body: "bg-teal-200", tentacle: "bg-teal-200" }
  };

  const bodyColor = colorMap[color]?.body || colorMap.purple.body;
  const tentacleColor = colorMap[color]?.tentacle || colorMap.purple.tentacle;

  // Handle mouse movement to track eyes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!squidRef.current || isPasswordFocused) return;

      const squidRect = squidRef.current.getBoundingClientRect();
      const squidCenterX = squidRect.left + (squidRect.width / 2);
      const squidCenterY = squidRect.top + (squidRect.height / 2);

      const deltaX = e.clientX - squidCenterX;
      const deltaY = e.clientY - squidCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Limit eye movement radius based on size
      const maxRadius = size === 'lg' ? 4 : size === 'md' ? 3 : 2;
      
      // Create a more natural eye movement by adding nonlinearity
      const factor = Math.min(1, distance / 100);
      const normalizedX = (deltaX / Math.max(distance, 1)) * maxRadius * factor;
      const normalizedY = (deltaY / Math.max(distance, 1)) * maxRadius * factor;

      setEyePosition({
        x: Number.isFinite(normalizedX) ? normalizedX : 0,
        y: Number.isFinite(normalizedY) ? normalizedY : 0
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused, size]);

  // Random blinking effect
  useEffect(() => {
    const startBlinkInterval = () => {
      const randomInterval = () => Math.random() * 3000 + 2000; // Random interval between 2-5 seconds
      
      const scheduleNextBlink = () => {
        blinkTimerRef.current = setTimeout(() => {
          if (!isPasswordFocused) {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
          }
          scheduleNextBlink();
        }, randomInterval());
      };
      
      scheduleNextBlink();
    };
    
    startBlinkInterval();
    
    return () => {
      if (blinkTimerRef.current) {
        clearTimeout(blinkTimerRef.current);
      }
    };
  }, [isPasswordFocused]);

  // Tentacle animation based on isTyping
  const getTentacleAnimation = (index: number) => {
    const baseAnimation = `wave ${1 + index * 0.1}s ease-in-out infinite alternate`;
    const typingAnimation = `wiggle ${0.3 + index * 0.05}s ease-in-out infinite`;
    
    return isTyping ? typingAnimation : baseAnimation;
  };

  // Calculate tentacle rotation based on state
  const getTentacleRotation = (index: number) => {
    if (isTyping) {
      // More energetic movement when typing
      return `rotate(${Math.sin((Date.now() + index * 300) / 500) * 15}deg)`;
    } else if (isHovered) {
      // Excited movement when hovered
      return `rotate(${Math.sin((Date.now() + index * 400) / 800) * 12}deg)`;
    } else {
      // Gentle idle movement
      return `rotate(${Math.sin((Date.now() + index * 500) / 1000) * 8}deg)`;
    }
  };

  return (
    <div 
      ref={squidRef} 
      id="squid-container" 
      className={`relative ${sizeMap[size].container} transition-transform ${isTyping ? 'animate-pulse' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Squid body */}
      <div 
        className={`absolute inset-0 ${bodyColor} rounded-full transform-gpu transition-all duration-300 ${isHovered ? 'scale-110' : 'hover:scale-105'}`}
        style={{
          filter: isPasswordFocused ? 'brightness(0.9)' : 'brightness(1)'
        }}
      >
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          {/* Tentacles */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`${tentacleColor} rounded-full ${sizeMap[size].tentacle}`}
              style={{
                position: 'absolute',
                left: `${(i - 2) * (size === 'lg' ? 12 : size === 'md' ? 8 : 6)}px`,
                bottom: size === 'lg' ? '-36px' : size === 'md' ? '-24px' : '-18px',
                transformOrigin: 'top',
                animation: getTentacleAnimation(i),
                transform: getTentacleRotation(i)
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Eyes */}
      <div className={`absolute top-1/3 left-1/4 bg-white rounded-full overflow-hidden ${sizeMap[size].eye}`}>
        <div 
          className={`absolute bg-black rounded-full transition-all duration-300 ease-out ${sizeMap[size].pupil}`}
          style={{
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px) scaleY(${isPasswordFocused ? 0 : isBlinking ? 0.1 : 1})`,
            left: '25%',
            top: '25%'
          }}
        />
      </div>
      <div className={`absolute top-1/3 right-1/4 bg-white rounded-full overflow-hidden ${sizeMap[size].eye}`}>
        <div 
          className={`absolute bg-black rounded-full transition-all duration-300 ease-out ${sizeMap[size].pupil}`}
          style={{
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px) scaleY(${isPasswordFocused ? 0 : isBlinking ? 0.1 : 1})`,
            left: '25%',
            top: '25%'
          }}
        />
      </div>

      {/* Add expression based on state */}
      {isPasswordFocused && (
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-1/3 h-px bg-purple-300 rounded-full">
          {/* Simple flat line for mouth when hiding eyes */}
        </div>
      )}
      
      {!isPasswordFocused && isTyping && (
        <div 
          className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-1/4 h-1 bg-purple-300 rounded-full"
          style={{ animation: 'breathe 0.5s ease-in-out infinite' }}
        >
          {/* Small "o" mouth for typing */}
        </div>
      )}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes wave {
          0% { transform: rotate(-8deg); }
          100% { transform: rotate(8deg); }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        
        @keyframes breathe {
          0%, 100% { transform: translateX(-50%) scaleX(1); }
          50% { transform: translateX(-50%) scaleX(1.5); }
        }
      `}</style>
    </div>
  );
};

export default Squid;
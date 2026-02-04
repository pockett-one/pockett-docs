"use client"

interface BlogCardBackgroundProps {
  className?: string
  seed?: string // For randomization
}

export function BlogCardBackground({ className = '', seed = 'default' }: BlogCardBackgroundProps) {
  // Generate random values based on seed for consistent randomization
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0
  }, 0)
  
  const random1 = Math.abs(Math.sin(hash)) * 100
  const random2 = Math.abs(Math.cos(hash * 2)) * 100
  const random3 = Math.abs(Math.sin(hash * 3)) * 100
  const random4 = Math.abs(Math.cos(hash * 4)) * 100
  
  // Random shape types
  const shapeType = Math.floor(Math.abs(Math.sin(hash)) * 4) // 0, 1, 2, or 3
  
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Background spans whole card */}
      <div className="absolute inset-0 opacity-60">
        {/* Large prominent fluid blob shapes - positioned to be visible in center */}
        <div 
          className="absolute bg-yellow-200/60 rounded-full blur-3xl"
          style={{
            width: `${220 + random1}px`,
            height: `${220 + random1}px`,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${(random3 % 20) - 10}px, ${(random1 % 20) - 10}px)`
          }}
        ></div>
        
        <div 
          className="absolute bg-purple-200/60 rounded-full blur-3xl"
          style={{
            width: `${200 + random2}px`,
            height: `${200 + random2}px`,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${((random1 % 20) - 10) * -1}px, ${(random2 % 20) - 10}px)`
          }}
        ></div>
        
        <div 
          className="absolute bg-blue-200/55 rounded-full blur-2xl"
          style={{
            width: `${180 + random3}px`,
            height: `${180 + random3}px`,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`
          }}
        ></div>
        
        {/* Prominent geometric shapes - centered and focused */}
        {shapeType === 0 && (
          // Triangles - centered
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] opacity-50" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <polygon 
              points={`${50 + random1 % 30},${30 + random2 % 30} ${150 + random2 % 30},${80 + random3 % 30} ${50 + random3 % 30},${130 + random1 % 30}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              className="text-yellow-600"
            />
            <polygon 
              points={`${100 + random2 % 20},${60 + random1 % 20} ${170 + random3 % 20},${100 + random2 % 20} ${100 + random1 % 20},${140 + random3 % 20}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-purple-500"
            />
          </svg>
        )}
        
        {shapeType === 1 && (
          // Hexagons - centered
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] opacity-50" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <polygon 
              points={`${100 + random1 % 20},${20 + random2 % 20} ${180 + random2 % 20},${60 + random3 % 20} ${180 + random3 % 20},${120 + random1 % 20} ${100 + random1 % 20},${160 + random2 % 20} ${20 + random2 % 20},${120 + random3 % 20} ${20 + random3 % 20},${60 + random1 % 20}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              className="text-yellow-600"
            />
            <polygon 
              points={`${50 + random2 % 30},${50 + random1 % 30} ${120 + random3 % 30},${50 + random2 % 30} ${150 + random1 % 30},${100 + random3 % 30} ${120 + random2 % 30},${150 + random1 % 30} ${50 + random3 % 30},${150 + random2 % 30} ${20 + random1 % 30},${100 + random3 % 30}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-blue-500"
            />
          </svg>
        )}
        
        {shapeType === 2 && (
          // Diamonds - centered
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] opacity-50" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <polygon 
              points={`${100 + random2 % 20},${60 + random1 % 20} ${140 + random3 % 20},${100 + random2 % 20} ${100 + random1 % 20},${140 + random3 % 20} ${60 + random3 % 20},${100 + random1 % 20}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              className="text-yellow-600"
            />
            <polygon 
              points={`${80 + random1 % 30},${40 + random2 % 30} ${120 + random3 % 30},${80 + random1 % 30} ${80 + random2 % 30},${120 + random3 % 30} ${40 + random1 % 30},${80 + random2 % 30}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-purple-500"
            />
          </svg>
        )}
        
        {shapeType === 3 && (
          // Waves - centered
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] opacity-50" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
            <path 
              d={`M0,${100 + random1 % 40} Q${100 + random2 % 50},${80 + random3 % 40} ${200 + random1 % 50},${100 + random2 % 40} T${400 + random3 % 50},${100 + random1 % 40}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              className="text-yellow-600"
            />
            <path 
              d={`M0,${120 + random2 % 40} Q${80 + random3 % 50},${140 + random1 % 40} ${160 + random2 % 50},${120 + random3 % 40} T${320 + random1 % 50},${120 + random2 % 40}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-blue-500"
            />
          </svg>
        )}
        
        {/* Grid pattern - spans whole card */}
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>
      </div>
    </div>
  )
}

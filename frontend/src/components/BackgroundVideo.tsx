import React, { useRef, useEffect } from 'react';

export const BackgroundVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.info('Background video playback note:', err);
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      
      {/* Light ambient gradient vignette to ensure crisp contrast for active UI panels */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#F5E9D8]/10 to-[#F5E9D8]/30 pointer-events-none" />
    </div>
  );
};

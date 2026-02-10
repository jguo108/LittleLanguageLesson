import React, { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon, X } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (mounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }
      } catch (err) {
        if (mounted) setError('Unable to access camera. Please allow permissions.');
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageSrc);
      }
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-4">
        <p className="mb-4 text-center">{error}</p>
        <button onClick={onClose} className="px-4 py-2 bg-white text-black rounded-full">
          Close Camera
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay Guides */}
        <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none"></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-white/50 rounded-lg"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-32 bg-black flex items-center justify-between px-8 pb-8 pt-4">
        <button 
          onClick={onClose}
          className="p-3 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          <X size={24} />
        </button>
        
        <button 
          onClick={handleCapture}
          className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/50 transition-all"
        >
          <div className="w-12 h-12 bg-white rounded-full"></div>
        </button>
        
        <div className="w-12"></div> {/* Spacer for symmetry */}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

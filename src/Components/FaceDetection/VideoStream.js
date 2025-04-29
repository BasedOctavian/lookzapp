import { useState, useEffect, useRef } from 'react';

const useVideoStream = () => {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setVideoReady(true);
          videoRef.current.play().catch((err) => {
            setError('Failed to play video');
          });
        };
      }
    } catch (err) {
      setError('Webcam access denied or unavailable');
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    startVideo();
    return () => stopVideo();
  }, []);

  return { videoRef, videoReady, error, retry: startVideo };
};

export default useVideoStream; 
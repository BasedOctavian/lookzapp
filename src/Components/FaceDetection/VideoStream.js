import { useState, useEffect, useRef } from 'react';

const useVideoStream = () => {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      setStream(stream);
      
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
      setError('Webcam or microphone access denied or unavailable');
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startVideo();
    return () => stopVideo();
  }, []);

  return { videoRef, videoReady, error, retry: startVideo, stream };
};

export default useVideoStream; 
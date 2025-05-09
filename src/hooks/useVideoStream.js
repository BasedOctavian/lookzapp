// useVideoStream.js
import { useState, useEffect } from 'react';

export default function useVideoStream() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to access media devices:', err);
        setError(err);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return { stream, error };
}
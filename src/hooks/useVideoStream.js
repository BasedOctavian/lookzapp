// useVideoStream.js
import { useState, useEffect } from 'react';

export default function useVideoStream() {
  const [stream, setStream] = useState(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((mediaStream) => {
        setStream(mediaStream);
      })
      .catch((err) => {
        console.error('Failed to access media devices:', err);
        // Error handling can be expanded here if needed
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return stream;
}
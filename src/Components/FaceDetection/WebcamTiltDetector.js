import React, { useState, useEffect } from 'react';
import { Box, keyframes } from '@chakra-ui/react';
import useFaceDetectionModel from './FaceDetectionModel';
import useVideoStream from './VideoStream';
import useFaceDetectionCanvas from './FaceDetectionCanvas';
import LoadingOverlay from './LoadingOverlay';
import ErrorOverlay from './ErrorOverlay';
import CountdownOverlay from './CountdownOverlay';
import FacePositionGuide from './FacePositionGuide';
import { maleConfig, femaleConfig } from '../hooks/faceRating/configs';

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const WebcamTiltDetector = ({ startScanning, onScanningComplete, onFaceDetected, gender, onReadyToScanChange }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectedTime, setFaceDetectedTime] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [measurements, setMeasurements] = useState(null);

  const { model, loadingProgress, error: modelError, retry: retryModel } = useFaceDetectionModel();
  const { videoRef, videoReady, error: videoError, retry: retryVideo } = useVideoStream();
  const { canvasRef } = useFaceDetectionCanvas({
    model,
    videoRef,
    onFaceDetected: (detected) => {
      setFaceDetected(detected);
      onFaceDetected(detected);
    },
    onMeasurements: setMeasurements
  });

  const config = gender === 'M' ? maleConfig : femaleConfig;

  useEffect(() => {
    onReadyToScanChange(faceDetectedTime >= 3);
  }, [faceDetectedTime, onReadyToScanChange]);

  useEffect(() => {
    if (countdown === 0) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 500);
    }
  }, [countdown]);

  useEffect(() => {
    if (startScanning && !isCollecting) {
      setIsCollecting(true);
      setCountdown(5);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 1000);

      const timer = setTimeout(() => {
        setIsCollecting(false);
        setCountdown(null);
        if (measurements) {
          onScanningComplete(measurements);
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [startScanning, isCollecting, measurements, onScanningComplete]);

  return (
    <Box 
      position="relative" 
      w="100%" 
      h="100%"
      maxW={{ base: '100%', md: '800px' }}
      maxH={{ base: '100%', md: '600px' }}
      mx="auto"
      borderRadius="24px"
      overflow="hidden"
      boxShadow="0 8px 32px rgba(250, 14, 164, 0.3)"
      bg="rgba(13, 17, 44, 0.7)"
      backdropFilter="blur(16px)"
      border="1px solid rgba(250, 14, 164, 0.2)"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 40px rgba(250, 14, 164, 0.4)',
      }}
    >
      {loadingProgress < 100 && <LoadingOverlay loadingProgress={loadingProgress} />}
      {modelError && <ErrorOverlay error={modelError} onRetry={retryModel} />}
      {videoError && <ErrorOverlay error={videoError} onRetry={retryVideo} />}
      
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          filter: loadingProgress < 100 ? 'blur(4px)' : 'none',
          transition: 'filter 0.3s ease-in-out'
        }}
      />
      
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          opacity: faceDetected ? 1 : 0.5,
          transition: 'opacity 0.3s ease-in-out',
          filter: 'drop-shadow(0 0 8px rgba(9, 194, 247, 0.3))'
        }} 
      />
      
      {countdown !== null && <CountdownOverlay countdown={countdown} />}
      
      {showFlash && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="white"
          opacity={0.8}
          transition="opacity 0.5s ease-out"
          zIndex={2}
          animation={`${neonGlow} 2s infinite`}
        />
      )}
      
      {!faceDetected && loadingProgress === 100 && !modelError && !videoError && (
        <FacePositionGuide />
      )}
    </Box>
  );
};

export default WebcamTiltDetector; 
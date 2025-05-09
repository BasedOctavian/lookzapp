const handlePeerData = async (data) => {
  console.log('Received peer data:', data);
  const message = JSON.parse(data);
  if (message.type === 'userInfo') {
    console.log('Received user info:', message);
    setParticipants(prev => {
      const updated = prev.map(p => 
        p.userId === message.userId ? { ...p, displayName: message.displayName } : p
      );
      console.log('Updated participants:', updated);
      return updated;
    });
  } else if (message.type === 'lieResult' && message.questionIndex === currentQuestionIndex) {
    console.log('Received lie result from peer:', message);
    setCurrentQuestionResults(prev => ({
      ...prev,
      [message.userId]: { prediction: message.result.prediction }
    }));

    // If we're the second person and received the first person's result, start our turn
    if (!isFirstPerson && currentSpeakerIndex === 1) {
      // Start the face scanning for the second user
      const canvas = document.querySelector(`#video-element-local-${sessionId}`);
      if (canvas) {
        // Trigger the face scanning to start
        const event = new CustomEvent('startScanning', {
          detail: { sessionId }
        });
        canvas.dispatchEvent(event);
      }
    }
  } else if (message.type === 'gameStart') {
    // ... existing gameStart handling ...
  } else if (message.type === 'gameStartAck') {
    console.log('Received game start acknowledgment');
  } else if (message.type === 'turnTransition') {
    try {
      setCurrentSpeakerIndex(message.currentSpeakerIndex);
      if (message.nextQuestionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(message.nextQuestionIndex);
      }
      // Reset speaking state for the next turn
      setIsSpeaking(false);
    } catch (err) {
      console.error('Error handling turn transition:', err);
    }
  } else if (message.type === 'gameComplete') {
    setIsInRoom(false);
  }
};

// Update the FaceScannerCanvas component to handle the startScanning event
const FaceScannerCanvas = ({ videoId, onScanningComplete, isTurnToSpeak, sessionId }) => {
  // ... existing FaceScannerCanvas code ...

  useEffect(() => {
    const videoElement = document.getElementById(videoId);
    if (!videoElement) return;
    videoRef.current = videoElement;

    const handleVideoLoaded = () => {
      setVideoLoaded(true);
      const stream = videoElement.srcObject;
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const audioStream = new MediaStream([audioTrack]);
          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(audioStream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.3;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      }
    };

    const handleDoneSpeakingEvent = (event) => {
      if (event.detail.sessionId === sessionId) {
        handleDoneSpeaking();
      }
    };

    const handleStartScanningEvent = (event) => {
      if (event.detail.sessionId === sessionId) {
        setIsCollecting(true);
        featureHistoryRef.current = [];
        setSmoothedFeatures({ voiceIntensity: 0, zcr: 0, headMovement: 0, eyeMovement: 0, lipTension: 0 });
        setPrevHeadPosition(null);
        setPrevEyePosition(null);
        setWordCount(0);
        setResponseLength(0);
        setFillerWordCount(0);
        setRepetitionCount(0);
        setPauseCount(0);
        setPauseDuration(0);
        setLastSpeechTime(null);
        setSpeechStartTime(null);
        setSpeechEndTime(null);
        setLastWords([]);
        setConfidenceScore(0);
        if (recognitionRef.current) recognitionRef.current.start();
      }
    };

    videoElement.addEventListener('loadeddata', handleVideoLoaded);
    videoElement.addEventListener('doneSpeaking', handleDoneSpeakingEvent);
    videoElement.addEventListener('startScanning', handleStartScanningEvent);
    if (videoElement.readyState >= 3) handleVideoLoaded();

    return () => {
      videoElement.removeEventListener('loadeddata', handleVideoLoaded);
      videoElement.removeEventListener('doneSpeaking', handleDoneSpeakingEvent);
      videoElement.removeEventListener('startScanning', handleStartScanningEvent);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [videoId, sessionId]);

  // ... rest of FaceScannerCanvas code ...
};

// Update the JSX for the "Done Speaking" button
return (
  // ... existing JSX ...
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
    {gameStarted && isCurrentUserTurn() && !currentQuestionResults[user.uid] && (
      <StyledButton
        onClick={() => {
          const canvas = document.querySelector(`#video-element-local-${sessionId}`);
          if (canvas) {
            const event = new CustomEvent('doneSpeaking', {
              detail: { sessionId }
            });
            canvas.dispatchEvent(event);
          }
        }}
        sx={{
          bgcolor: 'rgba(9, 194, 247, 0.2)',
          color: '#fff',
          '&:hover': {
            bgcolor: 'rgba(9, 194, 247, 0.3)',
          },
          px: 4,
          minWidth: '200px',
          fontSize: '1.2rem',
        }}
      >
        Done Speaking
      </StyledButton>
    )}
    {/* ... rest of buttons ... */}
  </Box>
  // ... rest of JSX ...
);
// ... existing code ... 
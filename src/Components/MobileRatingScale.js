import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
  Divider,
  Paper,
  LinearProgress,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBack, Add, Remove, EmojiEmotions, Face, AccessTime, Style, FitnessCenter } from '@mui/icons-material';
import '../App.css';

// Feature icons mapping
const featureIcons = {
  Eyes: <EmojiEmotions />,
  Smile: <Face />,
  Jawline: <AccessTime />,
  Hair: <Style />,
  Body: <FitnessCenter />
};

const MobileRatingScale = ({ selectedRating, onRate, onCancel }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentRating, setCurrentRating] = useState(selectedRating);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [featurePercentages, setFeaturePercentages] = useState({
    Eyes: 0,
    Smile: 0,
    Jawline: 0,
    Hair: 0,
    Body: 0
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollIntervalRef = useRef(null);
  const [showFeatureHint, setShowFeatureHint] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('MobileRatingScale mounted with rating:', selectedRating);
    setCurrentRating(selectedRating);
    
    // Clean up interval on unmount
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [selectedRating]);

  // Initialize feature percentages
  useEffect(() => {
    // Set initial percentages based on rating
    const basePercentage = currentRating * 10;
    setFeaturePercentages({
      Eyes: basePercentage,
      Smile: basePercentage,
      Jawline: basePercentage,
      Hair: basePercentage,
      Body: basePercentage
    });
  }, [currentRating]);

  // Hide feature hint after 3 seconds
  useEffect(() => {
    if (showFeatureHint) {
      const timer = setTimeout(() => {
        setShowFeatureHint(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showFeatureHint]);

  // Handle touch events for rating adjustment
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    setIsSwipeInProgress(true);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsSwipeInProgress(false);
    
    // Calculate swipe distance
    const deltaX = touchEnd.x - touchStart.x;
    
    // If swipe distance exceeds threshold, adjust rating
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0 && currentRating < 10) {
        // Swipe left - increase rating (INVERTED)
        setCurrentRating(prev => Math.min(prev + 1, 10));
      } else if (deltaX > 0 && currentRating > 1) {
        // Swipe right - decrease rating (INVERTED)
        setCurrentRating(prev => Math.max(prev - 1, 1));
      }
    }
  };

  // Handle feature selection - now only allows selecting the top 3 features
  const handleFeatureSelect = (feature) => {
    setSelectedFeatures(prev => {
      // If feature is already selected, remove it
      if (prev.includes(feature)) {
        return prev.filter(f => f !== feature);
      } 
      // If we already have 3 features selected, remove the first one and add the new one
      else if (prev.length >= 3) {
        return [...prev.slice(1), feature];
      } 
      // Otherwise just add the new feature
      else {
        return [...prev, feature];
      }
    });

    // Update percentages based on selection
    setFeaturePercentages(prev => {
      const newPercentages = { ...prev };
      
      // Reset all percentages to base
      Object.keys(newPercentages).forEach(key => {
        newPercentages[key] = currentRating * 10;
      });
      
      // If feature is being deselected, no need to adjust percentages
      if (selectedFeatures.includes(feature)) {
        return newPercentages;
      }
      
      // Calculate how many features are now selected (including the new one)
      const selectedCount = selectedFeatures.includes(feature) 
        ? selectedFeatures.length - 1 
        : Math.min(selectedFeatures.length + 1, 3);
      
      // If we have selected features, distribute the percentage boost
      if (selectedCount > 0) {
        const boostPerFeature = 70 / selectedCount; // 70% boost divided among selected features
        
        // Apply the boost to selected features
        selectedFeatures.forEach(f => {
          if (f !== feature) { // Don't count the one being toggled
            newPercentages[f] = Math.min(newPercentages[f] + boostPerFeature, 100);
          }
        });
        
        // If we're adding a new feature (not already selected)
        if (!selectedFeatures.includes(feature) && selectedCount < 3) {
          newPercentages[feature] = Math.min(newPercentages[feature] + boostPerFeature, 100);
        }
      }
      
      return newPercentages;
    });
  };

  const playDingSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const startScrollAnimation = () => {
    if (selectedFeatures.length === 0) {
      // Instead of toast, show a visual indicator
      setShowFeatureHint(true);
      return;
    }

    setIsScrolling(true);
    setScrollProgress(0);
    playDingSound();
    
    // Animate scroll progress
    scrollIntervalRef.current = setInterval(() => {
      setScrollProgress(prev => {
        if (prev >= 100) {
          clearInterval(scrollIntervalRef.current);
          setIsScrolling(false);
          // Submit rating after animation completes
          onRate(currentRating, selectedFeatures, featurePercentages);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  // Handle submit
  const handleSubmit = () => {
    if (selectedFeatures.length === 0) {
      // Instead of toast, show a visual indicator
      setShowFeatureHint(true);
      return;
    }

    startScrollAnimation();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: isSmallScreen ? 1.5 : 2,
        bgcolor: 'white',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1000,
        overflowY: 'auto',
        maxHeight: '100vh',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <IconButton
          onClick={onCancel}
          aria-label="Go back"
          size={isSmallScreen ? "small" : "medium"}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant={isSmallScreen ? "h6" : "h5"} fontWeight="bold" fontFamily="Matt Bold">
          Adjust Your Rating
        </Typography>
        <Box sx={{ width: 40 }} /> {/* Spacer for alignment */}
      </Box>
      
      <Divider sx={{ mb: 1.5 }} />
      
      {/* Rating Display with Swipe Instructions */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant={isSmallScreen ? "h3" : "h2"} fontWeight="bold" fontFamily="Matt Bold">
          {currentRating}
        </Typography>
        <Typography variant="body1" color="text.secondary" fontFamily="Matt Light">
          / 10
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Swipe left to increase, right to decrease
        </Typography>
        
        {/* Manual Rating Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1.5 }}>
          <IconButton 
            onClick={() => setCurrentRating(prev => Math.max(prev - 1, 1))}
            disabled={currentRating <= 1}
            color="primary"
            size={isSmallScreen ? "small" : "medium"}
            sx={{ mr: 1.5 }}
          >
            <Remove />
          </IconButton>
          <Typography variant={isSmallScreen ? "h5" : "h6"} fontFamily="Matt Bold">
            {currentRating}
          </Typography>
          <IconButton 
            onClick={() => setCurrentRating(prev => Math.min(prev + 1, 10))}
            disabled={currentRating >= 10}
            color="primary"
            size={isSmallScreen ? "small" : "medium"}
            sx={{ ml: 1.5 }}
          >
            <Add />
          </IconButton>
        </Box>
      </Box>
      
      {/* Feature Selection - Redesigned */}
      <Box sx={{ mb: 2 }}>
        <Typography variant={isSmallScreen ? "subtitle1" : "h6"} fontWeight="bold" mb={1} fontFamily="Matt Bold" textAlign="center">
          Select Top 3 Features
        </Typography>
        
        <Typography variant="body2" color="text.secondary" mb={1.5} textAlign="center" fontFamily="Matt Light">
          Tap on the features that stand out the most (max 3)
        </Typography>
        
        {/* Feature Hint */}
        {showFeatureHint && (
          <Box 
            sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.05)', 
              p: 1, 
              borderRadius: 1, 
              mb: 1.5,
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-in-out'
            }}
          >
            <Typography variant="body2" color="text.secondary" fontFamily="Matt Light">
              Please select at least one feature
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
          {Object.keys(featurePercentages).map((feature) => (
            <Chip
              key={feature}
              icon={featureIcons[feature]}
              label={feature}
              onClick={() => handleFeatureSelect(feature)}
              color={selectedFeatures.includes(feature) ? "primary" : "default"}
              variant={selectedFeatures.includes(feature) ? "filled" : "outlined"}
              size={isSmallScreen ? "small" : "medium"}
              sx={{ 
                m: 0.5,
                py: isSmallScreen ? 0.5 : 1,
                px: isSmallScreen ? 0.5 : 1,
                '& .MuiChip-label': {
                  fontFamily: 'Matt Bold',
                  fontSize: isSmallScreen ? '0.8rem' : '0.9rem'
                },
                '& .MuiChip-icon': {
                  color: selectedFeatures.includes(feature) ? 'white' : 'inherit'
                },
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 1
                }
              }}
            />
          ))}
        </Box>
        
        {/* Selected Features Display */}
        {selectedFeatures.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary" mb={1} fontFamily="Matt Light">
              Selected Features:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
              {selectedFeatures.map((feature, index) => (
                <Chip
                  key={feature}
                  icon={featureIcons[feature]}
                  label={`${index + 1}. ${feature}`}
                  color="primary"
                  size={isSmallScreen ? "small" : "medium"}
                  sx={{ 
                    m: 0.5,
                    '& .MuiChip-label': {
                      fontFamily: 'Matt Bold',
                      fontSize: isSmallScreen ? '0.8rem' : '0.9rem'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Percentage Display - Simplified */}
      {selectedFeatures.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant={isSmallScreen ? "body1" : "subtitle1"} fontWeight="bold" mb={1} fontFamily="Matt Bold" textAlign="center">
            Feature Distribution
          </Typography>
          <Stack spacing={0.5}>
            {selectedFeatures.map((feature) => (
              <Box key={feature}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontFamily="Matt Light">
                    {feature}
                  </Typography>
                  <Typography variant="body2" fontFamily="Matt Bold">
                    {featurePercentages[feature].toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={featurePercentages[feature]} 
                  sx={{ 
                    height: isSmallScreen ? 6 : 8, 
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'primary.main',
                      borderRadius: 4,
                    }
                  }} 
                />
              </Box>
            ))}
          </Stack>
        </Box>
      )}
      
      {/* Scroll Animation */}
      {isScrolling && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 10
        }}>
          <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight="bold" fontFamily="Matt Bold" mb={2}>
            Submitting Rating...
          </Typography>
          <Box sx={{ width: '80%', mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={scrollProgress} 
              sx={{ 
                height: isSmallScreen ? 8 : 10, 
                borderRadius: 5,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                }
              }} 
            />
          </Box>
          <Typography variant="body1" fontFamily="Matt Light">
            {scrollProgress}%
          </Typography>
        </Box>
      )}
      
      {/* Submit Button */}
      <Box sx={{ width: '100%', mb: 2, mt: 'auto' }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={isScrolling}
          size={isSmallScreen ? "small" : "medium"}
          sx={{ 
            py: isSmallScreen ? 1 : 1.5,
            fontFamily: 'Matt Bold',
            '&:hover': { transform: 'scale(1.02)' },
            transition: 'all 0.2s'
          }}
        >
          Submit Rating
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={onCancel}
          disabled={isScrolling}
          size={isSmallScreen ? "small" : "medium"}
          sx={{ mt: 1, py: isSmallScreen ? 1 : 1.5, fontFamily: 'Matt Bold' }}
        >
          Cancel
        </Button>
      </Box>
    </Paper>
  );
};

export default MobileRatingScale; 
import React, { useState } from 'react';
import { Box, Button, Typography, Grid, Slider, Chip, useMediaQuery, useTheme } from '@mui/material';

const RatingScale = ({ onRate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detect mobile screens (<600px)

  // State for selected rating and visibility toggles
  const [selectedRating, setSelectedRating] = useState(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showSliders, setShowSliders] = useState(false);

  // Categories with emojis and gradient colors
  const categories = [
    { category: 'Eyes', emoji: '👀', lightColor: '#AAAAAA', darkColor: '#555555' },
    { category: 'Smile', emoji: '😊', lightColor: '#FFF5F7', darkColor: '#F687B3' },
    { category: 'Jawline', emoji: '🦴', lightColor: '#F5F0FF', darkColor: '#9F7AEA' },
    { category: 'Hair', emoji: '💇', lightColor: '#E6FFFA', darkColor: '#38B2AC' },
    { category: 'Body', emoji: '💪', lightColor: '#FFFAF0', darkColor: '#ED8936' },
  ];

  // Initialize feature percentages equally (100% total)
  const [featurePercentages, setFeaturePercentages] = useState(() => {
    const initialPercentage = 100 / categories.length;
    return categories.reduce((acc, { category }) => {
      acc[category] = initialPercentage;
      return acc;
    }, {});
  });

  // Handle rating number selection
  const handleNumberClick = (rating) => {
    setSelectedRating(rating);
    setShowNumbers(false);
    setShowSliders(true);
  };

  // Handle slider percentage changes, auto-adjusting others to sum to 100%
  const handlePercentageChange = (changedFeature, newValue) => {
    setFeaturePercentages((prev) => {
      const prevTotalExcludingFeature = 100 - prev[changedFeature];
      const newTotalExcludingFeature = 100 - newValue;
      const scaleFactor = prevTotalExcludingFeature > 0 ? newTotalExcludingFeature / prevTotalExcludingFeature : 0;

      const newPercentages = { ...prev };
      for (const feature in prev) {
        if (feature === changedFeature) {
          newPercentages[feature] = newValue;
        } else {
          newPercentages[feature] = prev[feature] * scaleFactor;
        }
      }
      return newPercentages;
    });
  };

  // Calculate total points and check if it matches the selected rating
  const total = categories.reduce((acc, { category }) => acc + (featurePercentages[category] / 100) * selectedRating, 0);
  const isTotalMatching = Math.abs(total - selectedRating) < 0.01;

  return (
    <Box
      p={isMobile ? 2 : 4} // Shrink padding on mobile
      bgcolor="#F5F5F5"
      borderRadius={16}
      boxShadow={3}
      maxWidth={isMobile ? '100%' : 600} // Full width on mobile
      mx="auto"
    >
      {/* Rating Number Selection */}
      {showNumbers && (
        <Box>
          <Typography
            variant={isMobile ? 'h5' : 'h4'} // Smaller title on mobile
            align="center"
            gutterBottom
            color="textPrimary"
          >
            Rate This Appearance
          </Typography>
          <Grid container spacing={isMobile ? 1 : 2} justifyContent="center">
            {[...Array(10)].map((_, i) => (
              <Grid item key={i + 1}>
                <Button
                  variant="contained"
                  size={isMobile ? 'small' : 'large'} // Smaller buttons on mobile
                  onClick={() => handleNumberClick(i + 1)}
                  sx={{
                    width: isMobile ? 48 : 60, // Slightly smaller on mobile
                    height: isMobile ? 48 : 60,
                    borderRadius: '70%',
                    background: 'linear-gradient(to bottom right, #AAAAAA, blue.500)',
                    color: 'white',
                    fontSize: isMobile ? '1.2rem' : '1.5rem', // Slightly smaller font
                    '&:hover': {
                      background: 'linear-gradient(to bottom right, #FFFFFF, blue.700)',
                    },
                  }}
                  aria-label={`Rate ${i + 1}`}
                >
                  {i + 1}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Feature Percentage Sliders */}
      {showSliders && (
        <Box>
          <Typography
            variant={isMobile ? 'h5' : 'h4'} // Smaller title on mobile
            align="center"
            gutterBottom
            color="textPrimary"
          >
            Allocate Your Rating Points
          </Typography>
          {categories.map(({ category, emoji, lightColor, darkColor }) => {
            const gradient = `linear-gradient(to right, ${lightColor} 0%, ${darkColor} 40%, ${darkColor} 100%)`;
            return (
              <Box key={category} mb={isMobile ? 3 : 4}> {/* Slightly less margin on mobile */}
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography
                    variant={isMobile ? 'subtitle1' : 'h6'} // Smaller label on mobile
                    color="textPrimary"
                  >
                    {emoji} {category}
                  </Typography>
                  <Box ml={2}>
                    <Typography variant="body2" color="textSecondary">
                      {featurePercentages[category].toFixed(1)}% (
                      {((featurePercentages[category] / 100) * selectedRating).toFixed(1)} pts)
                    </Typography>
                  </Box>
                </Box>
                <Slider
                  value={featurePercentages[category]}
                  onChange={(e, val) => handlePercentageChange(category, val)}
                  min={0}
                  max={100}
                  step={0.1}
                  aria-label={`Percentage for ${category}`}
                  sx={{
                    '& .MuiSlider-rail': {
                      backgroundColor: 'grey.200',
                      height: isMobile ? 6 : 8, // Thinner rail on mobile
                    },
                    '& .MuiSlider-track': {
                      background: gradient,
                      height: isMobile ? 6 : 8,
                      border: 'none',
                    },
                    '& .MuiSlider-thumb': {
                      width: 2,
                      height: isMobile ? 16 : 20, // Shorter thumb on mobile
                      borderRadius: 0,
                      backgroundColor: 'black',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0px 0px 0px 8px rgba(0, 0, 0, 0.16)',
                      },
                    },
                  }}
                />
              </Box>
            );
          })}

          {/* Total Points and Validation */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={isMobile ? 2 : 4}>
            <Typography
              variant={isMobile ? 'body1' : 'h6'} // Smaller text on mobile
              color={isTotalMatching ? 'success.main' : 'error.main'}
            >
              Total Points: {total.toFixed(2)} / {selectedRating}
            </Typography>
            <Chip
              label={isTotalMatching ? 'Ready to submit' : 'Adjust percentages'}
              color={isTotalMatching ? 'success' : 'error'}
              sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.75rem' : '0.875rem' }} // Smaller chip text
            />
          </Box>

          {/* Submit Button */}
          <Button
            variant="contained"
            fullWidth
            size={isMobile ? 'medium' : 'large'} // Smaller button on mobile
            onClick={() => {
              const featureScores = {};
              for (const feature in featurePercentages) {
                featureScores[feature] = (featurePercentages[feature] / 100) * selectedRating;
              }
              onRate(selectedRating, featureScores);
            }}
            disabled={!isTotalMatching}
            sx={{
              mt: isMobile ? 2 : 4, // Less margin on mobile
              background: 'linear-gradient(to right, #AAAAAA, blue.500)',
              color: 'white',
              fontSize: isMobile ? '1rem' : '1.2rem', // Smaller font
              '&:hover': {
                background: 'linear-gradient(to right, #FFFFFF, blue.700)',
              },
              '&:disabled': {
                background: 'grey.400',
              },
            }}
          >
            Submit Final Rating
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RatingScale;
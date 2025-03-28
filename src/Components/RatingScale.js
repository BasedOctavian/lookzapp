import React, { useState } from 'react';
import { Box, Button, Typography, Grid, Slider, Chip, useMediaQuery, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

const RatingScale = ({ onRate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State management
  const [selectedRating, setSelectedRating] = useState(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showSliders, setShowSliders] = useState(false);

  // Categories with emojis and colors
  const categories = [
    { category: 'Eyes', emoji: '👀', lightColor: '#AAAAAA', darkColor: '#555555' },
    { category: 'Smile', emoji: '😊', lightColor: '#FFF5F7', darkColor: '#F687B3' },
    { category: 'Jawline', emoji: '🦴', lightColor: '#F5F0FF', darkColor: '#9F7AEA' },
    { category: 'Hair', emoji: '💇', lightColor: '#E6FFFA', darkColor: '#38B2AC' },
    { category: 'Body', emoji: '💪', lightColor: '#FFFAF0', darkColor: '#ED8936' },
  ];

  // Initialize feature percentages
  const [featurePercentages, setFeaturePercentages] = useState(() => {
    const initialPercentage = 100 / categories.length;
    return categories.reduce((acc, { category }) => {
      acc[category] = initialPercentage;
      return acc;
    }, {});
  });

  // Handle rating selection
  const handleNumberClick = (rating) => {
    setSelectedRating(rating);
    setShowNumbers(false);
    setShowSliders(true);
  };

  // Handle percentage changes
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

  // Calculate total and validation
  const total = categories.reduce((acc, { category }) => acc + (featurePercentages[category] / 100) * selectedRating, 0);
  const isTotalMatching = Math.abs(total - selectedRating) < 0.01;

  return (
    <Box
      p={isMobile ? 2 : 4}
      bgcolor="#F5F5F5"
      borderRadius={16}
      boxShadow={3}
      maxWidth={isMobile ? '100%' : 600}
      mx="auto"
    >
      {/* Rating Number Selection */}
      {showNumbers && (
        <Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} align="center" gutterBottom color="textPrimary">
            Rate This Appearance
          </Typography>
          <Grid container spacing={isMobile ? 1 : 2} justifyContent="center">
            {[...Array(10)].map((_, i) => (
              <Grid item key={i + 1}>
                <Button
                  variant="contained"
                  size={isMobile ? 'small' : 'large'}
                  onClick={() => handleNumberClick(i + 1)}
                  sx={{
                    width: isMobile ? 50 : 60,
                    height: isMobile ? 50 : 60,
                    borderRadius: '50%',
                    backgroundColor: 'grey.300',
                    color: 'grey.800',
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    '&:hover': {
                      backgroundColor: 'grey.400',
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
          <Typography variant={isMobile ? 'h5' : 'h4'} align="center" gutterBottom color="textPrimary">
            Allocate Your Rating Points
          </Typography>
          {categories.map(({ category, emoji, darkColor }) => (
            <Box key={category} mb={isMobile ? 3 : 4}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} color="textPrimary">
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
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                sx={{
                  '& .MuiSlider-rail': {
                    backgroundColor: '#F0F0F0',
                    height: isMobile ? 6 : 8,
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: darkColor,
                    height: isMobile ? 6 : 8,
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                    backgroundColor: darkColor,
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(0, 0, 0, 0.16)',
                    },
                  },
                }}
              />
            </Box>
          ))}

          {/* Total Points and Validation */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={isMobile ? 2 : 4}>
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              color={isTotalMatching ? 'success.main' : 'error.main'}
            >
              Total Points: {total.toFixed(2)} / {selectedRating}
            </Typography>
            <Chip
              icon={isTotalMatching ? <CheckCircleIcon /> : <WarningIcon />}
              label={isTotalMatching ? 'Ready to submit' : 'Adjust percentages'}
              color={isTotalMatching ? 'success' : 'error'}
              sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            />
          </Box>

          {/* Submit Button */}
          <Button
            variant="contained"
            fullWidth
            size={isMobile ? 'medium' : 'large'}
            onClick={() => {
              const featureScores = {};
              for (const feature in featurePercentages) {
                featureScores[feature] = (featurePercentages[feature] / 100) * selectedRating;
              }
              onRate(selectedRating, featureScores);
            }}
            disabled={!isTotalMatching}
            sx={{
              mt: isMobile ? 2 : 4,
              background: 'linear-gradient(to right, #AAAAAA, blue.500)',
              color: 'white',
              fontSize: isMobile ? '1rem' : '1.2rem',
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
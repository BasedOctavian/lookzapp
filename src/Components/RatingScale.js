import React, { useState } from 'react';
import { Box, Button, Typography, Grid, Slider, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import '../App.css'; 

// Subcomponent: RatingButton
// Displays a circular button for selecting a rating number
const RatingButton = ({ rating, onClick }) => (
  <Button
    variant="contained"
    size="medium"
    onClick={() => onClick(rating)}
    sx={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      backgroundColor: '#e0e0e0', // Hardcoded grey
      color: '#424242', // Dark grey text
      fontSize: '1.2rem',
      '&:hover': { backgroundColor: '#bdbdbd' },
      fontFamily: 'Matt Italic', // Lighter grey on hover
    }}
    aria-label={`Rate ${rating}`}
  >
    {rating}
  </Button>
);

// Subcomponent: CategorySlider
// Displays a slider for adjusting category percentages
const CategorySlider = ({ category, emoji, color, percentage, onChange, selectedRating }) => (
  <Box mb={4}>
    <Box display="flex" alignItems="center" mb={1}>
      <Typography variant="h6" color="textPrimary" fontFamily={'Matt Bold'}>
        {emoji} {category}
      </Typography>
      <Box ml={2}>
        <Typography variant="body2" color="textSecondary" fontFamily={'Matt Light'}>
          {percentage.toFixed(1)}% ({((percentage / 100) * selectedRating).toFixed(1)} pts)
        </Typography>
      </Box>
    </Box>
    <Slider
      value={percentage}
      onChange={(e, val) => onChange(val)}
      min={0}
      max={100}
      step={0.1}
      aria-label={`Percentage for ${category}`}
      valueLabelDisplay="auto"
      valueLabelFormat={(value) => `${value.toFixed(1)}%`}
      sx={{
        '& .MuiSlider-rail': { backgroundColor: '#F0F0F0', height: 8 },
        '& .MuiSlider-track': { backgroundColor: color, height: 8, border: 'none' },
        '& .MuiSlider-thumb': {
          width: 20,
          height: 20,
          backgroundColor: color,
          '&:hover, &.Mui-focusVisible': { boxShadow: '0px 0px 0px 8px rgba(0, 0, 0, 0.16)' },
        },
      }}
    />
  </Box>
);

// Subcomponent: TotalDisplay
// Shows the total points and validation status
const TotalDisplay = ({ total, selectedRating }) => {
  const isMatching = Math.abs(total - selectedRating) < 0.01;
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
      <Typography variant="h6" style={{ color: isMatching ? 'black' : '#f44336' }} fontFamily={'Matt Bold'}>
        Total Points: {total.toFixed(2)} / {selectedRating}
      </Typography>
      <Chip
        icon={isMatching ? <CheckCircleIcon /> : <WarningIcon />}
        label={isMatching ? 'Ready to submit' : 'Adjust percentages'}
        style={{
          backgroundColor: isMatching ? '#4caf50' : '#f44336', // Green or red
          color: '#ffffff', // White text
          fontWeight: 'bold',
          fontFamily: 'Matt Bold',
        }}
      />
    </Box>
  );
};

// Main Component: RatingScale
const RatingScale = ({ onRate }) => {
  // State management
  const [selectedRating, setSelectedRating] = useState(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showSliders, setShowSliders] = useState(false);
  const [featurePercentages, setFeaturePercentages] = useState({});

  // Category data with hardcoded colors
  const categories = [
    { category: 'Eyes', emoji: '👀', lightColor: '#AAAAAA', darkColor: '#555555' },
    { category: 'Smile', emoji: '😊', lightColor: '#FFF5F7', darkColor: '#F687B3' },
    { category: 'Jawline', emoji: '🦴', lightColor: '#F5F0FF', darkColor: '#9F7AEA' },
    { category: 'Hair', emoji: '💇', lightColor: '#E6FFFA', darkColor: '#38B2AC' },
    { category: 'Body', emoji: '💪', lightColor: '#FFFAF0', darkColor: '#ED8936' },
  ];

  // Handle rating selection
  const handleNumberClick = (rating) => {
    setSelectedRating(rating);
    setShowNumbers(false);
    setShowSliders(true);
    const initialPercentage = 100 / categories.length;
    const newPercentages = categories.reduce((acc, { category }) => {
      acc[category] = initialPercentage;
      return acc;
    }, {});
    setFeaturePercentages(newPercentages);
  };

  // Handle percentage adjustments
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

  // Calculate total points
  const total = categories.reduce((acc, { category }) => acc + (featurePercentages[category] / 100) * (selectedRating || 0), 0);
  const isTotalMatching = selectedRating !== null && Math.abs(total - selectedRating) < 0.01;

  return (
    <Box
      p={2} // Fixed padding
      bgcolor="#F5F5F5" // Light grey background
      borderRadius={16}
      boxShadow={3}
      maxWidth={600} // Fixed max width
      mx="auto"
    >
      {/* Rating selection screen */}
      {showNumbers && (
        <Box>
          <Typography variant="h5" align="center" gutterBottom color="textPrimary" fontFamily={'Matt Bold'}>
            Rate This Appearance
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom fontFamily={'Matt Light'}>
            Select a rating from 1 to 10
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {[...Array(10)].map((_, i) => (
              <Grid item key={i + 1}>
                <RatingButton rating={i + 1} onClick={handleNumberClick} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Percentage allocation screen */}
      {showSliders && (
        <Box>
          <Typography
            variant="h6" // Changed from h5 to h6
            align="center"
            gutterBottom
            color="textPrimary"
            fontFamily={'Matt Bold'}
            sx={{ marginBottom: '8px' }} // Reduced bottom margin
          >
            Allocate Your Rating Points
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom fontFamily={'Matt Light'}>
            Adjust the percentages for each category. The total points should match your selected rating.
          </Typography>
          {categories.map(({ category, emoji, darkColor }) => (
            <CategorySlider
              key={category}
              category={category}
              emoji={emoji}
              color={darkColor}
              percentage={featurePercentages[category]}
              onChange={(val) => handlePercentageChange(category, val)}
              selectedRating={selectedRating}
            />
          ))}
          <TotalDisplay total={total} selectedRating={selectedRating} />
          <Button
            variant="outlined"
            onClick={() => {
              setSelectedRating(null);
              setShowNumbers(true);
              setShowSliders(false);
            }}
            sx={{ mt: 2, mb: 2, color: '#424242', fontFamily: 'Matt Light' }}
          >
            Change Rating
          </Button>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => {
              const featureScores = {};
              for (const feature in featurePercentages) {
                featureScores[feature] = (featurePercentages[feature] / 100) * selectedRating;
              }
              onRate(selectedRating, featureScores);
            }}
            disabled={!isTotalMatching}
            sx={{
              background: 'black', // Hardcoded gradient
              color: '#ffffff',
              fontFamily: 'Matt Bold', // White text
              fontSize: '1.2rem',
              '&:hover': {
                background: 'black', // Hover gradient
              },
              '&:disabled': { background: '#bdbdbd' }, // Disabled grey
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

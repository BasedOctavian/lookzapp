import React from 'react';
import { Box, Typography } from '@mui/material';
import { LinearProgress } from '@mui/material';
import { useUserData } from '../../hooks/useUserData';

function DailyRatingProgress() {
  const { userData, loading } = useUserData();

  // Handle loading state
  if (loading) {
    return <Typography sx={{ color: '#4A5568' }}>Loading your rating progress...</Typography>;
  }

  // Handle case where user data is unavailable
  if (!userData) {
    return <Typography sx={{ color: '#4A5568' }}>User data not available.</Typography>;
  }

  // Get today's date in "YYYY-MM-DD" format (assuming this matches Firestore storage)
  const today = new Date().toISOString().split('T')[0];

  // Safely access dailyTimesGiven, defaulting to no ratings if absent
  const dailyTimesGiven = userData.dailyTimesGiven || { date: '', count: 0 };
  const isToday = true;

  const count = isToday ? dailyTimesGiven.count : 0;

  // Calculate progress (percentage out of 5 ratings)
  const progress = Math.min((count / 5) * 100, 100);
  const remaining = 5 - count;

  return (
    <Box
      sx={{
        padding: 3,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <Typography
        variant="h6"
        component="div"
        sx={{ fontWeight: 'bold', marginBottom: 1, color: '#1A202C' }}
      >
        Daily Rating Progress
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 16,
          borderRadius: 4,
          backgroundColor: 'blue.100', // Chakra's green.100
          '& .MuiLinearProgress-bar': {
            backgroundColor: 'blue.500', // Chakra's green.500
          },
        }}
      />
      <Typography variant="body1" sx={{ marginTop: 1, color: '#4A5568' }}>
        {count >= 5
          ? 'You are eligible for the get ranked pool!'
          : `Rate ${remaining} more ${remaining === 1 ? 'person' : 'people'} today to be eligible for the get ranked pool.`}
      </Typography>
    </Box>
  );
}

export default DailyRatingProgress;
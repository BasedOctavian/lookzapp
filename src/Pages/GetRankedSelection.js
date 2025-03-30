import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Grid, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { blue, green, purple, orange } from '@mui/material/colors';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import '../App.css'; 

// Categories with keys, titles, descriptions, colors, and emojis
const categories = [
  {
    key: 'other-users',
    title: 'Other Users',
    description: 'Compete against other users like you.',
    color: blue[500],
    emojis: '👥',
  },
  {
    key: 'influencers',
    title: 'Influencers',
    description: 'See how you rank against popular influencers.',
    color: green[500],
    emojis: '📢',
  },
  {
    key: 'celebs',
    title: 'Celebs',
    description: 'Compare yourself to celebrities.',
    color: purple[500],
    emojis: '🎬',
  },
  {
    key: 'all',
    title: 'All Categories',
    description: 'Rank against everyone.',
    color: orange[500],
    emojis: '⭐',
  },
];

function GetRankedSelection() {
  const navigate = useNavigate();

  const handleSelection = (category) => {
    navigate(`/ranking?category=${category}`);
  };

  return (
    <>
      <TopBar />
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, width: '100%', maxWidth: 'lg' }}>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            color="primary"
            gutterBottom
            sx={{ fontWeight: 700 }} 
            fontFamily={'Matt Bold'}// Makes "Get Ranked" bolder and thicker
          >
            Get Ranked
          </Typography>
          <Typography variant="subtitle1" align="center" fontFamily={'Matt Bold'} color="text.secondary" paragraph>
            Choose who you want to be ranked against:
          </Typography>
          <Grid container spacing={2} justifyContent="center" alignItems="stretch">
            {categories.map((category) => (
              <Grid item xs={12} sm={6} md={3} key={category.key}>
                <Card
                  sx={{
                    height: '100%', // Ensures card fills the grid item height
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'scale(1.05)' },
                    bgcolor: category.color,
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelection(category.key)}
                    sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} // Flex column to distribute space
                  >
                    {/* Emojis at the top replacing the image */}
                    <Box
                      sx={{
                        height: 200, // Fixed height for consistency
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: category.color,
                      }}
                    >
                      <Typography variant="h1" sx={{ color: 'white' }}>
                        {category.emojis}
                      </Typography>
                    </Box>
                    {/* Title and Description below */}
                    <CardContent
                      sx={{ color: 'white', textAlign: 'center', flexGrow: 1 }} // Expands to fill remaining space
                    >
                      <Typography 
                      variant="h6" component="div" sx={{ fontFamily: 'Matt Bold' }}>
                        {category.title}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'Matt Light' }}>
                        {category.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
      <Footer />
    </>
  );
}

export default GetRankedSelection;
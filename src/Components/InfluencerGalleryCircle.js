import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import PhotoLibrary from '@mui/icons-material/PhotoLibrary';

const InfluencerGalleryCircle = ({ name }) => {
  // Handle click to open Google Images search in a new tab
  const handleClick = () => {
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 4,
        right: 4,
      }}
    >
      <Tooltip title={`Search images for ${name}`}>
        <IconButton
          onClick={handleClick}
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: 'rgb(0, 0, 0)',
            '&:hover': {
              bgcolor: 'rgba(49, 49, 49, 0.9)',
            },
          }}
        >
          <PhotoLibrary sx={{ fontSize: 16, color: 'white' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default InfluencerGalleryCircle;
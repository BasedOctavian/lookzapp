import React, { useRef } from 'react';
import { Box, Button, Dialog, DialogContent, IconButton, Typography, DialogActions } from '@mui/material';
import { Close, Download } from '@mui/icons-material';
import ShareableRatingCard from './ShareableRatingCard';
import html2canvas from 'html2canvas';
import { useUserDocument } from '../hooks/useUserDocument';
import { useAuth } from '../hooks/useAuth';

// Custom X logo component
const XLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="currentColor"
    />
  </svg>
);

const ShareRatingCard = ({ userInfo, rating, testScores, open, onClose }) => {
  const cardRef = useRef(null);
  const { user } = useAuth();
  const { userDoc, loading, error } = useUserDocument(user?.uid);

  // Combine userInfo with userDoc data when available
  const combinedUserInfo = {
    ...userInfo,
    ...(userDoc && {
      displayName: userDoc.displayName || userInfo?.displayName,
      profilePicture: userDoc.profilePicture || userInfo?.profilePicture,
      gender: userDoc.gender || userInfo?.gender,
      ethnicity: userDoc.ethnicity || userInfo?.ethnicity,
      eyeColor: userDoc.eyeColor || userInfo?.eyeColor,
      height: userDoc.height || userInfo?.height,
      weight: userDoc.weight || userInfo?.weight
    })
  };

  const handleDownload = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          backgroundColor: null,
          logging: false,
          useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `lookzapp-rating-${combinedUserInfo?.displayName || 'anonymous'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Error generating image:', error);
      }
    }
  };

  const handleTwitterShare = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          backgroundColor: null,
          logging: false,
          useCORS: true
        });
        
        // First download the image
        const link = document.createElement('a');
        link.download = `lookzapp-rating-${combinedUserInfo?.displayName || 'anonymous'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Then open X with pre-filled text
        const text = `I scored ${rating.toFixed(1)}/100 on the Lookzapp attractiveness test! Check it out at lookzapp.com\n\n#LookzApp`;
        const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');

        // Show a toast notification or alert to guide the user
        alert('Your rating card has been downloaded. Please upload it to your X post!');
      } catch (error) {
        console.error('Error sharing to X:', error);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onBackdropClick={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          maxWidth: '100%',
          width: '100%'
        }
      }}
    >
      <DialogContent sx={{ 
        p: 0, 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        gap: 3
      }}>
        <Box ref={cardRef} sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          mb: 2
        }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: -20,
              top: -20,
              color: '#fff',
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)'
              },
              width: 40,
              height: 40
            }}
          >
            <Close />
          </IconButton>
          <ShareableRatingCard
            userInfo={combinedUserInfo}
            rating={rating}
            testScores={testScores}
          />
        </Box>

        <DialogActions sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center',
          mt: 2,
          position: 'absolute',
          bottom: 20,
          width: '100%'
        }}>
          <Button
            variant="contained"
            startIcon={<XLogo />}
            onClick={handleTwitterShare}
            sx={{
              background: '#000000',
              '&:hover': {
                background: '#1a1a1a'
              }
            }}
          >
            Share on X
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownload}
            sx={{
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': {
                borderColor: '#fff',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Download
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRatingCard; 
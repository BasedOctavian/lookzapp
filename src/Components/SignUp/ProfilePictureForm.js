import React, { useState, useRef } from 'react';
import {
  Stack,
  FormControl,
  FormLabel,
  Button,
  FormHelperText,
  Typography,
  CircularProgress,
} from '@mui/material';
import exif from 'exif-js';

function ProfilePictureForm({
  model,
  onProfilePictureChange,
  showSnackbar,
  onPrev,
  onSubmit,
  isLoading,
  profilePictureFile,
}) {
  const [isDetecting, setIsDetecting] = useState(false);
  const canvasRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      showSnackbar('No file selected', 'error');
      return;
    }
    if (!model) {
      console.error('Model is not loaded');
      showSnackbar('Face detection model is not available', 'error');
      return;
    }

    setIsDetecting(true);

    try {
      // Load the image
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      // Get EXIF orientation
      const orientation = await new Promise((resolve) => {
        exif.getData(file, function () {
          const orient = exif.getTag(this, 'Orientation') || 1; // Default to 1 if not found
          resolve(orient);
        });
      });
      console.log('EXIF Orientation:', orientation);

      // Set up canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const maxDimension = 640;
      let width = image.width;
      let height = image.height;

      // Resize image
      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }
      canvas.width = width;
      canvas.height = height;
      console.log('Resized dimensions:', { width, height });

      // Adjust canvas for EXIF orientation
      switch (orientation) {
        case 2: // Flip horizontally
          ctx.transform(-1, 0, 0, 1, width, 0);
          break;
        case 3: // Rotate 180°
          ctx.transform(-1, 0, 0, -1, width, height);
          break;
        case 4: // Flip vertically
          ctx.transform(1, 0, 0, -1, 0, height);
          break;
        case 5: // Rotate 90° CW + Flip vertically
          canvas.width = height;
          canvas.height = width;
          ctx.transform(0, 1, 1, 0, 0, 0);
          break;
        case 6: // Rotate 90° CW
          canvas.width = height;
          canvas.height = width;
          ctx.transform(0, 1, -1, 0, height, 0);
          break;
        case 7: // Rotate 90° CCW + Flip vertically
          canvas.width = height;
          canvas.height = width;
          ctx.transform(0, -1, -1, 0, height, width);
          break;
        case 8: // Rotate 90° CCW
          canvas.width = height;
          canvas.height = width;
          ctx.transform(0, -1, 1, 0, 0, width);
          break;
        default: // Orientation 1 or undefined
          break;
      }

      // Draw the image
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      console.log('Image drawn on canvas');

      // Perform face detection
      const predictions = await model.estimateFaces(canvas);
      console.log('Face detection predictions:', predictions);

      if (predictions.length > 0) {
        onProfilePictureChange(file);
        showSnackbar('Face detected, picture accepted', 'success');
      } else {
        showSnackbar('No face detected, please upload a different picture', 'error');
      }
    } catch (error) {
      console.error('Error in face detection process:', error);
      showSnackbar(`Error detecting face: ${error.message}`, 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <FormControl>
        <FormLabel>Profile Picture (optional)</FormLabel>
        <Button variant="outlined" component="label">
          Upload Profile Picture
          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
        </Button>
        <FormHelperText>
          Please upload a picture with a clearly detectable face.
        </FormHelperText>
        {isDetecting && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Detecting face...</Typography>
          </Stack>
        )}
        {profilePictureFile && (
          <Typography color="green">Face detected, picture accepted</Typography>
        )}
      </FormControl>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          fullWidth
          onClick={onPrev}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={onSubmit}
          disabled={isLoading || isDetecting}
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </Button>
      </Stack>
    </Stack>
  );
}

export default ProfilePictureForm;
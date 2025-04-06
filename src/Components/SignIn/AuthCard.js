import React from 'react';
import { Paper, Stack, Typography, Link } from '@mui/material';

function AuthCard({ title, form, linkText, linkHref, linkLabel }) {
  return (
    <Paper elevation={3} sx={{ padding: 4, width: { xs: '90%', md: '400px' } }}>
      <Stack spacing={3}>
        <Typography variant="h5" align="center" color="primary">
          {title}
        </Typography>
        {form}
        <Typography align="center" color="textSecondary">
          {linkText}{' '}
          <Link href={linkHref} underline="hover">
            {linkLabel}
          </Link>
        </Typography>
      </Stack>
    </Paper>
  );
}

export default AuthCard;
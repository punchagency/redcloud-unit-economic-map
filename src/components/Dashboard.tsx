import { Box, Container, Typography } from '@mui/material';
import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Box>
        <Typography variant="body1">Dashboard content goes here</Typography>
      </Box>
    </Container>
  );
};

export default Dashboard;
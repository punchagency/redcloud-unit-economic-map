import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DetailedInsights: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { region } = location.state || {};

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Detailed Insights
      </Typography>
      <Typography variant="subtitle1">Region: {region}</Typography>
      <Box>
        <Typography variant="body1">Detailed insights data for {region}</Typography>
      </Box>
      <Button variant="contained" onClick={() => navigate('/map')}>
        Back to Map
      </Button>
      <Button variant="contained" onClick={() => navigate('/')}>
        Back to Home
      </Button>
    </Container>
  );
};

export default DetailedInsights;
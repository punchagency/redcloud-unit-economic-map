import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleFilter = (filter: string) => {
    navigate('/map', { state: { filter } });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Home
      </Typography>
      <Box>
        <Button variant="contained" onClick={() => handleFilter('City A')}>
          Filter by City A
        </Button>
        <Button variant="contained" onClick={() => handleFilter('City B')}>
          Filter by City B
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
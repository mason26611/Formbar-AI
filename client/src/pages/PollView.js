import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend);

const PollView = () => {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPoll();
    const socket = io('http://localhost:5000');

    socket.on('newAnswer', (data) => {
      if (data.pollId === pollId) {
        fetchPoll();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/polls/${pollId}`);
      setPoll(response.data);
      setLoading(false);

      // Check if user has already responded
      const userResponse = response.data.responses.find(
        (response) => response.student._id === user.id
      );
      if (userResponse) {
        setSelectedOption(userResponse.optionIndex);
      }
    } catch (error) {
      setError('Error fetching poll');
      setLoading(false);
    }
  };

  const handleSubmit = async (optionIndex) => {
    try {
      await axios.post(`http://localhost:5000/api/polls/${pollId}/respond`, {
        optionIndex,
      });
      setSelectedOption(optionIndex);
    } catch (error) {
      setError('Error submitting response');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const chartData = {
    labels: poll.options.map((option) => option.text),
    datasets: [
      {
        data: poll.options.map((option) => option.votes),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {poll.question}
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            {poll.isActive ? 'Poll is active' : 'Poll is closed'}
          </Typography>

          <Box sx={{ mt: 4, mb: 4 }}>
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </Box>

          {poll.isActive && selectedOption === null && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Select your answer:
              </Typography>
              {poll.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 2 }}
                  onClick={() => handleSubmit(index)}
                >
                  {option.text}
                </Button>
              ))}
            </Box>
          )}

          {selectedOption !== null && (
            <Alert severity="success" sx={{ mt: 2 }}>
              You have selected: {poll.options[selectedOption].text}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PollView; 
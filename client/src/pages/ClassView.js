import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Grid,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ClassView = () => {
  const { classId } = useParams();
  const [class_, setClass] = useState(null);
  const [polls, setPolls] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchClassData = useCallback(async () => {
    try {
      const [classResponse, pollsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/classes/${classId}`),
        axios.get(`http://localhost:5000/api/polls/class/${classId}`),
      ]);
      setClass(classResponse.data);
      setPolls(pollsResponse.data);
    } catch (error) {
      console.error('Error fetching class data:', error);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const handleCreatePoll = async () => {
    try {
      await axios.post('http://localhost:5000/api/polls', {
        question: newPoll.question,
        options: newPoll.options.filter(option => option.trim() !== ''),
        classId,
      });
      setOpenDialog(false);
      setNewPoll({ question: '', options: ['', ''] });
      fetchClassData();
    } catch (error) {
      console.error('Error creating poll:', error);
    }
  };

  const handleTogglePoll = async (pollId, isActive) => {
    try {
      await axios.patch(`http://localhost:5000/api/polls/${pollId}/toggle`);
      fetchClassData();
    } catch (error) {
      console.error('Error toggling poll:', error);
    }
  };

  const addOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, ''],
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({
      ...newPoll,
      options: newOptions,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {class_ && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {class_.name}
          </Typography>
          <Typography color="textSecondary">
            Class Code: {class_.code}
          </Typography>
        </Box>
      )}

      {user.role !== 'student' && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ mb: 4 }}
        >
          Create Poll
        </Button>
      )}

      <Grid container spacing={3}>
        {polls.map((poll) => (
          <Grid item xs={12} md={6} key={poll._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{poll.question}</Typography>
                  {user.role !== 'student' && (
                    <IconButton
                      onClick={() => handleTogglePoll(poll._id, poll.isActive)}
                      color={poll.isActive ? 'primary' : 'default'}
                    >
                      {poll.isActive ? <StopIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/poll/${poll._id}`)}
                >
                  View Poll
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Poll</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Question"
            fullWidth
            value={newPoll.question}
            onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
          />
          {newPoll.options.map((option, index) => (
            <TextField
              key={index}
              margin="dense"
              label={`Option ${index + 1}`}
              fullWidth
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
            />
          ))}
          <Button onClick={addOption} sx={{ mt: 1 }}>
            Add Option
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePoll} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassView; 
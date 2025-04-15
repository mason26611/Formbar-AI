import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  School as SchoolIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
    navigate('/login');
  };

  return (
    <AppBar 
      position="static" 
      elevation={0} 
      sx={{ 
        bgcolor: 'transparent',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <SchoolIcon sx={{ 
            mr: 1, 
            color: '#fff',
            fontSize: 32
          }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: '#fff',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            Formbar
          </Typography>
        </Box>

        {!user ? (
          <Box>
            <Button
              color="primary"
              component={RouterLink}
              to="/login"
              sx={{ 
                mr: 1,
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              component={RouterLink}
              to="/register"
              sx={{
                background: 'linear-gradient(45deg, #8E2DE2, #4A00E0)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #7B1FA2, #3F51B5)',
                }
              }}
            >
              Register
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile ? (
              <IconButton
                size="large"
                edge="end"
                onClick={handleMenu}
                sx={{
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <IconButton
                size="large"
                edge="end"
                onClick={handleMenu}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    background: 'linear-gradient(45deg, #8E2DE2, #4A00E0)',
                  }}
                >
                  {user.name?.[0]}
                </Avatar>
              </IconButton>
            )}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                }
              }}
            >
              <MenuItem 
                onClick={() => { handleClose(); navigate('/dashboard'); }}
                sx={{
                  color: '#8E2DE2',
                  '&:hover': {
                    backgroundColor: 'rgba(142, 45, 226, 0.08)',
                  }
                }}
              >
                Dashboard
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  color: '#8E2DE2',
                  '&:hover': {
                    backgroundColor: 'rgba(142, 45, 226, 0.08)',
                  }
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 
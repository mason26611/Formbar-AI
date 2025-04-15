# FormBar - Educational Polling Tool

FormBar is a real-time educational polling tool that allows teachers to create and manage polls for their classes. Students can respond to polls in real-time, and results are displayed using an interactive virtual bar visualization.

## Features

- User authentication with role-based access (Manager, Teacher, Student)
- Real-time polling using WebSockets
- Interactive virtual bar visualization of poll results
- Class management system
- Poll creation and management
- Real-time updates of poll responses

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd formbar
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
```

4. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/formbar
JWT_SECRET=your-secret-key-here
```

## Running the Application

1. Start the MongoDB server

2. Start the backend server:
```bash
npm run dev
```

3. In a new terminal, start the frontend development server:
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

1. Register a new account (the first account will automatically be a manager)
2. Login to the application
3. Create a class (if you're a teacher or manager)
4. Share the class code with students
5. Create polls in your class
6. Students can join the class using the class code and respond to polls
7. View real-time results in the virtual bar visualization

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Classes
- POST /api/classes - Create a new class
- GET /api/classes/teacher - Get teacher's classes
- GET /api/classes/student - Get student's classes
- POST /api/classes/join - Join a class

### Polls
- POST /api/polls - Create a new poll
- GET /api/polls/class/:classId - Get polls for a class
- POST /api/polls/:pollId/respond - Submit a poll response
- PATCH /api/polls/:pollId/toggle - Toggle poll active status

## Technologies Used

- Frontend:
  - React
  - Material-UI
  - Socket.io-client
  - Chart.js
  - React Router

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Socket.io
  - JWT Authentication

## License

MIT 
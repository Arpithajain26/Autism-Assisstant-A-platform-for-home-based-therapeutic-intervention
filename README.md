# Autism Assistant

Autism Assistant is a home-based therapeutic intervention platform designed to support children, parents, and therapists in a simple, accessible way. The app provides role-based dashboards for tracking progress, assigning activities, and exploring development-focused learning tasks.

## Overview

This project combines a React frontend with an Express backend to create a lightweight web application for therapeutic support. It helps users:

- Parents monitor their child's activities and progress
- Therapists assign and manage therapy-related tasks
- Children access age-appropriate activities and complete them
- Users complete an assessment to determine a suitable activity level

It is especially useful for demos, educational showcases, and early-stage therapeutic platform prototypes.

## Key Features

- Role-based authentication and dashboards for parent, therapist, and child users
- Activity library with filtered recommendations by level and focus area
- Child assessment flow that assigns starter activities based on responses
- Task assignment and completion tracking
- Responsive, modern UI built with React and Vite

## Tech Stack

### Frontend
- React
- Vite
- CSS for styling
- Vitest for testing

### Backend
- Node.js
- Express.js
- CORS enabled API server

## Project Structure

```text
client/          # React frontend
  src/
    pages/        # Auth, dashboard, activities, and assessment screens
    services/     # API service layer
    test/         # Test setup
server/          # Express backend
  config/        # In-memory database and seed data
  server.js      # API routes and server entry point
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (v18 or newer recommended)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/Arpithajain26/Autism-Assisstant-A-platform-for-home-based-therapeutic-intervention.git
cd Autism-Assisstant-A-platform-for-home-based-therapeutic-intervention
```

### 2. Install dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd ../server
npm install
```

### 3. Run the application

#### Start the backend

```bash
cd server
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

#### Start the frontend

```bash
cd client
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

## Demo Accounts

The application includes sample account options for quick testing:

- Parent: parent@example.com / password123
- Therapist: therapist@example.com / password123
- Child: child@example.com / password123

## API Overview

The backend exposes endpoints for:

- Authentication and login/register
- Activity retrieval and recommendations
- Assessment submission
- Child task assignment and completion

## Testing

Run frontend tests with:

```bash
cd client
npm test
```

## Contributing

Contributions are welcome. If you would like to improve the project, please open an issue or submit a pull request.

## License

This project is currently distributed for educational and demonstration purpose.

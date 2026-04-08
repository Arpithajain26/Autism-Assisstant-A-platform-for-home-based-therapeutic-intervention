import React from 'react';
import Navbar from './components/Navbar';
import ActivityCard from './components/ActivityCard';
import Chatbot from './components/Chatbot';

function App() {
  // Dummy data just for demonstrating the UI Components created by Member 1
  const activities = [
    {
      id: 1,
      title: 'Emotion Recognition',
      description: 'A fun game to help identify basic emotions through interactive facial expressions.',
      category: 'Social Skills',
      duration: 15,
      icon: '😊',
    },
    {
      id: 2,
      title: 'Pattern Matching',
      description: 'Enhance cognitive abilities by sorting shapes and finding the right patterns.',
      category: 'Cognitive',
      duration: 10,
      icon: '🧩',
    },
    {
      id: 3,
      title: 'Breathing Exercises',
      description: 'Follow the visual guide to practice deep breathing and relaxation techniques.',
      category: 'Calming',
      duration: 5,
      icon: '🧘',
    },
    {
      id: 4,
      title: 'Interactive Storytime',
      description: 'Listen and respond to a customized story to improve communication skills.',
      category: 'Communication',
      duration: 20,
      icon: '📖',
    }
  ];

  return (
    <div className="app-layout">
      {/* 1. Reusable Navbar Component */}
      <Navbar />
      
      {/* 2. Main Content Layout */}
      <main className="main-content">
        <h1 className="page-title animate-fade-in">Recommended Activities</h1>
        
        {/* 3. Reusable Activity Cards Display */}
        <div className="grid-layout">
          {activities.map((activity) => (
            <ActivityCard 
              key={activity.id}
              title={activity.title}
              description={activity.description}
              category={activity.category}
              duration={activity.duration}
              icon={activity.icon}
              onClick={() => alert(`Starting ${activity.title}!`)}
            />
          ))}
        </div>
      </main>

      {/* 4. Chatbot Component (Floating) */}
      <Chatbot />
    </div>
  );
}

export default App;

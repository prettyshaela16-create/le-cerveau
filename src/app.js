const express = require('express');
const authRoutes = require('./routes/auth.routes');
const tasksRoutes = require('./routes/tasks.routes');

const app = express();

app.use(express.json());


app.get('/', (req, res) => {
  res.json({ message: 'API Le Cerveau opérationnelle.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

// Gestion des erreurs inattendues
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

module.exports = app;
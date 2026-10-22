require('dotenv').config();
const app = require('./app');
const pool = require('./db');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('Connexion à PostgreSQL réussie.');
  } catch (err) {
    console.error('Connexion à PostgreSQL impossible :', err.message);
  }
});
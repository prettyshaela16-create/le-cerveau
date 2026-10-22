const express = require('express');
const pool = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Toutes les routes de ce fichier exigent d'être connecté
router.use(authenticate);

// GET /api/tasks  (filtre optionnel : ?completed=true ou ?completed=false)
router.get('/', async (req, res, next) => {
  try {
    const params = [req.user.id];
    let sql = 'SELECT * FROM tasks WHERE user_id = $1';

    if (req.query.completed === 'true' || req.query.completed === 'false') {
      params.push(req.query.completed === 'true');
      sql += ' AND completed = $2';
    }
    sql += ' ORDER BY created_at DESC';

    const result = await pool.query(sql, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }

    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche introuvable.' });
    }
    res.json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title est requis.' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, title.trim(), description || null]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id  (tous les champs sont optionnels)
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }

    const { title, description, completed } = req.body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'title ne peut pas être vide.' });
    }
    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed doit être true ou false.' });
    }

    // COALESCE : si la valeur reçue est NULL, on garde l'ancienne
    const result = await pool.query(
      `UPDATE tasks
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           completed   = COALESCE($3, completed),
           updated_at  = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title === undefined ? null : title.trim(), description ?? null, completed ?? null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche introuvable.' });
    }
    res.json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche introuvable.' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
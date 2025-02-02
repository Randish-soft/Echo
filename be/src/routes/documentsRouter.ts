import { Router } from 'express';
import { Pool } from 'pg';

const documentsRouter = Router();
const pool = new Pool();

// GET /documents - List documents
documentsRouter.get('/', async (req, res) => {
    try {
        const userId = (req as any).user.id; // Get user ID from JWT middleware
        const result = await pool.query('SELECT * FROM documents WHERE owner_id = $1', [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents' });
    }
});

// POST /documents - Create new document
documentsRouter.post('/', async (req, res) => {
    const { title, content } = req.body;
    const userId = (req as any).user.id;

    try {
        await pool.query(
            'INSERT INTO documents (owner_id, title, content) VALUES ($1, $2, $3)',
            [userId, title, content]
        );
        res.status(201).json({ message: 'Document created' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating document' });
    }
});

// PUT /documents/:id - Update a document
documentsRouter.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    try {
        await pool.query('UPDATE documents SET title = $1, content = $2 WHERE id = $3', [
            title,
            content,
            id,
        ]);
        res.status(200).json({ message: 'Document updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating document' });
    }
});

// DELETE /documents/:id - Delete a document
documentsRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM documents WHERE id = $1', [id]);
        res.status(200).json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document' });
    }
});

export default documentsRouter;

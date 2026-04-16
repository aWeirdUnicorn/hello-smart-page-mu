const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function setupDb() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS failed_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dessert TEXT NOT NULL,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

module.exports = async function handler(req, res) {
    await setupDb();

    if (req.method === 'GET') {
        const result = await db.execute('SELECT * FROM failed_submissions ORDER BY submitted_at DESC');
        return res.json(result.rows);
    }

    if (req.method === 'POST') {
        const { dessert } = req.body;

        if (!dessert || dessert.trim() === '') {
            return res.json({ result: 'empty', message: 'Please enter a dessert!' });
        }

        const input = dessert.toLowerCase().trim();
        const favoriteDessert = 'tiramisu';

        if (input === favoriteDessert) {
            return res.json({ result: 'success', message: 'wow, yeah tiramisu is so good.' });
        }

        await db.execute({
            sql: 'INSERT INTO failed_submissions (dessert) VALUES (?)',
            args: [input]
        });

        return res.json({ result: 'fail', message: `Nah. ${input} sucks.` });
    }

    res.status(405).json({ error: 'Method not allowed' });
};

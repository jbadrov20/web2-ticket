const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/tickets', express.static(path.join(__dirname, 'tickets')));

// Ruta za generiranje ulaznica
app.post('/tickets/generate', async (req, res) => {
  const { vatin, firstName, lastName } = req.body;
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM tickets WHERE vatin = $1', [vatin]);
    if (parseInt(result.rows[0].count) >= 3) {
      return res.status(400).json({ error: 'Maximum of 3 tickets per OIB exceeded' });
    }

    if (!vatin || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticketId = require('uuid').v4();
    const createdAt = new Date().toISOString();
    const newTicket = await pool.query(
      'INSERT INTO tickets (id, vatin, firstName, lastName, createdat) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ticketId, vatin, firstName, lastName, createdAt]
    );

    const qrCodeUrl = `https://web2-ticket.onrender.com:${port}/tickets/${ticketId}`;
    const qrCode = await generateQrCode(qrCodeUrl);

    res.status(201).json({
      ticket: newTicket.rows[0],
      qrCode: qrCode,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/tickets/count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) AS count FROM tickets');
    const count = parseInt(result.rows[0].count, 10);
    res.json({ count });
  } catch (err) {
    console.error('Error fetching ticket count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve the tickets.html page for viewing ticket details
app.get('/tickets/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'tickets', 'ticket.html'));
});

app.get('/ticket-info/:id', async (req, res) => {
  const ticketId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const ticket = result.rows[0];
    res.json({
      vatin: ticket.vatin,
      firstName: ticket.firstname,
      lastName: ticket.lastname,
      createdAt: ticket.createdat// User details from the token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


const QRCode = require('qrcode');
async function generateQrCode(url) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url);
    return qrCodeDataUrl;
  } catch (err) {
    console.error('Error generating QR code', err);
    throw new Error('QR code generation failed');
  }
}
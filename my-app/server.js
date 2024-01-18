const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');

app.use(express.static(path.join(__dirname, "assets")));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "music_server"
});

db.connect(function (err) {
    if (err) {
        console.error('Error connecting to the MySQL server: ' + err.message);
        return;
    }
    console.log('Connected to the MySQL server.');
});

// Use the following SQL query to ensure the username is not empty
db.query('ALTER TABLE `user` MODIFY `username` varchar(50) NOT NULL', (err, result) => {
    if (err) {
        console.error('Error modifying username column: ' + err.message);
    } else {
        console.log('Modified username column successfully.');
    }
});

const storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, 'assets/images');
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

//! Routes start

// route to fetch the latest uploaded avatar image source
app.get('/getAvatar', (req, res) => {
    const getLastAvatarQuery = "SELECT avatar FROM user ORDER BY id DESC LIMIT 1";

    db.query(getLastAvatarQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.length > 0) {
            const avatarSrc = result[0].avatar;
            res.json({ avatarSrc });
        } else {
            res.json({ avatarSrc: '' }); // No avatar found
        }
    });
});

// route to fetch the latest uploaded cover photo image source
app.get('/getCoverPhoto', (req, res) => {
    const getLastCoverPhotoQuery = "SELECT cover_photo FROM user ORDER BY id DESC LIMIT 1";

    db.query(getLastCoverPhotoQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.length > 0) {
            const coverPhotoSrc = result[0].cover_photo;
            res.json({ coverPhotoSrc });
        } else {
            res.json({ coverPhotoSrc: '' }); // No cover photo found
        }
    });
});

// route for post avatar data
app.post("/uploadAvatar", upload.single('avatar'), (req, res) => {
    const userId = req.body.userId;

    if (!userId) {
        return res.status(400).json({ error: 'No user ID provided' });
    }

    if (!req.file) {
        console.log("No avatar file upload");
        return res.status(400).json({ error: 'No avatar file uploaded' });
    }

    const avatarSrc = 'http://127.0.0.1:3000/images/' + req.file.filename;

    const insertData = `INSERT INTO user(id, avatar) VALUES ("${userId}", "${avatarSrc}")`;

    db.query(insertData, (err, result) => {
        if (err) {
            console.error('Error inserting avatar data: ' + err.message);

            // Check if the error is due to a duplicate entry
            if (err.code === 'ER_DUP_ENTRY') {
                const errWords = err.sqlMessage.split(" ");
                const entry = errWords[2];
                const fieldDB = errWords[5];
                const formattedField = fieldDB.substring(fieldDB.lastIndexOf(".") + 1, fieldDB.lastIndexOf("_"));

                return res.status(400).json({ error: `Duplicate entry - ${formattedField}: ${entry}` });
            }

            return res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }

        console.log("Avatar file uploaded");
        res.json({ success: true });
    });
});

// route for post cover photo data
app.post("/uploadCoverPhoto", upload.single('coverPhoto'), (req, res) => {
    const userId = req.body.userId;

    if (!userId) {
        return res.status(400).json({ error: 'No user ID provided' });
    }

    if (!req.file) {
        console.log("No cover photo file upload");
        return res.status(400).json({ error: 'No cover photo file uploaded' });
    }

    const coverPhotoSrc = 'http://127.0.0.1:3000/images/' + req.file.filename;

    const insertData = `INSERT INTO user(id, cover_photo) VALUES ("${userId}", "${coverPhotoSrc}")`;

    db.query(insertData, (err, result) => {
        if (err) {
            console.error('Error inserting cover photo data: ' + err.message);

            // Check if the error is due to a duplicate entry
            if (err.code === 'ER_DUP_ENTRY') {
                const errWords = err.sqlMessage.split(" ");
                const entry = errWords[2];
                const fieldDB = errWords[5];
                const formattedField = fieldDB.substring(fieldDB.lastIndexOf(".") + 1, fieldDB.lastIndexOf("_"));

                return res.status(400).json({ error: `Duplicate entry - ${formattedField}: ${entry}` });
            }

            return res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }

        console.log("Cover photo file uploaded");
        res.json({ success: true });
    });
});


// route for user profile
app.get('/profile/:username', (req, res) => {
    const username = req.params.username;
    const token = req.query.token;

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const decodedToken = JSON.parse(Buffer.from(token, 'base64').toString());
        const tokenUsername = decodedToken.username;

        if (tokenUsername !== username) {
            return res.status(401).send('Unauthorized');
        }

        // Use the username to fetch user-specific data or render a personalized profile page
        const profilePagePath = path.join(__dirname, 'user-profile.html'); // Replace 'profile.html' with the actual filename
        res.sendFile(profilePagePath);
    } catch (error) {
        console.error(error);
        res.status(400).send('Bad Request');
    }
});

// Route for Home page
app.get('/', (req, res) => {
    // Assuming the user information is available
    const user = {
        username: 'exampleUser', // Replace with the actual username
        // Add other user information if needed
    };

    // Create a token with user information
    const token = Buffer.from(JSON.stringify(user)).toString('base64');

    // Send the user-profile.html file with the token as a query parameter
    res.sendFile(path.join(__dirname, 'user-profile.html') + `?token=${token}`);
});

// create connection
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running at port ${PORT}`));

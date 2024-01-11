// Import required modules
const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');

// use express static folder
app.use(express.static("assets"));

// body-parser middleware use
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "music_server"
});

db.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }
    console.log('Connected to the MySQL server.');
});

//! Use of Multer
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, 'assets/images'); // directory name where save the file
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({
    storage: storage
});

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
    if (!req.file) {
        console.log("No avatar file upload");
    } else {
        console.log(req.file.filename);
        var avatarSrc = 'http://127.0.0.1:3000/images/' + req.file.filename
        var insertData = `INSERT INTO user(avatar) VALUES ("${avatarSrc}")`;
        db.query(insertData, (err, result) => {
            if (err) throw err;
            console.log("Avatar file uploaded");
        });
    }
});

// route for post cover photo data
app.post("/uploadCoverPhoto", upload.single('coverPhoto'), (req, res) => {
    if (!req.file) {
        console.log("No cover photo file upload");
    } else {
        console.log(req.file.filename);
        var coverPhotoSrc = 'http://127.0.0.1:3000/images/' + req.file.filename;

        // Update the SQL query to include the cover photo information
        var insertData = `INSERT INTO user(avatar, cover_photo) VALUES ("${coverPhotoSrc}", "${coverPhotoSrc}")`;

        db.query(insertData, (err, result) => {
            if (err) throw err;
            console.log("Cover photo file uploaded");
        });
    }
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

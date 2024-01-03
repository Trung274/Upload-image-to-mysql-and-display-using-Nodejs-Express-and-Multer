const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');

//use express static folder
app.use(express.static(path.join(__dirname, 'public')));

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
    database: "test"
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
        callBack(null, path.join(__dirname, 'public', 'images')); // directory name where save the file
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({
    storage: storage
});

//! Routes start

// route to fetch the latest uploaded avatar
app.get('/getAvatar', (req, res) => {
    const getLastAvatarQuery = "SELECT file_src FROM users_file WHERE file_type = 'avatar' ORDER BY id DESC LIMIT 1";

    db.query(getLastAvatarQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.length > 0) {
            const avatarSrc = result[0].file_src;
            res.json({ avatarSrc });
        } else {
            res.json({ avatarSrc: '' }); // No avatar found
        }
    });
});

// route to fetch the latest uploaded cover photo
app.get('/getCoverPhoto', (req, res) => {
    const getLastCoverPhotoQuery = "SELECT file_src FROM users_file WHERE file_type = 'cover_photo' ORDER BY id DESC LIMIT 1";

    db.query(getLastCoverPhotoQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.length > 0) {
            const coverPhotoSrc = result[0].file_src;
            res.json({ coverPhotoSrc });
        } else {
            res.json({ coverPhotoSrc: '' }); // No cover photo found
        }
    });
});

// Add a route for the root path ("/")
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// route for avatar upload
app.post("/uploadAvatar", upload.single('avatar'), (req, res) => {
    if (!req.file) {
        console.log("No file upload");
    } else {
        console.log(req.file.filename);
        var imgsrc = 'http://127.0.0.1:3000/images/' + req.file.filename;
        var insertData = `INSERT INTO users_file(file_src, file_type) VALUES ("${imgsrc}", 'avatar')`;

        db.query(insertData, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            console.log("avatar uploaded");
            res.json({ success: true });
        });
    }
});

// route for cover photo upload
app.post("/uploadCoverPhoto", upload.single('coverPhoto'), (req, res) => {
    if (!req.file) {
        console.log("No file upload");
    } else {
        console.log(req.file.filename);
        var imgsrc = 'http://127.0.0.1:3000/images/' + req.file.filename;
        var insertData = `INSERT INTO users_file(file_src, file_type) VALUES ("${imgsrc}", 'cover_photo')`;

        db.query(insertData, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            console.log("cover photo uploaded");
            res.json({ success: true });
        });
    }
});

// Port configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running at port ${PORT}`));

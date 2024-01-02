const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const mysql = require('mysql')
const multer = require('multer')
const path = require('path')


//use express static folder
app.use(express.static("C:/Users/admin/PARZIVAL/xampp/htdocs/Upload-image-to-mysql-and-display-using-Nodejs-Express-and-Multer/my-app"))

// body-parser middleware use
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "test"
})

db.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }
    console.log('Connected to the MySQL server.');
})

//! Use of Multer
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, 'C:/Users/admin/PARZIVAL/xampp/htdocs/Upload-image-to-mysql-and-display-using-Nodejs-Express-and-Multer/my-app/images')     // directory name where save the file
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

var upload = multer({
    storage: storage
});

//! Routes start

// route to fetch the latest uploaded image source
app.get('/getImage', (req, res) => {
    const getLastImageQuery = "SELECT file_src FROM users_file ORDER BY id DESC LIMIT 1";

    db.query(getLastImageQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.length > 0) {
            const imageSrc = result[0].file_src;
            res.json({ imageSrc });
        } else {
            res.json({ imageSrc: '' }); // No image found
        }
    });
});

//route for Home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

//@type   POST
//route for post data
app.post("/post", upload.single('image'), (req, res) => {
    if (!req.file) {
        console.log("No file upload");
    } else {
        console.log(req.file.filename)
        var imgsrc = 'http://127.0.0.1:3000/images/' + req.file.filename
        var insertData = `INSERT INTO users_file(file_src) VALUES ("${imgsrc}")`
        db.query(insertData, [imgsrc], (err, result) => {
            if (err) throw err
            console.log("file uploaded")
        })
    }
});

//create connection
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server is running at port ${PORT}`))


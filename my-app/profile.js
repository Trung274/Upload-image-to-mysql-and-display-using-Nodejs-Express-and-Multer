// profile.js

const express = require('express');
const router = express.Router();

// Define a route for handling the /profile/:username endpoint
router.get('/:username', (req, res) => {
    const { username } = req.params;

    // You can fetch user information from the database using the username
    // and render the profile page with the retrieved data
    // For now, let's just send a simple response
    res.send(`Profile page for ${username}`);
});

module.exports = router;

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const morgan = require('morgan');
const app = express();
const PORT = process.env.PORT || 3000;

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

app.use(express.static('public'));

app.use(morgan('combined'));

function readExclusions() {
    const data = fs.readFileSync('exclusions.json');
    const exclusions = JSON.parse(data);
    return exclusions.exclude;
}

function getRandomImage(images) {
    return images[Math.floor(Math.random() * images.length)];
}

app.get('/', async (req, res) => {
    try {
        const exclusions = readExclusions();
        const response = await axios.get('https://api.pexels.com/v1/search', {
            params: { query: 'fox', per_page: 30, page: 1 },
            headers: { Authorization: PEXELS_API_KEY }
        });

        const filteredPhotos = response.data.photos.filter(photo => !exclusions.includes(photo.id.toString()));
        const randomImage = getRandomImage(filteredPhotos);
        const imageUrl = randomImage ? randomImage.src.medium : '';

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Only Foxes</title>
                <link rel="stylesheet" href="styles.css">

                <meta property="og:title" content="Only Foxes">
                <meta property="og:description" content="A collection of beautiful fox images.">
                <meta property="og:image" content="${imageUrl}">
                <meta property="og:url" content="https://onlyfox.es">
                <meta property="og:type" content="website">

                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:title" content="Only Foxes">
                <meta name="twitter:description" content="A collection of beautiful fox images.">
                <meta name="twitter:image" content="${imageUrl}">

            </head>
            <body>
                <div class="container">
                    <h1>Only Foxes</h1>
                    <div id="imageContainer" class="grid"></div>
                </div>
                <script src="script.js"></script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images');
    }
});

app.get('/api/fox-images', async (req, res) => {
    try {
        const exclusions = readExclusions();
        const page = req.query.page || 1;
        const response = await axios.get('https://api.pexels.com/v1/search', {
            params: { query: 'fox', per_page: 30, page },
            headers: { Authorization: PEXELS_API_KEY }
        });

        const filteredPhotos = response.data.photos.filter(photo => !exclusions.includes(photo.id.toString()));
        res.json({ photos: filteredPhotos });
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images');
    }
});

app.get('/image-proxy', async (req, res) => {
    try {
        const { url } = req.query;
        const response = await axios.get(url, { responseType: 'stream' });

        res.setHeader('Cache-Control', 'public, max-age=86400');
        response.data.pipe(res);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Error fetching image');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


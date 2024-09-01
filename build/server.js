const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const app = express();
const PORT = process.env.PORT || 3000;

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const IMAGE_CACHE_DIR = process.env.IMAGE_CACHE_DIR || path.join(__dirname, 'image_cache');
const API_CACHE = {}; // In-memory cache
const CACHE_EXPIRATION_TIME = 60 * 60 * 1000; // Cache expiration time in milliseconds (1 hour)

app.use(express.static('public'));
app.use('/image_cache', express.static(IMAGE_CACHE_DIR));
app.use(morgan('combined'));

function readExclusions() {
    const data = fs.readFileSync('exclusions.json');
    const exclusions = JSON.parse(data);
    return exclusions.exclude;
}

function getRandomImage(images) {
    return images[Math.floor(Math.random() * images.length)];
}

async function downloadAndCacheImage(imageUrl, imageId) {
    const filePath = path.join(IMAGE_CACHE_DIR, `${imageId}.jpg`);

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
        return filePath;
    }

    // If not, download and cache it
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
}

async function fetchImagesFromAPI(query, page = 1) {
    const cacheKey = `${query}-${page}`;
    const now = Date.now();

    if (API_CACHE[cacheKey] && (now - API_CACHE[cacheKey].timestamp) < CACHE_EXPIRATION_TIME) {
        return API_CACHE[cacheKey].data;
    }

    const response = await axios.get('https://api.pexels.com/v1/search', {
        params: { query, per_page: 30, page },
        headers: { Authorization: PEXELS_API_KEY }
    });

    API_CACHE[cacheKey] = {
        data: response.data.photos,
        timestamp: now
    };

    return response.data.photos;
}

app.get('/', async (req, res) => {
    try {
        const exclusions = readExclusions();
        const photos = await fetchImagesFromAPI('fox');

        const filteredPhotos = photos.filter(photo => !exclusions.includes(photo.id.toString()));
        const randomImage = getRandomImage(filteredPhotos);

        if (!randomImage) {
            return res.status(404).send('No images available');
        }

        const imageUrl = randomImage.src.medium;
        const cachedImagePath = await downloadAndCacheImage(imageUrl, randomImage.id);

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
                <meta property="og:image" content="/image_cache/${randomImage.id}.jpg">
                <meta property="og:url" content="https://onlyfox.es">
                <meta property="og:type" content="website">

                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:title" content="Only Foxes">
                <meta name="twitter:description" content="A collection of beautiful fox images.">
                <meta name="twitter:image" content="/image_cache/${randomImage.id}.jpg">

            </head>
            <body>
                <div class="container">
                    <h1>Only Foxes</h1>
                    <div id="imageContainer" class="grid">
                        <img src="/image_cache/${randomImage.id}.jpg" alt="Fox Image">
                    </div>
                </div>
                <script src="script.js"></script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).sendFile(path.join(__dirname, 'public', 'error.html'));
    }
});

app.get('/api/fox-images', async (req, res) => {
    try {
        const exclusions = readExclusions();
        const page = req.query.page || 1;
        const photos = await fetchImagesFromAPI('fox', page);

        const filteredPhotos = photos.filter(photo => !exclusions.includes(photo.id.toString()));

        await Promise.all(
            filteredPhotos.map(photo => downloadAndCacheImage(photo.src.medium, photo.id))
        );

        res.json({ photos: filteredPhotos });
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).sendFile(path.join(__dirname, 'public', 'error.html'));
    }
});

if (!fs.existsSync(IMAGE_CACHE_DIR)) {
    fs.mkdirSync(IMAGE_CACHE_DIR);
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


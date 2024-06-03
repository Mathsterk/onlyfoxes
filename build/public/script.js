document.addEventListener('DOMContentLoaded', fetchFoxImages);

function fetchFoxImages() {
    fetch('/api/fox-images')
        .then(response => response.json())
        .then(data => {
            const imageContainer = document.getElementById('imageContainer');
            imageContainer.innerHTML = ''; // Clear previous images

            data.photos.forEach(photo => {
                const imgElement = document.createElement('img');
                imgElement.src = photo.src.medium;
                imgElement.alt = photo.photographer;
                imageContainer.appendChild(imgElement);
            });
        })
        .catch(error => {
            console.error('Error fetching images:', error);
        });
}


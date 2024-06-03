document.addEventListener('DOMContentLoaded', fetchFoxImages);

function fetchFoxImages() {
    fetch('/api/fox-images')
        .then(response => response.json())
        .then(data => {
            const imageContainer = document.getElementById('imageContainer');
            imageContainer.innerHTML = ''; // Clear previous images

            data.photos.forEach(photo => {
                const imgWrapper = document.createElement('div');
                const imgElement = document.createElement('img');
                imgWrapper.className = "grid-item-wrapper";
                imgElement.src = photo.src.medium;
                imgElement.alt = photo.photographer;
                imgWrapper.appendChild(imgElement);
                imageContainer.appendChild(imgWrapper);
            });
        })
        .catch(error => {
            console.error('Error fetching images:', error);
        });
}


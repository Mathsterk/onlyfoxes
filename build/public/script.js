document.addEventListener('DOMContentLoaded', () => {
    let page = 1;
    let isLoading = false;
    const imageContainer = document.getElementById('imageContainer');

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function fetchFoxImages() {
        if (isLoading) return;
        isLoading = true;

        fetch(`/api/fox-images?page=${page}`)
            .then(response => response.json())
            .then(data => {
                const shuffledPhotos = shuffle(data.photos);
                const fragment = document.createDocumentFragment();

                shuffledPhotos.forEach(photo => {
                    const imgElement = document.createElement('img');
                    imgElement.src = `/image-proxy?url=${encodeURIComponent(photo.src.medium)}`;
                    imgElement.alt = photo.photographer;
                    imgElement.loading = 'lazy';
                    imgElement.classList.add('grid-item');
                    fragment.appendChild(imgElement);
                });

                imageContainer.appendChild(fragment);
                isLoading = false;
            })
            .catch(error => {
                console.error('Error fetching images:', error);
                isLoading = false;
            data.photos.forEach(photo => {
                const imgWrapper = document.createElement('div');
                const imgElement = document.createElement('img');
                imgWrapper.className = "grid-item-wrapper";
                imgElement.className= "grid-item";
                imgElement.src = photo.src.medium;
                imgElement.alt = photo.photographer;
                imgWrapper.appendChild(imgElement);
                imageContainer.appendChild(imgWrapper);
            });
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const handleScroll = debounce(() => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
            page++;
            fetchFoxImages();
        }
    }, 200);

    window.addEventListener('scroll', handleScroll);

    fetchFoxImages(); // Initial load
});


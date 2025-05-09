//These are all of the query selectors needed
const resultsContainer = document.getElementById('results-container');
const playlistDisplay = document.getElementById('playlist-display');
const searchBtn = document.getElementById('search-btn');
const createPlaylistBtn = document.getElementById('create-playlist');
const playlistNameInput = document.getElementById('playlist-name-input');

let currentPlaylist = [];

// Get a valid access token or redirect to login
function getValidAccessToken() {
    const token = localStorage.getItem('access_token');
    const expiry = parseInt(localStorage.getItem('token_expiry'), 10);

    if (!token || !expiry || Date.now() > expiry) {
        initiateLogin();
        return null;
    }
    return token;
}


//This is the main search function within the website.
searchBtn.addEventListener('click', () => {
    const token = getValidAccessToken();
    if (!token) return;

    const query = document.getElementById('search-input').value;
    if (!query) return;

    resultsContainer.innerHTML = '';

    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(response => response.json())
        .then(data => {
            const tracks = data.tracks.items;
            if (!tracks || tracks.length === 0) {
                resultsContainer.innerHTML = '<p>No results found.</p>';
                return;
            }

            //This creates the bar like search result
            tracks.forEach(track => {
                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');
                resultItem.innerHTML = `
                <img src="${track.album.images[0]?.url || 'logo.png'}" alt="Album cover" class="album-thumb" />
                <span class="track-title">${track.name}</span>
                <span class="track-artist">${track.artists[0].name}</span>
                <span class="track-album">${track.album.name}</span>
                <span class="track-duration">${msToMinutes(track.duration_ms)}</span>
                <button class="btn btn-success add-btn">Add</button>
            `;

                resultsContainer.appendChild(resultItem);
                //Added the song to the current playlist loaded.
                resultItem.querySelector('.add-btn').addEventListener('click', () => {
                    const song = {
                        title: track.name,
                        artist: track.artists[0].name,
                        album: track.album.name,
                        image: track.album.images[0]?.url || 'logo.png',
                        duration: msToMinutes(track.duration_ms)
                    };
                    currentPlaylist.push(song);
                    updatePlaylistDisplay();
                });
            });
        })
        .catch(error => {
            console.error('Error fetching Spotify API:', error);
            resultsContainer.innerHTML = '<p>Error fetching data. Please try again later.</p>';
        });
});

//Handles the name and song requirements for the playlists.
createPlaylistBtn.addEventListener('click', () => {
    const playlistName = playlistNameInput.value.trim();
    if (!playlistName) {
        alert('Please enter a playlist name.');
        return;
    }

    if (currentPlaylist.length === 0) {
        alert('Please add at least one song to the playlist.');
        return;
    }

    const existing = JSON.parse(localStorage.getItem('playlists') || '[]');
    existing.push({ name: playlistName, songs: currentPlaylist });
    localStorage.setItem('playlists', JSON.stringify(existing));
    alert('Playlist saved locally!');
    currentPlaylist = [];
    playlistNameInput.value = '';
    updatePlaylistDisplay();
});

window.addEventListener('DOMContentLoaded', () => {
    const loadedPlaylist = JSON.parse(localStorage.getItem('loadedPlaylist'));
    if (loadedPlaylist) {
        currentPlaylist = loadedPlaylist.songs || [];
        playlistNameInput.value = loadedPlaylist.name || '';
        updatePlaylistDisplay();
    }
});


//When a playlist is loaded or a song is added/deleted, this will change the display
function updatePlaylistDisplay() {
    playlistDisplay.innerHTML = '';

    currentPlaylist.forEach((song, index) => {
        const songCard = document.createElement('div');
        songCard.className = 'playlist-song-card';
        songCard.innerHTML = `
            <div class="song-info">
                <img src="${song.image}" alt="${song.title}" class="song-thumb">
                <div>
                    <strong>${song.title}</strong><br/>
                    ${song.artist} - ${song.album}
                </div>
            </div>
            <span>${song.duration}</span>
            <button class="btn btn-danger delete-song-btn" data-index="${index}">Remove</button>
        `;
        playlistDisplay.appendChild(songCard);
    });

    playlistDisplay.querySelectorAll('.delete-song-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-index');
            currentPlaylist.splice(idx, 1);
            updatePlaylistDisplay();
        });
    });
}

//This function is for getting the length of the song displayed
function msToMinutes(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


//Main parser for iterating through playlists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('playlists-container');
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

    if (playlists.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = "No playlists created.";
        container.appendChild(emptyMsg);
        return;
    }

    //Creates result containers for songs.
    playlists.forEach((playlistSong, index) => {
        const div = document.createElement('div');
        div.className = 'result-card';
        const playlistName = playlistSong.name || `Playlist #${index + 1}`;
        const ul = playlistSong.songs.map(song =>
            `<li>${song.title} - ${song.artist} (${song.album})</li>`
        ).join('');
        div.innerHTML = `
            <h3>${playlistName}</h3>
            <ul>${ul}</ul>
            <button class="btn btn-primary load-btn" data-index="${index}">Load</button>
            <button class="btn btn-danger delete-btn" data-index="${index}">Delete</button>
        `;
        container.appendChild(div);
    });

    container.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        if (e.target.classList.contains('delete-btn')) {
            playlists.splice(index, 1);
            localStorage.setItem('playlists', JSON.stringify(playlists));
            location.reload();
        }
        if (e.target.classList.contains('load-btn')) {
            localStorage.setItem('loadedPlaylist', JSON.stringify(playlists[index]));
            window.location.href = 'index.html';
        }
    });
});

function exportPlaylists() {
    const playlists = localStorage.getItem('playlists');
    if (!playlists) {
        alert('No playlists to export.');
        return;
    }
    const blob = new Blob([playlists], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlists.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importPlaylists(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                localStorage.setItem('playlists', JSON.stringify(imported));
                alert('Playlists imported');
                location.reload();
            } else {
                alert('Invalid file.');
            }
        } catch {
            alert('Error reading file.');
        }
    };
    reader.readAsText(file);
}

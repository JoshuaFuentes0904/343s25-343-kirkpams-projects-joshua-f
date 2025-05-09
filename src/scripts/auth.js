
//Used for the code verifier
function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

//This is the transformer needed to hash the code verifier that is used for the user authorization
async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
}

//Converts to base64
function base64urlencode(bytes) {
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

//Creates the code challenge
async function generateCodeChallenge(codeVerifier) {
    const hashed = await sha256(codeVerifier);
    return base64urlencode(hashed);
}

//First call to login to api to grab songs
function initiateLogin() {
    const clientId = '3755714b96e4459f8c6da0a7fdc46954';
    const redirectUri = 'https://w3stu.cs.jmu.edu/fuentejx/cs343/project/src/';
    const scope = 'user-read-private user-read-email';

    const codeVerifier = generateRandomString(128);
    generateCodeChallenge(codeVerifier).then(codeChallenge => {
        localStorage.setItem('code_verifier', codeVerifier);

        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('scope', scope);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('code_challenge', codeChallenge);

        window.location.href = authUrl.toString();
    });
}

//Grabs the access token required to access api
function getAccessToken() {
    const token = localStorage.getItem('access_token');
    const expiry = parseInt(localStorage.getItem('token_expiry'), 10);

    if (!token || !expiry || Date.now() > expiry) {
        initiateLogin();
        return null;
    }
    return token;
}

//Redirects page back to home after authentication
async function handleRedirectCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) return;

    const clientId = '3755714b96e4459f8c6da0a7fdc46954';
    const redirectUri = 'https://w3stu.cs.jmu.edu/fuentejx/cs343/project/src/';
    const codeVerifier = localStorage.getItem('code_verifier');

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
    });

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token_expiry', Date.now() + data.expires_in * 1000);
            window.history.replaceState({}, document.title, "/"); // Clean URL
        } else {
            console.error('Token exchange failed:', data);
        }
    } catch (error) {
        console.error('Error during token exchange:', error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    handleRedirectCallback();
});

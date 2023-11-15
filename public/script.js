// Spotify API
const SPOTIFY_CLIENT_ID = "afe8912b7a614dbeb279f7fba70fc88f";
const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_CURRENT_TRACK_URL =
  "https://api.spotify.com/v1/me/player/currently-playing";

// Construct the authorization URL
const scopes = "user-read-playback-state"; // Add more scopes if needed
const redirectUri = encodeURIComponent("http://localhost:3001"); // Replace with your redirect URI
const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${redirectUri}&scope=${encodeURIComponent(
  scopes
)}`;
let accessToken = null;

console.log("Spotify Authorization URL:", authUrl); // Log the authorization URL

async function getAccessToken() {
  const authData = {
    grant_type: "client_credentials",
    client_id: SPOTIFY_CLIENT_ID,
  };

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams(authData),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const tokenData = await response.json();
  return tokenData.access_token;
}

// Parse the access token from the URL fragment
if (typeof window !== "undefined") {
  const hashParams = window.location.hash.substr(1).split("&");
  const accessTokenParam = hashParams.find((param) =>
    param.startsWith("access_token=")
  );
  accessToken = accessTokenParam ? accessTokenParam.split("=")[1] : null;
}

// Use the access token for authorized requests
async function getCurrentTrack() {
  if (!accessToken) {
    console.log("Access token not found. Please authorize the app.");
    return null;
  }

  try {
    const response = await fetch(SPOTIFY_CURRENT_TRACK_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(
        "Error fetching currently playing track:",
        response.status,
        response.statusText
      );
      return null;
    }

    const spotifyData = await response.json();
    return spotifyData.item || null;
  } catch (error) {
    console.error(
      "An error occurred while fetching the currently playing track:",
      error
    );
    return null;
  }
}

async function fetchLyrics(trackName, artistName) {
  const PROXY_URL = "http://localhost:3001/proxy";
  const MUSIXMATCH_API_KEY = "c409f2c5e27276740f820e44aa028165";
  const MUSIXMATCH_API_URL = `https://api.musixmatch.com/ws/1.1/track.lyrics.get?apikey=${MUSIXMATCH_API_KEY}&q_track=${encodeURIComponent(
    trackName
  )}&q_artist=${encodeURIComponent(artistName)}`;

  async function testProxy() {
    try {
      const response = await fetch(
        `${PROXY_URL}?url=${encodeURIComponent(MUSIXMATCH_API_URL)}`
      );
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2)); // Pretty-print the JSON response
    } catch (error) {
      console.error("Error fetching lyrics:", error);
    }
  }
  testProxy();

  try {
    const response = await fetch(
      `${PROXY_URL}?url=${encodeURIComponent(MUSIXMATCH_API_URL)}`
    );
    const musixmatchData = await response.json();
    return musixmatchData.message.body.lyrics.lyrics_body || "Lyrics not found";
  } catch (error) {
    console.error("An error occurred while fetching lyrics:", error);
    return "Lyrics not found";
  }
}

async function updateUI() {
  const trackElem = document.getElementById("trackName");
  const artistElem = document.getElementById("artistName");
  const lyricsElem = document.getElementById("lyrics");

  const trackData = await getCurrentTrack();
  if (trackData) {
    const trackName = trackData.name;
    const artistName = trackData.artists[0].name;

    trackElem.textContent = trackName;
    artistElem.textContent = artistName;

    const lyrics = await fetchLyrics(trackName, artistName);
    lyricsElem.textContent = lyrics;
  } else {
    trackElem.textContent = "No track currently playing";
    artistElem.textContent = "";
    lyricsElem.textContent = "";
  }
}

// Update the UI on page load and every 10 seconds
updateUI();
//setInterval(updateUI, 10000);

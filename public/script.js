// Spotify API
const SPOTIFY_CLIENT_ID = "KEY-HERE";
const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_CURRENT_TRACK_URL =
  "https://api.spotify.com/v1/me/player/currently-playing";

const scopes = "user-read-playback-state";
const redirectUri = encodeURIComponent("http://localhost:3001");
const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${redirectUri}&scope=${encodeURIComponent(
  scopes
)}`;
let accessToken = null;

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

function showPopup() {
  document.body.classList.add("blurred");

  const popup = document.getElementById("popup");
  popup.style.display = "block";

  const makeItWorkBtn = document.getElementById("makeItWorkBtn");
  makeItWorkBtn.addEventListener("click", () => {
    window.location.href = authUrl;
    document.body.classList.remove("blurred");
    popup.style.display = "none";
  });
}

if (typeof window !== "undefined") {
  const hashParams = window.location.hash.substr(1).split("&");
  const accessTokenParam = hashParams.find((param) =>
    param.startsWith("access_token=")
  );
  accessToken = accessTokenParam ? accessTokenParam.split("=")[1] : null;
}

async function getCurrentTrack() {
  if (!accessToken) {
    console.log("User access token not found.");
    showPopup();
    console.log("Spotify Auth URL:", authUrl);
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
  const MUSIXMATCH_API_KEY = "KEY-HERE";
  const MUSIXMATCH_API_URL = `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?apikey=${MUSIXMATCH_API_KEY}&q_track=${encodeURIComponent(
    trackName
  )}&q_artist=${encodeURIComponent(artistName)}`;

  async function testProxy() {
    try {
      const response = await fetch(
        `${PROXY_URL}?url=${encodeURIComponent(MUSIXMATCH_API_URL)}`
      );
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
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
  const albumElem = document.getElementById("albumName");

  const trackData = await getCurrentTrack();
  if (trackData) {
    const trackName = trackData.name;
    const artistName = trackData.artists[0].name;
    const albumName = trackData.album.name;

    trackElem.textContent = trackName;
    artistElem.textContent = artistName;
    albumElem.textContent = albumName;

    const lyrics = await fetchLyrics(trackName, artistName);
    lyricsElem.textContent = lyrics;
  } else {
    trackElem.textContent = "No track currently playing";
    artistElem.textContent = "";
    lyricsElem.textContent = "";
    albumElem.textContent = "";
  }
}

updateUI();
setInterval(() => {
  updateUI();
  console.log("App refreshed");
}, 10000);

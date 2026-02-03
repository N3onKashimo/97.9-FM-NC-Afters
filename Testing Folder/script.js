// ----------------------------------------------
// CONFIG
// ----------------------------------------------
const ICECAST_URL = 'https://ncafters.live/status-json.xsl';

const audioPlayer = document.getElementById('audioPlayer');
audioPlayer.crossOrigin = "anonymous";
const playBtn = document.getElementById('playBtn');
const volumeSlider = document.getElementById('volumeSlider');
const stationRows = document.querySelectorAll('.station-row');

const nowTitle = document.getElementById('nowTitle');
const nowArtist = document.getElementById('nowArtist');
const activityTrack = document.getElementById('activityTrack');

const coverImage = document.getElementById('coverImage');
const bgArt = document.getElementById('bgArt');
const serverStatus = document.getElementById('serverStatus');
const waveform = document.getElementById('waveform');

const metaMount = document.getElementById('metaMount');
const metaListeners = document.getElementById('metaListeners');
const metaPeak = document.getElementById('metaPeak');
const metaBitrate = document.getElementById('metaBitrate');
const metaUptime = document.getElementById('metaUptime');

const trackHistoryList = document.getElementById('trackHistoryList');


// ----------------------------------------------
// STATE
// ----------------------------------------------
let currentStream = null;
let currentMount = null;

// { "/tops": [ { title, timestamp } ] }
let trackHistories = {};


// ----------------------------------------------
// DATE + TIME (PATCHED)
// ----------------------------------------------
const dateTab = document.getElementById("dateTab");
const timeTab = document.getElementById("timeTab");

function updateDateTime() {
  const now = new Date();

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });

  dateTab.textContent = dateStr;
  timeTab.textContent = timeStr;
}

updateDateTime();
setInterval(updateDateTime, 1000);


// ----------------------------------------------
// VISUAL STATE
// ----------------------------------------------
function setPlayingVisual(isPlaying) {
  if (isPlaying) {
    document.body.classList.add('is-playing');
    waveform.classList.add('active');
    playBtn.textContent = '⏸ Pause';

    initAudioAnalyser();
    audioContext.resume();
    startWaveform();
  } else {
    document.body.classList.remove('is-playing');
    waveform.classList.remove('active');
    playBtn.textContent = '▶ Play';

    stopWaveform();
  }
}

function setActiveRow(row) {
  stationRows.forEach(r => r.classList.remove('active'));
  if (row) row.classList.add('active');
}

// ----------------------------------------------
// AUDIO ANALYSER (REAL WAVEFORM)
// ----------------------------------------------
let audioContext;
let analyser;
let dataArray;
let animationId;

function initAudioAnalyser() {
  if (audioContext) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaElementSource(audioPlayer);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 64;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  // Real audio path (untouched)
  source.connect(audioContext.destination);
}


// ----------------------------------------------
// DAY / NIGHT MODE
// ----------------------------------------------
const themeToggle = document.getElementById('themeToggle');

themeToggle.addEventListener('click', () => {
  const root = document.documentElement; // <html>
  const isDay = root.classList.toggle('day-mode');

  // keep body in sync too (so any body.day-mode rules still work)
  document.body.classList.toggle('day-mode', isDay);

  // show the opposite icon (what you’ll switch TO)
  themeToggle.textContent = isDay ? '🌙' : '☀️';
});


// ----------------------------------------------
// CLICK STATION (PATCHED - NO DUPLICATES)
// ----------------------------------------------
stationRows.forEach(row => {
  row.addEventListener('click', () => {

    const stream = row.dataset.stream;
    const mount = row.dataset.mount;

    currentStream = stream;
    currentMount = mount;

    // Switch audio
    audioPlayer.src = stream;
    audioPlayer.play().then(() => setPlayingVisual(true));

    // Do NOT reset nowTitle / nowArtist
    // Do NOT touch last played track
    // Do NOT push history here

    setActiveRow(row);

    // Fetch correct metadata from Icecast
    fetchIcecast();

    // Load existing history for this mount
    renderTrackHistory();
  });
});


// ----------------------------------------------
// PLAY/PAUSE
// ----------------------------------------------
playBtn.addEventListener('click', () => {
  if (!currentStream) return;

  if (audioPlayer.paused) {
    audioPlayer.play().then(() => setPlayingVisual(true));
  } else {
    audioPlayer.pause();
    setPlayingVisual(false);
  }
});

audioPlayer.addEventListener('play', () => setPlayingVisual(true));
audioPlayer.addEventListener('pause', () => setPlayingVisual(false));

// ----------------------------------------------
// JUMP TO LIVE
// ----------------------------------------------
const liveBtn = document.getElementById('liveBtn');

liveBtn.addEventListener('click', () => {
  if (!currentStream) return;

  audioPlayer.pause();
  audioPlayer.src = currentStream; // force reconnect
  audioPlayer.play().then(() => setPlayingVisual(true));
});



// ----------------------------------------------
// VOLUME CONTROL
// ----------------------------------------------
audioPlayer.volume = 0.8;

volumeSlider.addEventListener('input', () => {
  audioPlayer.volume = volumeSlider.value;
});


// ----------------------------------------------
// PARSE NOW PLAYING
// ----------------------------------------------
function parseNowPlaying(str) {
  if (!str || typeof str !== 'string') return { artist: '', track: '' };

  if (!str.includes(' - ')) {
    return { artist: '', track: str.trim() };
  }

  const [artist, ...rest] = str.split(' - ');
  return {
    artist: artist.trim(),
    track: rest.join(' - ').trim()
  };
}


// ----------------------------------------------
// ARTWORK LOOKUP
// ----------------------------------------------
async function fetchArtworkForNowPlaying(rawSong) {
  try {
    const { artist, track } = parseNowPlaying(rawSong);
    const q = encodeURIComponent(`${artist} ${track}`.trim() || rawSong);

    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=song&limit=1`
    );
    const json = await res.json();

    if (!json.results?.length) return null;

    let art = json.results[0].artworkUrl100;
    return art.replace("100x100bb", "1000x1000bb");
  } catch {
    return null;
  }
}

function applyArtwork(url) {
  if (!url) return;
  coverImage.src = url;
  bgArt.style.backgroundImage = `url(${url})`;
  bgArt.style.opacity = "0.24";
}


// ----------------------------------------------
// TIME AGO
// ----------------------------------------------
function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}


// ----------------------------------------------
// TRACK HISTORY (PATCHED — NO DUPLICATES EVER)
// ----------------------------------------------
function pushTrackHistory(rawSong) {
  if (!rawSong || !currentMount) return;

  const clean = rawSong.trim();

  if (!trackHistories[currentMount]) {
    trackHistories[currentMount] = [];
  }

  // Prevent duplicates caused by switching stations
  if (trackHistories[currentMount][0]?.title === clean) {
    return;
  }

  trackHistories[currentMount].unshift({
    title: clean,
    timestamp: Date.now()
  });

  if (trackHistories[currentMount].length > 5) {
    trackHistories[currentMount].pop();
  }

  renderTrackHistory();
}

function renderTrackHistory() {
  const history = trackHistories[currentMount] || [];

  if (history.length === 0) {
    trackHistoryList.innerHTML = "No tracks played yet…";
    return;
  }

  trackHistoryList.innerHTML = history
    .map((h, i) => {
      return `<div>${i + 1}. ${h.title} <span style="opacity:0.6">(${timeAgo(
        h.timestamp
      )})</span></div>`;
    })
    .join("");
}


// ----------------------------------------------
// ICECAST METADATA
// ----------------------------------------------
async function fetchIcecast() {
  try {
    const res = await fetch(ICECAST_URL);
    const data = await res.json();

    let source = data.icestats.source;
    if (!Array.isArray(source)) source = [source];

    const mount = source.find(
      m => m.listenurl && currentMount && m.listenurl.includes(currentMount)
    );
    if (!mount) return;

    const rawSong = mount.title || "Unknown Track";

    const { artist, track } = parseNowPlaying(rawSong);

    nowTitle.textContent = track || rawSong;
    nowArtist.textContent = artist || "Unknown Artist";

    activityTrack.textContent = `— ${artist ? artist + " — " : ""}${track}`;

    serverStatus.textContent = rawSong;

    metaMount.textContent = currentMount || "—";
    metaListeners.textContent = mount.listeners ?? 0;
    metaPeak.textContent = mount.listener_peak ?? 0;
    metaBitrate.textContent = `${mount.bitrate || "—"} kbps`;

    if (mount.stream_start_iso8601) {
      const start = new Date(mount.stream_start_iso8601);
      if (!isNaN(start)) {
        const diff = Date.now() - start.getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        metaUptime.textContent = hrs ? `${hrs}h ${mins % 60}m` : `${mins}m`;
      }
    }

    // Only push if Icecast confirms a REAL change
    pushTrackHistory(rawSong);

    const art = await fetchArtworkForNowPlaying(rawSong);
    if (art) applyArtwork(art);

  } catch (err) {
    console.error("Icecast metadata error:", err);
  }
}

function startWaveform() {
  const bars = waveform.querySelectorAll('.bar');

  // persistent smoothing memory
  let smoothed = new Array(bars.length).fill(0);

  function draw() {
    animationId = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    // perceptual scaling based on volume slider (0–1)
    const vol = Math.max(0.15, audioPlayer.volume); // never fully dead
    // iTunes-style perceptual scaling
    const visualScale = 0.55 + Math.pow(vol, 0.6) * 0.6;
    
    bars.forEach((bar, i) => {
      // bias toward bass (lower bins move more)
      const binIndex = i * 2 + 2;
      const raw = dataArray[binIndex] || 0;

      // logarithmic compression (prevents “stuck at loud” look)
      const compressed = Math.log10(1 + raw) * 32;

      // apply volume scaling
      const target = compressed * visualScale;

      // temporal smoothing (iTunes-like motion)
      smoothed[i] = smoothed[i] * 0.75 + target * 0.25;

      const height = Math.max(4, Math.min(20, smoothed[i]));
      bar.style.height = `${height}px`;
    });
  }

  draw();
}

function stopWaveform() {
  cancelAnimationFrame(animationId);

  waveform.querySelectorAll('.bar').forEach(bar => {
    bar.style.height = '4px';
  });
}


// ----------------------------------------------
// POLLING
// ----------------------------------------------
setInterval(fetchIcecast, 8000);


// ----------------------------------------------
// AUTO-SELECT FIRST STATION
// ----------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const first = document.querySelector(".station-row[data-icecast='true']");
  if (first) {
    currentStream = first.dataset.stream;
    currentMount = first.dataset.mount;

    audioPlayer.src = currentStream;
    setActiveRow(first);

    fetchIcecast();
    renderTrackHistory();
  }
});

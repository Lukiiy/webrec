const recordButton = document.getElementById('record');
const elements = {
  fps: document.getElementById('fps'),
  cursor: document.getElementById('cursor-vis'),
  microphone: document.getElementById('phone'),
  bitrate: document.getElementById('bitrate')
};

const settings = Object.fromEntries(
  Object.entries(elements).map(([key, el]) => [key, key === 'fps' || key === 'bitrate' ? el.value : el.checked])
);

const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9") ? 
  "video/webm; codecs=vp9" : "video/webm";

let mediaRecorder;
let isRecording = false;
let recordedChunks = [];
let recordingCount = 0;

// Event listeners ;)
Object.entries(elements).forEach(([key, el]) => {
  el.addEventListener('input', () => 
    settings[key] = key === 'fps' || key === 'bitrate' ? el.value : el.checked
  );
});

async function recorder() {
  if (isRecording) {
    mediaRecorder.stop();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: settings.microphone,
      video: {
        mediaSource: "screen",
        frameRate: settings.fps,
        cursor: settings.cursor,
        surfaceSwitching: true
      },
      systemAudio: "include"
    });

    mediaRecorder = new MediaRecorder(stream, { 
      mimeType: mime, 
      videoBitsPerSecond: settings.bitrate * 1000 
    });
    
    mediaRecorder.ondataavailable = ({data}) => data.size && recordedChunks.push(data);
    mediaRecorder.onstop = () => {
      download();
      toggleRecording(false);
      isRecording = false;
    };

    mediaRecorder.start(1000);
    toggleRecording(true);
    isRecording = true;
  } catch (error) {
    console.error("Recording error:", error);
  }
}

function download(start = 0, end = recordedChunks.length) {
  const blob = new Blob(recordedChunks.slice(start, end), { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `recording_${++recordingCount}.webm`;
  link.click();
  
  URL.revokeObjectURL(url);
  recordedChunks = [];
}

function clip() {
  const minimumSeconds = 60;
  const requiredChunks = settings.fps * minimumSeconds;
  
  if (recordedChunks.length >= requiredChunks) {
    download(Math.max(recordedChunks.length - requiredChunks, 0));
  } else {
    alert(`You need at least ${minimumSeconds} seconds of recording!`);
  }
}

document.querySelectorAll('.numI').forEach(input => {
  input.setAttribute("pattern", "\\d*");
  input.addEventListener('input', e => 
    e.target.value = e.target.value.replace(/\D/g, '')
  );
});

window.addEventListener('beforeunload', e => {
  if (isRecording && !confirm("Close the page while recording?")) {
    e.preventDefault();
  } else {
    download();
  }
});

function toggleRecording(active) {
  recordButton.textContent = active ? "End" : "Record";
  recordButton.classList.toggle('active', active);
}
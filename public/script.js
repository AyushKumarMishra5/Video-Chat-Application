const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer();
const myVideo = document.createElement('video');
myVideo.muted = true;

let myStream;
const peers = {};
const videoElements = new Map();

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myStream = stream;
  addVideoStream('me', myVideo, stream);

  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');

    call.on('stream', userVideoStream => {
      if (!videoElements.has(call.peer)) {
        addVideoStream(call.peer, video, userVideoStream);
      }
    });

    call.on('error', err => {
      console.error('Error in received call:', err);
    });

    call.on('close', () => {
      removeVideoStream(call.peer);
    });

    peers[call.peer] = call;
  });

  socket.on('user-connected', userId => {
    setTimeout(() => {
      connectToNewUser(userId, stream);
    }, 1000);
  });
});

socket.on('user-disconnected', userId => {
  if (peers[userId]) {
    peers[userId].close();
    removeVideoStream(userId);
    delete peers[userId];
  }
});

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');

  call.on('stream', userVideoStream => {
    if (!videoElements.has(userId)) {
      addVideoStream(userId, video, userVideoStream);
    }
  });

  call.on('close', () => {
    removeVideoStream(userId);
  });

  call.on('error', err => {
    console.error('Error in outgoing call:', err);
  });

  peers[userId] = call;
}

function addVideoStream(userId, video, stream) {
  if (videoElements.has(userId)) return;

  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });

  const card = document.createElement('div');
  card.classList.add('video-card');
  card.appendChild(video);

  videoGrid.appendChild(card);
  videoElements.set(userId, card);
}

function removeVideoStream(userId) {
  const card = videoElements.get(userId);
  if (card) {
    card.remove();
    videoElements.delete(userId);
  }
}
document.getElementById('muteButton').addEventListener('click', () => {
  const audioTrack = myStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  const icon = document.querySelector('#muteButton i');
  icon.className = audioTrack.enabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
  document.getElementById('muteButton').classList.toggle('active');
});
document.getElementById('cameraButton').addEventListener('click', () => {
  const videoTrack = myStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  const icon = document.querySelector('#cameraButton i');
  icon.className = videoTrack.enabled ? 'fas fa-video' : 'fas fa-video-slash';
  document.getElementById('cameraButton').classList.toggle('active');
});
document.getElementById('endCallBtn').addEventListener('click', () => {
  for (let track of myStream.getTracks()) {
    track.stop();
  }
  socket.disconnect();
  window.location.href = '/';
});

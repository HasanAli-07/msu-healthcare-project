function updateCurrentTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = new Date().toLocaleString();
    }
}

// Update time every second
setInterval(updateCurrentTime, 1000);
updateCurrentTime(); // Initial update

// Global variables
let peer = null;
let localStream = null;
let peers = {};
let currentRoom = null;
let meetingPassword = null;
let participants = new Map(); // Store participant information

// Generate a unique meeting ID
function generateMeetingId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return ${timestamp}-${randomStr};
}

// DOM Elements
const joinContainer = document.getElementById('join-container');
const meetingContainer = document.getElementById('meeting-container');
const loadingIndicator = document.getElementById('loading-indicator');
const usernameCreateInput = document.getElementById('username-create');
const usernameJoinInput = document.getElementById('username-join');
const roomIdInput = document.getElementById('room-id');
const meetingPasswordInput = document.getElementById('meeting-password');
const joinPasswordInput = document.getElementById('join-password');
const createBtn = document.getElementById('create-btn');
const joinBtn = document.getElementById('join-btn');
const toggleVideoBtn = document.getElementById('toggle-video');
const toggleAudioBtn = document.getElementById('toggle-audio');
const shareScreenBtn = document.getElementById('share-screen');
const leaveBtn = document.getElementById('leave-btn');
const roomCreated = document.getElementById('room-created');
const displayedRoomId = document.getElementById('displayed-room-id');
const displayedPassword = document.getElementById('displayed-password');
const copyRoomBtn = document.getElementById('copy-room-btn');
const copyPasswordBtn = document.getElementById('copy-password-btn');
const remoteVideos = document.getElementById('remote-videos');
const participantsList = document.getElementById('participants-list');

// Additional DOM Elements
const activeMeetingId = document.getElementById('active-meeting-id');
const copyActiveIdBtn = document.getElementById('copy-active-id');
const connectionStatus = document.getElementById('connection-status');

// Get available media devices
async function listMediaDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        
        console.log('Available video devices:', videoDevices);
        console.log('Available audio devices:', audioDevices);
        
        return { videoDevices, audioDevices };
    } catch (error) {
        console.error('Error listing media devices:', error);
        return { videoDevices: [], audioDevices: [] };
    }
}

// Get local media stream with specific device constraints
async function getLocalStream() {
    try {
        // First, list available devices
        const { videoDevices, audioDevices } = await listMediaDevices();
        
        console.log('Video devices found:', videoDevices.length);
        console.log('Audio devices found:', audioDevices.length);

        // Try to get both video and audio if available
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: videoDevices.length > 0,
                audio: audioDevices.length > 0
            });
        } catch (err) {
            // If video fails, try audio only
            console.log('Failed to get video, trying audio only');
            localStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true
            });
            alert('No camera detected. Joining with audio only.');
        }

        // Set the stream to video element if we have one
        const videoElement = document.getElementById('local-video');
        if (videoElement) {
            videoElement.srcObject = localStream;
        }

        // Update UI based on available devices
        if (videoDevices.length === 0) {
            toggleVideoBtn.style.display = 'none';
            shareScreenBtn.style.display = 'none';
        }
        
        return true;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        if (error.name === 'NotFoundError') {
            alert('No microphone or camera found. Please connect at least a microphone to join the meeting.');
        } else {
            alert('Failed to access media devices. Please make sure:\n1. Your browser has permission to access camera/microphone\n2. No other application is using your devices\n3. Your devices are properly connected');
        }
        return false;
    }
}

// Update participants list
function updateParticipantsList() {
    participantsList.innerHTML = '';
    participants.forEach((name, peerId) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <span class="avatar">👤</span>
            <span class="participant-name">${name}</span>
        `;
        participantsList.appendChild(item);
    });
}

// Function to update meeting info display
function updateMeetingInfo(meetingId) {
    if (activeMeetingId) {
        activeMeetingId.textContent = meetingId;
    }
}

// Function to update connection status
function updateConnectionStatus(isConnected) {
    if (connectionStatus) {
        connectionStatus.textContent = isConnected ? 'Connected' : 'Disconnected';
        connectionStatus.className = 'status-badge' + (isConnected ? '' : ' disconnected');
    }
}

// Initialize peer connection
function initializePeer(username) {
    peer = new Peer(undefined, {
        host: '0.peerjs.com',
        port: 443,
        secure: true
    });

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        // Add ourselves to participants list
        participants.set(id, username);
        updateParticipantsList();
    });

    // Handle incoming connections
    peer.on('connection', (conn) => {
        console.log('Incoming peer connection!');
        
        conn.on('data', (data) => {
            if (data.type === 'join') {
                // Verify password
                if (data.password !== meetingPassword) {
                    conn.send({
                        type: 'error',
                        message: 'Incorrect password'
                    });
                    return;
                }

                // Add new participant
                participants.set(data.peerId, data.username);
                updateParticipantsList();

                // Send current participants list
                conn.send({
                    type: 'participants',
                    participants: Array.from(participants.entries())
                });

                // Call the new participant
                callPeer(data.peerId, data.username);
            }
        });

        peers[conn.peer] = conn;
    });

    // Handle incoming calls
    peer.on('call', (call) => {
        call.answer(localStream);
        
        call.on('stream', (remoteStream) => {
            addParticipantVideo(call.peer, remoteStream);
        });
    });

    peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        alert('Connection error: ' + error.message);
    });
}

// Call a peer
function callPeer(peerId, username) {
    console.log('Calling peer:', peerId);
    const call = peer.call(peerId, localStream);
    
    call.on('stream', (remoteStream) => {
        // Add new participant's video
        addParticipantVideo(peerId, remoteStream, username);
    });

    call.on('error', (error) => {
        console.error('Call error:', error);
        alert('Error connecting to peer: ' + error.message);
    });
}

// Add a new participant's video to the grid
function addParticipantVideo(peerId, stream, username = 'Participant') {
    // Check if video container already exists for this peer
    if (document.getElementById(video-${peerId})) {
        return;
    }

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = video-${peerId};

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = username;

    videoContainer.appendChild(video);
    videoContainer.appendChild(label);
    remoteVideos.appendChild(videoContainer);

    // Add no-video placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'no-video-placeholder';
    placeholder.style.display = 'none';
    placeholder.innerHTML = '<span class="avatar">👤</span><p>No video</p>';
    videoContainer.appendChild(placeholder);

    // Show placeholder if video track is disabled or missing
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack || !videoTrack.enabled) {
        placeholder.style.display = 'flex';
    }
}

// Update the create meeting handler
createBtn.addEventListener('click', async () => {
    const username = usernameCreateInput.value.trim();
    const password = meetingPasswordInput.value.trim();
    
    if (!username || !password) {
        alert('Please enter your name and set a meeting password');
        return;
    }

    if (password.length < 4) {
        alert('Password must be at least 4 characters long');
        return;
    }

    try {
        loadingIndicator.style.display = 'block';
        
        if (await getLocalStream()) {
            currentRoom = generateMeetingId();
            meetingPassword = password;

            // Display meeting info in both places
            displayedRoomId.textContent = currentRoom;
            displayedPassword.textContent = meetingPassword;
            updateMeetingInfo(currentRoom);
            roomCreated.style.display = 'block';

            peer = new Peer(currentRoom, {
                host: '0.peerjs.com',
                port: 443,
                secure: true
            });

            peer.on('open', (id) => {
                console.log('Created meeting with ID:', id);
                participants.set(id, username);
                updateParticipantsList();
                setupPeerHandlers(username);
                updateConnectionStatus(true);
                
                joinContainer.style.display = 'none';
                meetingContainer.style.display = 'block';
            });

            peer.on('error', (error) => {
                console.error('PeerJS error:', error);
                updateConnectionStatus(false);
                if (error.type === 'unavailable-id') {
                    alert('Meeting ID already in use. Please try again.');
                    location.reload();
                } else {
                    alert('Connection error: ' + error.message);
                }
            });

            peer.on('disconnected', () => {
                updateConnectionStatus(false);
            });

            peer.on('close', () => {
                updateConnectionStatus(false);
            });
        }
    } catch (error) {
        console.error('Error creating meeting:', error);
        alert('Failed to create meeting. Please try again.');
        updateConnectionStatus(false);
    } finally {
        loadingIndicator.style.display = 'none';
    }
});

// Setup peer event handlers
function setupPeerHandlers(username) {
    // Handle incoming connections
    peer.on('connection', (conn) => {
        console.log('Incoming peer connection!');
        
        conn.on('data', (data) => {
            if (data.type === 'join') {
                // Verify password
                if (data.password !== meetingPassword) {
                    conn.send({
                        type: 'error',
                        message: 'Incorrect password'
                    });
                    return;
                }

                // Add new participant
                participants.set(data.peerId, data.username);
                updateParticipantsList();

                // Send current participants list
                conn.send({
                    type: 'participants',
                    participants: Array.from(participants.entries())
                });

                // Call the new participant
                callPeer(data.peerId, data.username);
            }
        });

        peers[conn.peer] = conn;
    });

    // Handle incoming calls
    peer.on('call', (call) => {
        console.log('Incoming call from peer');
        call.answer(localStream);
        
        call.on('stream', (remoteStream) => {
            addParticipantVideo(call.peer, remoteStream);
        });
    });
}

// Update the join meeting handler
joinBtn.addEventListener('click', async () => {
    const username = usernameJoinInput.value.trim();
    const roomId = roomIdInput.value.trim();
    const password = joinPasswordInput.value.trim();
    
    if (!username || !roomId || !password) {
        alert('Please enter your name, meeting ID, and password');
        return;
    }

    try {
        loadingIndicator.style.display = 'block';
        
        if (await getLocalStream()) {
            currentRoom = roomId;
            updateMeetingInfo(currentRoom);

            peer = new Peer(undefined, {
                host: '0.peerjs.com',
                port: 443,
                secure: true
            });

            peer.on('open', (id) => {
                console.log('Connecting to meeting:', roomId);
                const conn = peer.connect(roomId);
                
                conn.on('open', () => {
                    updateConnectionStatus(true);
                    conn.send({
                        type: 'join',
                        username: username,
                        peerId: id,
                        password: password
                    });
                    peers[roomId] = conn;
                });

                conn.on('data', (data) => {
                    if (data.type === 'error') {
                        alert(data.message);
                        location.reload();
                        return;
                    }
                    
                    if (data.type === 'participants') {
                        // Update participants list with existing participants
                        data.participants.forEach(([peerId, name]) => {
                            participants.set(peerId, name);
                        });
                        updateParticipantsList();
                    }
                });

                conn.on('error', (error) => {
                    console.error('Connection error:', error);
                    alert('Failed to join meeting. Please check the meeting ID and try again.');
                    location.reload();
                });

                // Add ourselves to participants list
                participants.set(id, username);
                updateParticipantsList();

                // Setup peer event handlers for receiving calls
                peer.on('call', (call) => {
                    console.log('Receiving call from peer');
                    call.answer(localStream);
                    
                    call.on('stream', (remoteStream) => {
                        addParticipantVideo(call.peer, remoteStream);
                    });
                });

                // Show meeting interface
                joinContainer.style.display = 'none';
                meetingContainer.style.display = 'block';
            });

            peer.on('error', (error) => {
                console.error('PeerJS error:', error);
                updateConnectionStatus(false);
                if (error.type === 'peer-unavailable') {
                    alert('Meeting not found. Please check the meeting ID and try again.');
                } else {
                    alert('Connection error: ' + error.message);
                }
                location.reload();
            });

            peer.on('disconnected', () => {
                updateConnectionStatus(false);
            });

            peer.on('close', () => {
                updateConnectionStatus(false);
            });
        }
    } catch (error) {
        console.error('Error joining meeting:', error);
        alert('Failed to join meeting. Please try again.');
        updateConnectionStatus(false);
    } finally {
        loadingIndicator.style.display = 'none';
    }
});

// Copy buttons
copyRoomBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentRoom)
        .then(() => alert('Meeting ID copied to clipboard!'))
        .catch(err => console.error('Failed to copy meeting ID:', err));
});

copyPasswordBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(meetingPassword)
        .then(() => alert('Password copied to clipboard!'))
        .catch(err => console.error('Failed to copy password:', err));
});

// Toggle video
toggleVideoBtn.addEventListener('click', () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            toggleVideoBtn.textContent = videoTrack.enabled ? 'Toggle Video' : 'Enable Video';
        }
    }
});

// Toggle audio
toggleAudioBtn.addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            toggleAudioBtn.textContent = audioTrack.enabled ? 'Toggle Audio' : 'Unmute';
        }
    }
});

// Share screen
shareScreenBtn.addEventListener('click', async () => {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        videoTrack.onended = () => {
            // Revert to camera when screen sharing ends
            const cameraTrack = localStream.getVideoTracks()[0];
            if (cameraTrack) {
                document.getElementById('local-video').srcObject = localStream;
            }
        };

        document.getElementById('local-video').srcObject = screenStream;
    } catch (error) {
        console.error('Error sharing screen:', error);
        alert('Failed to share screen');
    }
});

// Leave meeting
leaveBtn.addEventListener('click', () => {
    if (peer) {
        peer.destroy();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    meetingContainer.style.display = 'none';
    joinContainer.style.display = 'block';
    roomCreated.style.display = 'none';
    location.reload(); // Refresh the page to reset everything
});

// Add copy button handler for active meeting
copyActiveIdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentRoom)
        .then(() => {
            copyActiveIdBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyActiveIdBtn.textContent = 'Copy ID';
            }, 2000);
        })
        .catch(err => console.error('Failed to copy meeting ID:', err));
});
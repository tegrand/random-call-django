class WebRTCService {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.onSignalCallback = null;
        this.eventListeners = {};
        
        // ICE servers for WebRTC
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
    }

    async initializeStream() {
        try {
            console.log('Getting user media...');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            console.log('Local stream obtained:', this.localStream);
            
            // Emit local stream event
            this.emit('onLocalStream', this.localStream);
            
            return this.localStream;
        } catch (error) {
            console.error('Error getting user media:', error);
            throw error;
        }
    }

    async initializePeerConnection() {
        try {
            console.log('Initializing peer connection...');
            
            // Create RTCPeerConnection
            this.peerConnection = new RTCPeerConnection(this.iceServers);
            
            // Add local stream tracks to peer connection
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }
            
            // Handle remote stream
            this.peerConnection.ontrack = (event) => {
                console.log('Remote track received:', event);
                this.remoteStream = event.streams[0];
                this.emit('onRemoteStream', this.remoteStream);
            };
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('ICE candidate:', event.candidate);
                    if (this.onSignalCallback) {
                        this.onSignalCallback({
                            type: 'ice-candidate',
                            candidate: event.candidate
                        });
                    }
                }
            };
            
            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    this.emit('onConnect');
                }
            };
            
            // Handle ICE connection state changes
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', this.peerConnection.iceConnectionState);
            };
            
            console.log('Peer connection initialized');
            return this.peerConnection;
        } catch (error) {
            console.error('Error initializing peer connection:', error);
            throw error;
        }
    }

    async createOffer() {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        
        try {
            console.log('Creating offer...');
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            console.log('Offer created:', offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            throw error;
        }
    }

    async createAnswer() {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        
        try {
            console.log('Creating answer...');
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log('Answer created:', answer);
            return answer;
        } catch (error) {
            console.error('Error creating answer:', error);
            throw error;
        }
    }

    async handleSignal(signal) {
        if (!this.peerConnection) {
            console.warn('Peer connection not initialized, initializing now...');
            await this.initializePeerConnection();
        }
        
        try {
            console.log('Handling signal:', signal);
            
            if (signal.type === 'offer') {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await this.createAnswer();
                if (this.onSignalCallback) {
                    this.onSignalCallback(answer);
                }
            } else if (signal.type === 'answer') {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.type === 'ice-candidate' && signal.candidate) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (error) {
            console.error('Error handling signal:', error);
            throw error;
        }
    }

    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    onSignal(callback) {
        this.onSignalCallback = callback;
    }

    destroy() {
        console.log('Destroying WebRTC service...');
        
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        // Reset state
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.onSignalCallback = null;
        this.eventListeners = {};
        
        console.log('WebRTC service destroyed');
    }
}

export default WebRTCService; 
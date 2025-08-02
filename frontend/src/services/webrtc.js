class WebRTCService {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.isInitiator = false;
        this.callbacks = {
            onLocalStream: null,
            onRemoteStream: null,
            onSignal: null,
            onConnect: null,
            onError: null
        };
    }

    async initializeStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            if (this.callbacks.onLocalStream) {
                this.callbacks.onLocalStream(this.localStream);
            }
            
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
            throw error;
        }
    }

    createPeerConnection(isInitiator = false) {
        this.isInitiator = isInitiator;
        
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        try {
            this.peerConnection = new RTCPeerConnection(configuration);

            // Add local stream tracks to the peer connection
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }

            // Handle incoming streams
            this.peerConnection.ontrack = (event) => {
                this.remoteStream = event.streams[0];
                if (this.callbacks.onRemoteStream) {
                    this.callbacks.onRemoteStream(this.remoteStream);
                }
            };

            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                if (this.peerConnection.connectionState === 'connected') {
                    console.log('Peer connection established');
                    if (this.callbacks.onConnect) {
                        this.callbacks.onConnect();
                    }
                }
            };

            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    if (this.callbacks.onSignal) {
                        this.callbacks.onSignal({
                            type: 'ice-candidate',
                            candidate: event.candidate
                        });
                    }
                }
            };

            return this.peerConnection;
        } catch (error) {
            console.error('Error creating peer connection:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
            throw error;
        }
    }

    async createOffer() {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            if (this.callbacks.onSignal) {
                this.callbacks.onSignal({
                    type: 'offer',
                    sdp: offer
                });
            }
            
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
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            if (this.callbacks.onSignal) {
                this.callbacks.onSignal({
                    type: 'answer',
                    sdp: answer
                });
            }
            
            return answer;
        } catch (error) {
            console.error('Error creating answer:', error);
            throw error;
        }
    }

    async handleSignal(signal) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            if (signal.type === 'offer') {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                await this.createAnswer();
            } else if (signal.type === 'answer') {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            } else if (signal.type === 'ice-candidate') {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (error) {
            console.error('Error handling signal:', error);
            throw error;
        }
    }

    destroy() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        this.remoteStream = null;
        this.isInitiator = false;
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    getLocalStream() {
        return this.localStream;
    }

    getRemoteStream() {
        return this.remoteStream;
    }

    isConnected() {
        return this.peerConnection && this.peerConnection.connectionState === 'connected';
    }
}

export default WebRTCService; 
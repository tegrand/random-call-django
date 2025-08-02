class WebSocketService {
    constructor() {
        this.socket = null;
        this.callbacks = {
            onMessage: null,
            onOpen: null,
            onClose: null,
            onError: null
        };
    }

    connect(url, token = null) {
        return new Promise((resolve, reject) => {
            try {
                // Add token to URL if provided
                const wsUrl = token ? `${url}?token=${token}` : url;
                this.socket = new WebSocket(wsUrl);

                this.socket.onopen = (event) => {
                    console.log('WebSocket connected');
                    if (this.callbacks.onOpen) {
                        this.callbacks.onOpen(event);
                    }
                    resolve(event);
                };

                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (this.callbacks.onMessage) {
                            this.callbacks.onMessage(data);
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.socket.onclose = (event) => {
                    console.log('WebSocket disconnected');
                    if (this.callbacks.onClose) {
                        this.callbacks.onClose(event);
                    }
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    if (this.callbacks.onError) {
                        this.callbacks.onError(error);
                    }
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

export default WebSocketService; 
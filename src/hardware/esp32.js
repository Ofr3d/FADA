// ESP32 Hardware Integration Layer
import { WebSocketServer } from 'ws';

export class ESP32Manager {
  constructor(port = 8080) {
    this.wsServer = null;
    this.clients = new Map();
    this.port = port;
    this.sensors = {
      temperature: 0,
      humidity: 0,
      vibration: 0,
      filamentFlow: 0
    };
  }

  start() {
    console.log(`🔌 Starting ESP32 WebSocket server on port ${this.port}...`);
    
    this.wsServer = new WebSocketServer({ port: this.port });
    
    this.wsServer.on('connection', (ws, req) => {
      const clientId = `esp32_${Date.now()}`;
      this.clients.set(clientId, ws);
      
      console.log(`✅ ESP32 connected: ${clientId}`);
      
      ws.on('message', (data) => {
        this.handleESP32Data(clientId, data);
      });
      
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`❌ ESP32 disconnected: ${clientId}`);
      });
      
      ws.on('error', (error) => {
        console.log(`ESP32 error: ${error.message}`);
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'MakoAgent ESP32 integration ready',
        timestamp: Date.now()
      }));
    });
    
    console.log('✅ ESP32 server ready');
  }

  handleESP32Data(clientId, rawData) {
    try {
      const data = JSON.parse(rawData.toString());
      
      // Update sensor readings
      if (data.temperature !== undefined) {
        this.sensors.temperature = data.temperature;
      }
      
      if (data.humidity !== undefined) {
        this.sensors.humidity = data.humidity;
      }
      
      if (data.vibration !== undefined) {
        this.sensors.vibration = data.vibration;
      }
      
      if (data.filamentFlow !== undefined) {
        this.sensors.filamentFlow = data.filamentFlow;
      }
      
      console.log(`📊 ESP32 data: T:${this.sensors.temperature}°C H:${this.sensors.humidity}% V:${this.sensors.vibration}`);
      
      // Emit to listeners
      this.notifyListeners('sensorData', this.sensors);
      
    } catch (error) {
      console.log('Failed to parse ESP32 data:', error.message);
    }
  }

  sendCommand(clientId, command, data = {}) {
    const client = this.clients.get(clientId);
    if (client) {
      client.send(JSON.stringify({
        type: 'command',
        command: command,
        data: data,
        timestamp: Date.now()
      }));
    }
  }

  broadcastCommand(command, data = {}) {
    const message = JSON.stringify({
      type: 'command',
      command: command,
      data: data,
      timestamp: Date.now()
    });
    
    this.clients.forEach(client => {
      client.send(message);
    });
  }

  getSensorData() {
    return {
      ...this.sensors,
      connected: this.clients.size > 0,
      timestamp: Date.now()
    };
  }

  addListener(callback) {
    this.listeners = this.listeners || [];
    this.listeners.push(callback);
  }

  notifyListeners(event, data) {
    if (this.listeners) {
      this.listeners.forEach(callback => callback(event, data));
    }
  }

  stop() {
    if (this.wsServer) {
      this.wsServer.close();
      console.log('ESP32 server stopped');
    }
  }
}
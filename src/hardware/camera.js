// Camera integration for ESP32-CAM and external cameras
export class CameraManager {
  constructor() {
    this.streams = new Map();
    this.snapshots = [];
    this.isRecording = false;
  }

  async addCamera(cameraId, streamUrl) {
    console.log(`📷 Adding camera: ${cameraId} at ${streamUrl}`);
    
    this.streams.set(cameraId, {
      url: streamUrl,
      active: false,
      lastSnapshot: null,
      quality: 'medium'
    });
    
    return true;
  }

  async startStream(cameraId) {
    const camera = this.streams.get(cameraId);
    if (camera) {
      camera.active = true;
      console.log(`▶️ Started stream: ${cameraId}`);
      return true;
    }
    return false;
  }

  async stopStream(cameraId) {
    const camera = this.streams.get(cameraId);
    if (camera) {
      camera.active = false;
      console.log(`⏹️ Stopped stream: ${cameraId}`);
      return true;
    }
    return false;
  }

  async takeSnapshot(cameraId) {
    const camera = this.streams.get(cameraId);
    if (camera && camera.active) {
      const snapshot = {
        id: `snap_${Date.now()}`,
        cameraId: cameraId,
        timestamp: Date.now(),
        url: `${camera.url}/snapshot`,
        quality: camera.quality
      };
      
      this.snapshots.push(snapshot);
      camera.lastSnapshot = snapshot;
      
      console.log(`📸 Snapshot taken: ${snapshot.id}`);
      return snapshot;
    }
    return null;
  }

  async startTimelapse(cameraId, intervalSeconds = 30) {
    console.log(`🎬 Starting timelapse on ${cameraId} (${intervalSeconds}s interval)`);
    
    this.timelapseInterval = setInterval(async () => {
      await this.takeSnapshot(cameraId);
    }, intervalSeconds * 1000);
    
    this.isRecording = true;
    return true;
  }

  stopTimelapse() {
    if (this.timelapseInterval) {
      clearInterval(this.timelapseInterval);
      this.timelapseInterval = null;
      this.isRecording = false;
      console.log('⏹️ Timelapse stopped');
    }
  }

  getActiveStreams() {
    const active = [];
    this.streams.forEach((camera, id) => {
      if (camera.active) {
        active.push({
          id: id,
          url: camera.url,
          quality: camera.quality,
          lastSnapshot: camera.lastSnapshot
        });
      }
    });
    return active;
  }

  getRecentSnapshots(limit = 10) {
    return this.snapshots
      .slice(-limit)
      .reverse();
  }

  // ESP32-CAM specific methods
  configureESP32Cam(cameraId, settings = {}) {
    const defaultSettings = {
      resolution: '800x600',
      quality: 10,
      brightness: 0,
      contrast: 0,
      saturation: 0
    };
    
    const config = { ...defaultSettings, ...settings };
    console.log(`🔧 Configuring ESP32-CAM ${cameraId}:`, config);
    
    return config;
  }
}
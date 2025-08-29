// Real-time Print Monitoring
import { QualityAnalyzer } from './quality.js';
import { SpaghettiDetector } from './spaghetti.js';

export class PrintMonitor {
  constructor() {
    this.analyzer = new QualityAnalyzer();
    this.spaghettiDetector = new SpaghettiDetector();
    this.isMonitoring = false;
    this.currentPrint = null;
    this.dataBuffer = {
      temperature: [],
      vibration: [],
      filamentFlow: [],
      positions: []
    };
    this.alerts = [];
    this.currentLayer = 0;
  }

  startMonitoring(printJob) {
    console.log('📈 Starting real-time print monitoring...');
    
    this.isMonitoring = true;
    this.currentPrint = {
      id: `print_${Date.now()}`,
      name: printJob.name || 'Unknown',
      startTime: Date.now(),
      status: 'printing',
      progress: 0
    };
    
    this.clearDataBuffer();
    this.alerts = [];
    
    return this.currentPrint.id;
  }

  stopMonitoring() {
    console.log('⏹️ Stopping print monitoring');
    
    if (this.currentPrint) {
      this.currentPrint.endTime = Date.now();
      this.currentPrint.status = 'completed';
    }
    
    this.isMonitoring = false;
    return this.generateFinalReport();
  }

  updateSensorData(sensorData) {
    if (!this.isMonitoring) return;
    
    // Buffer sensor data
    if (sensorData.temperature !== undefined) {
      this.dataBuffer.temperature.push(sensorData.temperature);
    }
    
    if (sensorData.vibration !== undefined) {
      this.dataBuffer.vibration.push(sensorData.vibration);
    }
    
    if (sensorData.filamentFlow !== undefined) {
      this.dataBuffer.filamentFlow.push(sensorData.filamentFlow);
    }
    
    // Keep buffer size manageable (last 100 readings)
    Object.keys(this.dataBuffer).forEach(key => {
      if (this.dataBuffer[key].length > 100) {
        this.dataBuffer[key] = this.dataBuffer[key].slice(-100);
      }
    });
    
    // Check for real-time issues
    this.checkRealTimeAlerts(sensorData);
  }

  updatePrinterData(printerData) {
    if (!this.isMonitoring) return;
    
    // Update position data
    if (printerData.position) {
      this.dataBuffer.positions.push({
        ...printerData.position,
        timestamp: Date.now()
      });
      
      // Update layer tracking
      this.updateLayerTracking(printerData.position.z);
    }
    
    // Update temperature data
    if (printerData.temperature) {
      this.dataBuffer.temperature.push(printerData.temperature.hotend);
    }
    
    // Calculate progress estimate
    this.estimateProgress(printerData);
    
    // Run spaghetti detection every 10 layers or significant changes
    if (this.currentLayer > 0 && this.currentLayer % 10 === 0) {
      this.runSpaghettiDetection();
    }
  }

  checkRealTimeAlerts(data) {
    const alerts = [];
    
    // Temperature alerts
    if (data.temperature > 250) {
      alerts.push({
        type: 'warning',
        message: 'High temperature detected',
        value: data.temperature,
        timestamp: Date.now()
      });
    }
    
    if (data.temperature < 180 && this.currentPrint.status === 'printing') {
      alerts.push({
        type: 'error',
        message: 'Temperature drop detected',
        value: data.temperature,
        timestamp: Date.now()
      });
    }
    
    // Vibration alerts
    if (data.vibration > 80) {
      alerts.push({
        type: 'warning',
        message: 'Excessive vibration detected',
        value: data.vibration,
        timestamp: Date.now()
      });
    }
    
    // Filament alerts
    if (data.filamentFlow < 100) {
      alerts.push({
        type: 'error',
        message: 'Possible filament jam or runout',
        value: data.filamentFlow,
        timestamp: Date.now()
      });
    }
    
    // Add new alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      console.log(`🚨 ${alert.type.toUpperCase()}: ${alert.message} (${alert.value})`);
    });
    
    // Keep only recent alerts
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo);
  }

  estimateProgress(printerData) {
    if (!this.currentPrint || !printerData.position) return;
    
    // Simple progress estimation based on Z-height
    const maxZ = 200; // Assume 200mm max height for now
    const currentZ = printerData.position.z;
    const progress = Math.min(100, (currentZ / maxZ) * 100);
    
    this.currentPrint.progress = Math.round(progress);
  }

  getCurrentStatus() {
    if (!this.isMonitoring || !this.currentPrint) {
      return { monitoring: false };
    }
    
    const runtime = Date.now() - this.currentPrint.startTime;
    const recentAlerts = this.alerts.slice(-5); // Last 5 alerts
    
    return {
      monitoring: true,
      print: this.currentPrint,
      runtime: runtime,
      alerts: recentAlerts,
      dataPoints: {
        temperature: this.dataBuffer.temperature.length,
        vibration: this.dataBuffer.vibration.length,
        filamentFlow: this.dataBuffer.filamentFlow.length
      }
    };
  }

  generateLiveReport() {
    if (!this.isMonitoring) return null;
    
    // Generate quick quality analysis with current data
    const report = this.analyzer.generateQualityReport(
      { temperatures: this.dataBuffer.temperature },
      {
        vibration: this.dataBuffer.vibration,
        filamentFlow: this.dataBuffer.filamentFlow,
        temperature: this.getLatestValue('temperature'),
        humidity: this.getLatestValue('humidity')
      },
      [] // No G-code analysis in live mode
    );
    
    return {
      ...report,
      printId: this.currentPrint.id,
      progress: this.currentPrint.progress,
      runtime: Date.now() - this.currentPrint.startTime,
      alerts: this.alerts.slice(-10)
    };
  }

  generateFinalReport() {
    if (!this.currentPrint) return null;
    
    console.log('📋 Generating final print report...');
    
    const finalReport = this.analyzer.generateQualityReport(
      { temperatures: this.dataBuffer.temperature },
      {
        vibration: this.dataBuffer.vibration,
        filamentFlow: this.dataBuffer.filamentFlow,
        temperature: this.getAverageValue('temperature'),
        humidity: 50 // Default humidity
      },
      []
    );
    
    return {
      ...finalReport,
      print: this.currentPrint,
      totalRuntime: this.currentPrint.endTime - this.currentPrint.startTime,
      totalAlerts: this.alerts.length,
      dataCollected: {
        temperatureReadings: this.dataBuffer.temperature.length,
        vibrationReadings: this.dataBuffer.vibration.length,
        filamentReadings: this.dataBuffer.filamentFlow.length
      }
    };
  }

  getLatestValue(dataType) {
    const data = this.dataBuffer[dataType];
    return data.length > 0 ? data[data.length - 1] : 0;
  }

  getAverageValue(dataType) {
    const data = this.dataBuffer[dataType];
    if (data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  clearDataBuffer() {
    Object.keys(this.dataBuffer).forEach(key => {
      this.dataBuffer[key] = [];
    });
  }

  updateLayerTracking(currentZ) {
    const layerHeight = 0.2; // Default layer height
    const newLayer = Math.floor(currentZ / layerHeight);
    
    if (newLayer > this.currentLayer) {
      console.log(`📏 Layer ${newLayer} detected (Z: ${currentZ.toFixed(2)}mm)`);
      this.currentLayer = newLayer;
      
      // Run spaghetti detection on critical layers
      if (newLayer <= 5 || newLayer % 20 === 0) {
        this.runSpaghettiDetection();
      }
    }
  }

  runSpaghettiDetection() {
    console.log(`🍝 Running spaghetti detection for layer ${this.currentLayer}...`);
    
    // Simulate G-code analysis data
    const gcodeAnalysis = {
      layers: {
        [this.currentLayer]: {
          overhangs: this.currentLayer > 10 ? Math.floor(Math.random() * 3) : 0,
          bridges: this.currentLayer > 15 ? Math.floor(Math.random() * 2) : 0,
          smallFeatures: Math.floor(Math.random() * 5),
          solidInfill: Math.random(),
          supportMaterial: Math.random() > 0.7
        }
      }
    };
    
    // Get camera data (simulated)
    const cameraData = {
      lastSnapshot: { url: 'simulated', timestamp: Date.now() }
    };
    
    // Run detection
    const detection = this.spaghettiDetector.analyzeCurrentPrint(
      cameraData,
      {
        vibration: this.dataBuffer.vibration,
        temperature: this.dataBuffer.temperature,
        filamentFlow: this.dataBuffer.filamentFlow
      },
      gcodeAnalysis,
      this.currentLayer
    );
    
    // Handle high-confidence spaghetti detection
    if (detection.confidence > 0.7) {
      const spaghettiAlert = {
        type: 'spaghetti_risk',
        message: `High spaghetti risk detected on layer ${this.currentLayer}`,
        confidence: detection.confidence,
        recommendation: detection.recommendation,
        timestamp: Date.now()
      };
      
      this.alerts.push(spaghettiAlert);
      console.log(`🚨 SPAGHETTI ALERT: ${spaghettiAlert.message} (${(detection.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`📋 Recommendation: ${detection.recommendation.message}`);
      
      // Log risk factors
      if (detection.riskFactors.length > 0) {
        console.log('Risk factors:');
        detection.riskFactors.forEach(factor => {
          console.log(`  • ${factor.description} (${factor.risk} risk)`);
        });
      }
    } else if (detection.confidence > 0.4) {
      console.log(`⚠️ Moderate spaghetti risk: ${(detection.confidence * 100).toFixed(1)}% confidence`);
    }
    
    return detection;
  }

  reportSpaghettiOutcome(wasActualSpaghetti) {
    this.spaghettiDetector.reportFeedback(wasActualSpaghetti);
    const stats = this.spaghettiDetector.getDetectionStats();
    console.log(`🎯 Detection accuracy: ${(stats.accuracy * 100).toFixed(1)}%`);
  }

  getSpaghettiStats() {
    return this.spaghettiDetector.getDetectionStats();
  }

  getRecentAlerts(count = 10) {
    return this.alerts.slice(-count).reverse();
  }
}
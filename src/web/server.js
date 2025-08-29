// Simple web interface for MakoAgent
import express from 'express';

export class WebServer {
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>🦎 MakoAgent</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
            .ready { background: #d4edda; color: #155724; }
            .monitoring { background: #cce5ff; color: #004085; }
            .metric { display: inline-block; margin: 10px 20px; }
            .alerts { background: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🦎 MakoAgent</h1>
            <p>3D Printing Monitoring, Quality Analysis & Calibration Tool</p>
            
            <div class="status ready">
              <strong>✅ System Ready</strong>
            </div>
            
            <div class="status monitoring">
              <strong>🧠 AI Quality Analysis Active</strong>
            </div>
            
            <h3>📊 Current Status</h3>
            <div class="metric">🌡️ Temperature: Monitoring</div>
            <div class="metric">📳 Vibration: Analyzing</div>
            <div class="metric">🎯 Flow Rate: Tracking</div>
            
            <h3>🔧 Available Features</h3>
            <ul>
              <li>Real-time print quality monitoring</li>
              <li>Advanced spaghetti detection with minimal false positives</li>
              <li>Temperature and vibration analysis</li>
              <li>Automated issue detection</li>
              <li>ESP32 hardware integration</li>
              <li>Automated calibration assistance</li>
            </ul>
            
            <div class="alerts">
              <strong>💡 Tip:</strong> Connect your ESP32 to ws://localhost:8080 for advanced sensor monitoring
            </div>
            
            <p><small>MakoAgent v0.1.0 - Standalone 3D Printing Intelligence</small></p>
          </div>
          
          <script>
            // Auto-refresh status every 30 seconds
            setTimeout(() => location.reload(), 30000);
          </script>
        </body>
        </html>
      `);
    });

    // API endpoints for quality data
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'ready',
        monitoring: true,
        features: ['quality-analysis', 'esp32-integration', 'temperature-monitoring']
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Web interface running on http://localhost:${this.port}`);
    });
  }
}
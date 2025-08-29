// MakoAgent - 3D Printing Monitoring & Calibration Tool
import { PrinterMonitor } from './core/printer.js';
import { WebServer } from './web/server.js';
import { SetupHelper } from './core/setup.js';
import { ESP32Manager } from './hardware/esp32.js';
import { CameraManager } from './hardware/camera.js';
import { PrintMonitor } from './analysis/monitor.js';
import { CalibrationWizard } from './calibration/wizard.js';

console.log('🦎 MakoAgent starting...');

const app = {
  async start() {
    console.log('🦎 MakoAgent v0.1.0 - Ready for 3D printing excellence');
    
    // Initialize calibration system
    const wizard = new CalibrationWizard();
    console.log('Calibration system: Initializing automated calibration assistant...');
    
    // Auto-setup on first run
    const setup = new SetupHelper();
    const config = await setup.autoDetectSetup();
    
    // Initialize print quality monitoring
    const printMonitor = new PrintMonitor();
    console.log('Quality analysis: Initializing AI-powered print monitoring...');
    
    // Initialize hardware integration
    const esp32 = new ESP32Manager();
    const camera = new CameraManager();
    console.log('Hardware integration: Initializing ESP32 and camera support...');
    esp32.start();
    
    // Initialize printer monitoring
    const printer = new PrinterMonitor();
    console.log('Monitoring system: Initializing...');
    
    // Scan for printers
    console.log('Hardware detection: Scanning ports...');
    const ports = await printer.detectPrinters();
    console.log(`Found ${ports.length} potential printer(s)`);
    
    // Auto-connect if we found a printer
    if (config.printerPort && ports.length > 0) {
      console.log(`🔌 Auto-connecting to ${config.printerPort}...`);
      try {
        await printer.connect(config.printerPort);
      } catch (error) {
        console.log('Auto-connection failed, manual setup needed');
      }
    }
    
    // Start web interface
    const webServer = new WebServer();
    console.log('Web interface: Starting on http://localhost:3000');
    webServer.start();
    
    // Connect data streams for quality analysis
    esp32.addListener((event, data) => {
      if (event === 'sensorData') {
        printMonitor.updateSensorData(data);
      }
    });
    
    printer.addListener((event, data) => {
      if (event === 'data') {
        printMonitor.updatePrinterData(data);
      }
    });
    
    // Auto-start monitoring when print begins
    printer.addListener((event, data) => {
      if (event === 'connected' && !printMonitor.isMonitoring) {
        printMonitor.startMonitoring({ name: 'Auto-detected print' });
        console.log('🎯 Auto-started print quality monitoring');
      }
    });
    
    // Show calibration menu on first run
    if (config.firstRun) {
      setTimeout(() => {
        console.log('\n🧙‍♂️ First time setup detected!');
        console.log('Run the setup wizard to optimize your printer:');
        console.log('  • Automatic bed leveling');
        console.log('  • E-steps calibration');
        console.log('  • Temperature optimization');
        console.log('Visit http://localhost:3000 to get started');
      }, 3000);
    }
    
    // Show quick start guide with calibration info
    console.log(setup.generateQuickStart());
    console.log('\n🔌 ESP32 WebSocket server: ws://localhost:8080');
    console.log('📷 Camera streams: Ready for ESP32-CAM');
    console.log('🧠 AI Quality Analysis: Active monitoring enabled');
    console.log('🔧 Calibration Assistant: Ready for bed leveling, E-steps, and temperature tuning');
    console.log('✅ MakoAgent ready with complete 3D printing intelligence');
  }
};

app.start().catch(console.error);
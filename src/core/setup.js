// Auto-setup and configuration helper
export class SetupHelper {
  constructor() {
    this.config = {
      firstRun: true,
      printerPort: null,
      baudRate: 115200,
      webPort: 3000
    };
  }

  async autoDetectSetup() {
    console.log('🔍 Auto-detecting optimal settings...');
    
    // Try to find the most likely printer port
    const { PrinterMonitor } = await import('./printer.js');
    const printer = new PrinterMonitor();
    const ports = await printer.detectPrinters();
    
    if (ports.length > 0) {
      // Pick the first available port
      this.config.printerPort = ports[0].path;
      console.log(`  Found printer on: ${this.config.printerPort}`);
    } else {
      console.log('  No printers detected - manual setup needed');
    }

    return this.config;
  }

  async testConnection(port, baudRate = 115200) {
    console.log(`🔌 Testing connection to ${port}...`);
    
    try {
      const { PrinterMonitor } = await import('./printer.js');
      const printer = new PrinterMonitor();
      
      await printer.connect(port, baudRate);
      
      // Test basic communication
      printer.sendCommand('M105'); // Temperature check
      
      setTimeout(() => {
        printer.disconnect();
        console.log('✅ Connection test successful');
      }, 2000);
      
      return true;
    } catch (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
  }

  generateQuickStart() {
    return `
🦎 MakoAgent Quick Start
=======================

1. Connect your 3D printer via USB
2. Run: npm start
3. Open: http://localhost:3000
4. Start monitoring!

Detected Settings:
- Port: ${this.config.printerPort || 'Auto-detect'}
- Baud: ${this.config.baudRate}
- Web: http://localhost:${this.config.webPort}
`;
  }
}
// Universal Printer Communication Layer
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { GCodeMonitor } from './gcode.js';

export class PrinterMonitor {
  constructor() {
    this.port = null;
    this.parser = null;
    this.status = 'idle';
    this.gcode = new GCodeMonitor();
    this.listeners = [];
  }

  async detectPrinters() {
    console.log('Scanning for printers...');
    try {
      const ports = await SerialPort.list();
      return ports.filter(port => 
        port.vendorId || 
        port.productId || 
        port.path.includes('tty') || 
        port.path.includes('COM')
      );
    } catch (error) {
      console.log('Port scanning error:', error.message);
      return [];
    }
  }

  async connect(portPath, baudRate = 115200) {
    try {
      console.log(`Connecting to printer on ${portPath}...`);
      
      this.port = new SerialPort({
        path: portPath,
        baudRate: baudRate
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
      
      this.parser.on('data', (line) => {
        const data = this.gcode.parseResponse(line);
        this.notifyListeners('data', data);
      });

      this.port.on('open', () => {
        this.status = 'connected';
        console.log('✅ Printer connected');
        this.notifyListeners('connected');
      });

      this.port.on('error', (err) => {
        console.log('Connection error:', err.message);
        this.status = 'error';
      });

    } catch (error) {
      console.log('Failed to connect:', error.message);
      throw error;
    }
  }

  sendCommand(command) {
    if (this.port && this.port.isOpen) {
      this.port.write(command + '\n');
      console.log('→', command);
    }
  }

  getStatus() {
    this.sendCommand(this.gcode.generateStatusCommand());
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }

  disconnect() {
    if (this.port) {
      this.port.close();
      console.log('Disconnecting printer...');
      this.status = 'idle';
    }
  }
}
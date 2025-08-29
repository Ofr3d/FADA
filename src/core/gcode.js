// G-code parser and monitor for universal printer compatibility
export class GCodeMonitor {
  constructor() {
    this.currentPosition = { x: 0, y: 0, z: 0 };
    this.temperature = { hotend: 0, bed: 0 };
    this.isHomed = false;
  }

  parseResponse(line) {
    line = line.trim();
    
    // Temperature reports: T:210.0 /210.0 B:60.0 /60.0
    if (line.includes('T:')) {
      const temp = line.match(/T:([0-9.]+)/);
      if (temp) this.temperature.hotend = parseFloat(temp[1]);
    }
    
    if (line.includes('B:')) {
      const temp = line.match(/B:([0-9.]+)/);
      if (temp) this.temperature.bed = parseFloat(temp[1]);
    }

    // Position reports: X:150.0 Y:150.0 Z:10.0
    const xMatch = line.match(/X:([0-9.-]+)/);
    const yMatch = line.match(/Y:([0-9.-]+)/);
    const zMatch = line.match(/Z:([0-9.-]+)/);
    
    if (xMatch) this.currentPosition.x = parseFloat(xMatch[1]);
    if (yMatch) this.currentPosition.y = parseFloat(yMatch[1]);
    if (zMatch) this.currentPosition.z = parseFloat(zMatch[1]);

    return {
      position: this.currentPosition,
      temperature: this.temperature,
      raw: line
    };
  }

  generateStatusCommand() {
    return 'M105'; // Temperature status
  }
}
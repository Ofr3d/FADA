# 🦎 MakoAgent

Standalone 3D printing monitoring, print quality improvement assistant and calibration tool.

## Quick Install

```bash
npm install
npm start
```

That's it! MakoAgent will:
- Auto-detect your 3D printer
- Set up the web interface 
- Create desktop shortcuts
- Start monitoring immediately

## Features

- ✅ Universal printer compatibility (any G-code printer)
- ✅ Real-time temperature and position monitoring
- ✅ Zero-drama installation and setup
- ✅ ESP32 hardware integration with sensor support
- ✅ AI-powered print quality analysis
- ✅ Automated calibration tools (bed leveling, E-steps, temperature)

## Usage

1. Connect your 3D printer via USB
2. Run `npm start`
3. Open http://localhost:3000
4. Start monitoring your prints!

## System Requirements

- Node.js 18+
- USB port for printer connection
- Any G-code compatible 3D printer (Marlin, Klipper, etc.)

## Troubleshooting

**No printer detected?**
- Check USB connection
- Verify printer is powered on
- Try different USB port/cable

**Installation issues?**
- Run `npm install` manually
- Check Node.js version with `node --version`
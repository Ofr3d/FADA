# 3D Printer Failure Detection System Specification

## Philosophy
**Mission**: Prevent the most common 3D printing failures through simple, reliable monitoring that any maker can afford and install.

**Core Values**:
- Solve real problems first, add features later
- Accessible pricing for hobbyist makers
- Simple installation and maintenance
- Community-driven improvement

## System Overview
A camera-based monitoring system that detects print failures early and alerts users via smartphone. Focus on the 80/20 rule: catch the failures that waste the most time and material.

## User Experience

### Primary Workflow
1. **Install**: Mount camera above print bed, connect to Wi-Fi
2. **Monitor**: Automatic failure detection with phone notifications
3. **Improve**: System learns your printer's normal behavior over time

### Interface
- **Mobile app**: Live view, alerts, and basic settings
- **LED indicator**: Red/green status light on device
- **Push notifications**: Immediate alerts for detected failures

## Hardware Architecture

### Camera System
- **Sensor**: 5MP fixed-focus camera optimized for print bed viewing
- **Mounting**: Simple clamp or magnetic mount for bed-level positioning
- **Lighting**: Basic LED strip for consistent illumination
- **Field of view**: Wide angle to cover standard print beds (220x220mm+)

### Core Sensors
- **Temperature**: Single ambient sensor for environmental monitoring
- **Connectivity**: Wi-Fi only (Raspberry Pi Zero 2W or similar)
- **Storage**: 16GB SD card for local image buffering
- **Power**: USB-C, 5V/2A maximum

### Processing
- **Compute**: ARM-based SBC with basic AI inference capability
- **Local processing**: All analysis runs on-device
- **No cloud dependency**: Works without internet after setup

## Software Systems

### Failure Detection (Priority Order)
1. **Spaghetti detection**: Filament tangles and layer separation
2. **First layer failure**: Poor bed adhesion and warping
3. **Print detachment**: Object separation from bed
4. **Filament runout**: Simple optical detection

### Smart Features
- **Baseline learning**: 2-week calibration period to learn normal prints
- **False positive reduction**: User feedback improves accuracy
- **Print time estimation**: Basic remaining time calculations

## Privacy & Data

### Local-First Design
- **No cloud required**: Full functionality offline after setup
- **Local storage**: Images stored locally, auto-deleted after 7 days
- **Optional sharing**: Users can manually share failure images for community model improvement

### Data Collection
- **Minimal telemetry**: Only failure timestamps and printer type (if shared)
- **No print images**: Unless explicitly shared by user
- **Open dataset**: Community contributions go to public training dataset

## Pre-Print Checks

### Basic Validation
- **Bed clear**: Simple object detection before print start
- **Nozzle ready**: Temperature stability check
- **Filament present**: Optical sensor confirms material loaded

## Technical Specifications

### Performance Targets
- **Detection time**: <30 seconds for obvious failures
- **Power usage**: <10W during operation
- **False positives**: <10% after learning period
- **Price target**: <$75 in materials for DIY build

### Compatibility
- **Printer support**: Any printer with accessible print bed
- **Firmware**: Works with Marlin, Klipper via G-code injection or serial monitoring
- **Integration**: Optional slicer plugins for enhanced features

### Development
- **License**: Fully open-source hardware and software
- **Platform**: Standard Raspberry Pi ecosystem for easy development
- **Documentation**: Complete build guide with common 3D printed parts

## Development Roadmap

### Version 1.0 (Months 1-4): Core Detection
- Spaghetti and detachment detection
- Basic mobile app with live view
- Simple mount and installation

### Version 1.5 (Months 5-8): Refinement
- First layer failure detection
- Improved accuracy through user feedback
- Better mounting options

### Version 2.0 (Months 9-12): Intelligence & Maintenance
- Learning algorithms for false positive reduction
- Calibration assistant for bed leveling and flow rates
- Preventative maintenance tracking and alerts
- Community model sharing

### Future Considerations
- Multi-printer support
- Advanced materials detection
- Integration with printer firmware

## Success Metrics
- **Primary**: Reduce failed print waste by 70%+ for typical users
- **Secondary**: <5 minute average setup time
- **Adoption**: Target $50-75 retail price point for broad accessibility

## Risks & Mitigation
- **Camera positioning**: Provide multiple mounting solutions and clear setup guides
- **Lighting variations**: Include basic LED lighting and calibration routine
- **Network reliability**: Ensure core functionality works without constant connectivity

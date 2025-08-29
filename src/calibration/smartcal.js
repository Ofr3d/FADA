// Smart Calibration System - ESP32 + 48MP Camera Analysis
import { ReferenceCalibrationPrints } from './referenceprints.js';

export class SmartCalibrationSystem {
  constructor() {
    this.devicePosition = 'unknown'; // 'calibration', 'monitoring', 'unknown'
    this.calibrationTests = {};
    this.referencePrints = new ReferenceCalibrationPrints();
    this.isRunning = false;
    this.pendingChanges = [];
    this.positionCalibration = null;
  }

  async detectDevicePosition() {
    console.log('🔍 Detecting MakoAgent device position...');
    
    // Use camera + IMU to detect if device is in calibration position
    const cameraView = await this.getCameraView();
    const magneticField = await this.readMagneticSensor();
    
    // Analyze field of view to determine position
    const bedVisible = this.analyzeBedVisibility(cameraView);
    const magneticLock = magneticField.strength > 0.8; // Strong magnetic attachment
    
    if (bedVisible && magneticLock) {
      this.devicePosition = 'calibration';
      console.log('📍 Device detected in CALIBRATION position');
      return { position: 'calibration', confidence: 0.95 };
    } else if (!bedVisible && magneticLock) {
      this.devicePosition = 'monitoring';
      console.log('📍 Device detected in MONITORING position');
      return { position: 'monitoring', confidence: 0.90 };
    } else {
      this.devicePosition = 'unknown';
      console.log('❓ Device position unknown - please position device');
      return { position: 'unknown', confidence: 0.1 };
    }
  }

  async startFullCalibrationSequence(filamentType = 'PLA') {
    console.log('🚀 Starting Smart Calibration Sequence...');
    console.log(`📦 Target filament: ${filamentType}`);
    
    // Verify device is in calibration position
    const position = await this.detectDevicePosition();
    if (position.position !== 'calibration') {
      throw new Error('Device must be in calibration position. Please attach to calibration mount.');
    }

    this.isRunning = true;
    
    // Generate reference-based calibration sequence
    const sequence = this.referencePrints.generateCalibrationSequence(filamentType);
    
    console.log('📋 Reference-based calibration sequence ready');
    console.log(`⏱️ Total estimated time: ${this.calculateTotalTime(sequence)} minutes`);

    const results = {};
    
    // Step 1: Always start with positioning reference
    console.log('\n📐 Step 1: Positioning Reference Print');
    await this.establishPositionReference();
    
    // Run each calibration test with reference prints
    for (const step of sequence.slice(1)) { // Skip positioning reference (already done)
      console.log(`\n🔬 Step ${step.step}: ${step.name.toUpperCase()}`);
      console.log(`📋 Purpose: ${step.purpose}`);
      results[step.name] = await this.runReferenceBasedTest(step, filamentType);
    }

    return this.generateCalibrationReport(results, filamentType);
  }

  async runCalibrationTest(testType, filamentType) {
    switch (testType) {
      case 'flow_calibration':
        return await this.runFlowCalibration(filamentType);
      case 'volumetric_flow':
        return await this.runVolumetricFlowTest(filamentType);
      case 'input_shaping':
        return await this.runInputShapingTest();
      case 'temperature_optimization':
        return await this.runTemperatureOptimization(filamentType);
      case 'eddy_bed_leveling':
        return await this.runEddyBedLeveling();
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }
  }

  async runFlowCalibration(filamentType) {
    console.log('📐 Printing flow calibration test objects...');
    
    // Generate and print flow test cubes (90%, 95%, 100%, 105%, 110%)
    const flowRates = [90, 95, 100, 105, 110];
    const testResults = [];
    
    for (const flowRate of flowRates) {
      console.log(`  Printing ${flowRate}% flow rate cube...`);
      
      // Command printer to print test cube
      await this.printFlowTestCube(flowRate, filamentType);
      
      // Wait for print completion
      await this.waitForPrintCompletion();
      
      // Analyze with 48MP camera
      const analysis = await this.analyze48MPImage('flow_test', flowRate);
      testResults.push({
        flowRate,
        dimensionalAccuracy: analysis.dimensions,
        surfaceQuality: analysis.surface,
        overextrusion: analysis.overextrusion,
        underextrusion: analysis.underextrusion,
        score: this.calculateFlowScore(analysis)
      });
      
      console.log(`  ${flowRate}% flow: Score ${testResults[testResults.length-1].score}/100`);
    }
    
    // Find optimal flow rate
    const bestFlow = testResults.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    console.log(`✅ Optimal flow rate: ${bestFlow.flowRate}%`);
    
    return {
      optimalFlow: bestFlow.flowRate,
      confidence: bestFlow.score / 100,
      allResults: testResults,
      recommendation: `Set flow rate to ${bestFlow.flowRate}% for ${filamentType}`
    };
  }

  async runVolumetricFlowTest(filamentType) {
    console.log('🌊 Testing maximum volumetric flow rate...');
    
    const flowRates = [5, 10, 15, 20, 25, 30]; // mm³/s
    const testResults = [];
    
    for (const rate of flowRates) {
      console.log(`  Testing ${rate} mm³/s flow rate...`);
      
      // Print flow test at increasing speeds
      await this.printVolumetricFlowTest(rate, filamentType);
      await this.waitForPrintCompletion();
      
      // Analyze quality degradation
      const analysis = await this.analyze48MPImage('volumetric_flow', rate);
      const qualityScore = this.assessPrintQuality(analysis);
      
      testResults.push({
        flowRate: rate,
        quality: qualityScore,
        skipping: analysis.extruderSkipping,
        underextrusion: analysis.underextrusion
      });
      
      // Stop testing if quality drops below threshold
      if (qualityScore < 70 || analysis.extruderSkipping) {
        console.log(`  Quality degradation detected at ${rate} mm³/s`);
        break;
      }
    }
    
    // Find maximum reliable flow rate
    const maxReliableFlow = testResults
      .filter(r => r.quality > 80 && !r.skipping)
      .pop()?.flowRate || 10;
    
    console.log(`✅ Maximum volumetric flow: ${maxReliableFlow} mm³/s`);
    
    return {
      maxVolumetricFlow: maxReliableFlow,
      safeFlowRate: Math.round(maxReliableFlow * 0.85), // 85% for reliability
      testResults: testResults
    };
  }

  async runInputShapingTest() {
    console.log('🎯 Running input shaping calibration...');
    
    // Print ringing test towers at different frequencies
    const frequencies = [20, 30, 40, 50, 60, 70, 80]; // Hz
    const testResults = [];
    
    for (const freq of frequencies) {
      console.log(`  Testing ${freq} Hz input shaping...`);
      
      // Print ringing test tower
      await this.printRingingTower(freq);
      await this.waitForPrintCompletion();
      
      // Analyze ringing patterns with high-res camera
      const analysis = await this.analyze48MPImage('input_shaping', freq);
      const ringingScore = this.measureRingingArtifacts(analysis);
      
      testResults.push({
        frequency: freq,
        ringingLevel: ringingScore.level,
        surfaceQuality: ringingScore.surface,
        recommended: ringingScore.level < 0.1 // Less than 0.1mm ringing
      });
    }
    
    // Find optimal input shaping frequency
    const optimalFreq = testResults
      .filter(r => r.recommended)
      .reduce((best, current) => 
        current.surfaceQuality > best.surfaceQuality ? current : best
      );
    
    console.log(`✅ Optimal input shaping: ${optimalFreq.frequency} Hz`);
    
    return {
      optimalFrequency: optimalFreq.frequency,
      inputShaperType: 'mzv', // Most common
      testResults: testResults,
      klipperConfig: this.generateInputShaperConfig(optimalFreq.frequency)
    };
  }

  async runTemperatureOptimization(filamentType) {
    console.log('🌡️ Optimizing temperature for quality and speed...');
    
    const baseTemp = this.getBaseTemperature(filamentType);
    const temps = [baseTemp - 10, baseTemp - 5, baseTemp, baseTemp + 5, baseTemp + 10];
    const testResults = [];
    
    for (const temp of temps) {
      console.log(`  Testing ${temp}°C...`);
      
      // Print temperature test with bridging, overhangs, fine details
      await this.printTemperatureTest(temp, filamentType);
      await this.waitForPrintCompletion();
      
      // Comprehensive analysis
      const analysis = await this.analyze48MPImage('temperature', temp);
      const score = this.calculateTemperatureScore(analysis);
      
      testResults.push({
        temperature: temp,
        bridging: analysis.bridging,
        overhangs: analysis.overhangs,
        stringing: analysis.stringing,
        surfaceFinish: analysis.surface,
        overallScore: score
      });
    }
    
    const optimalTemp = testResults.reduce((best, current) => 
      current.overallScore > best.overallScore ? current : best
    );
    
    console.log(`✅ Optimal temperature: ${optimalTemp.temperature}°C`);
    
    return {
      optimalTemperature: optimalTemp.temperature,
      confidence: optimalTemp.overallScore / 100,
      testResults: testResults
    };
  }

  async runEddyBedLeveling() {
    console.log('🧲 Running eddy current bed leveling...');
    
    // Use eddy current sensor for non-contact bed measurement
    const measurementPoints = this.generateBedMeshPoints(5, 5); // 5x5 grid
    const measurements = [];
    
    for (const point of measurementPoints) {
      console.log(`  Measuring point (${point.x}, ${point.y})...`);
      
      // Move to point and take eddy current measurement
      await this.moveToPoint(point.x, point.y, 5); // 5mm above bed
      const distance = await this.readEddyCurrentSensor();
      
      measurements.push({
        x: point.x,
        y: point.y,
        distance: distance.value,
        confidence: distance.confidence
      });
    }
    
    // Generate bed mesh
    const bedMesh = this.generateBedMesh(measurements);
    const levelingRequired = this.assessLevelingNeeds(bedMesh);
    
    console.log(`✅ Bed analysis complete. Max deviation: ${bedMesh.maxDeviation.toFixed(3)}mm`);
    
    return {
      bedMesh: bedMesh,
      maxDeviation: bedMesh.maxDeviation,
      needsLeveling: levelingRequired.needed,
      adjustments: levelingRequired.adjustments,
      klipperMesh: this.generateKlipperBedMesh(measurements)
    };
  }

  async generateCalibrationReport(results, filamentType) {
    console.log('📊 Generating calibration report and recommendations...');
    
    const report = {
      timestamp: Date.now(),
      filamentType: filamentType,
      devicePosition: this.devicePosition,
      results: results,
      recommendations: [],
      slicerChanges: [],
      klipperChanges: []
    };
    
    // Generate slicer recommendations
    if (results.flow_calibration) {
      report.slicerChanges.push({
        setting: 'flow_rate',
        value: results.flow_calibration.optimalFlow,
        reason: 'Optimized for dimensional accuracy and surface quality'
      });
    }
    
    if (results.volumetric_flow) {
      report.slicerChanges.push({
        setting: 'max_volumetric_speed',
        value: results.volumetric_flow.safeFlowRate,
        reason: 'Maximum reliable flow rate without quality loss'
      });
    }
    
    if (results.temperature_optimization) {
      report.slicerChanges.push({
        setting: 'nozzle_temperature',
        value: results.temperature_optimization.optimalTemperature,
        reason: 'Optimal temperature for bridging, overhangs, and surface finish'
      });
    }
    
    // Generate Klipper configuration changes
    if (results.input_shaping) {
      report.klipperChanges.push({
        section: '[input_shaper]',
        setting: 'shaper_freq_x',
        value: results.input_shaping.optimalFrequency,
        config: results.input_shaping.klipperConfig
      });
    }
    
    if (results.eddy_bed_leveling) {
      report.klipperChanges.push({
        section: '[bed_mesh]',
        setting: 'mesh_points',
        value: '5,5',
        mesh: results.eddy_bed_leveling.klipperMesh
      });
    }
    
    this.pendingChanges = [...report.slicerChanges, ...report.klipperChanges];
    
    console.log('✅ Calibration complete! Ready to apply changes.');
    console.log(`📈 Overall improvement potential: ${this.calculateImprovementScore(results)}%`);
    
    return report;
  }

  async applyChanges(userApproved = false) {
    if (!userApproved) {
      throw new Error('User approval required before applying calibration changes');
    }
    
    console.log('⚡ Applying calibration changes...');
    
    // Apply Klipper changes via API
    for (const change of this.pendingChanges.filter(c => c.section)) {
      await this.applyKlipperConfig(change);
    }
    
    // Generate slicer profile
    const slicerProfile = this.generateSlicerProfile();
    
    console.log('✅ Changes applied successfully');
    return { applied: true, profile: slicerProfile };
  }

  // Helper methods (simplified implementations)
  async getCameraView() { return { image: 'mock_image_data', resolution: '48MP' }; }
  async readMagneticSensor() { return { strength: 0.9, locked: true }; }
  analyzeBedVisibility(view) { return true; }
  async printFlowTestCube(flow, filament) { await this.delay(30000); }
  async waitForPrintCompletion() { await this.delay(60000); }
  async analyze48MPImage(type, param) { 
    return { 
      dimensions: 0.95, surface: 0.9, overextrusion: 0.1, 
      underextrusion: 0.05, bridging: 0.88, stringing: 0.1 
    }; 
  }
  
  calculateFlowScore(analysis) { 
    return Math.round(((analysis.dimensions + analysis.surface) / 2) * 100); 
  }
  
  getBaseTemperature(filament) {
    const temps = { 'PLA': 200, 'PETG': 235, 'ABS': 240, 'TPU': 210 };
    return temps[filament] || 200;
  }
  
  async establishPositionReference() {
    console.log('📐 Printing positioning reference for camera calibration...');
    
    // Generate and print positioning reference
    const positioningRef = this.referencePrints.generatePositioningReference();
    
    // Send G-code to printer
    console.log('🖨️ Printing reference grid...');
    await this.sendGCodeToPrinter(positioningRef.gcode);
    await this.waitForPrintCompletion();
    
    // Capture high-resolution image
    console.log('📸 Capturing 48MP reference image...');
    const referenceImage = await this.capture48MPImage('positioning_reference');
    
    // Analyze positioning and establish calibration
    console.log('🔍 Analyzing positioning reference...');
    this.positionCalibration = await this.referencePrints.analyzeReferencePositioning(
      referenceImage, 
      'positioning'
    );
    
    console.log(`✅ Position calibration established:`);
    console.log(`   📏 Scale: ${this.positionCalibration.scaleCalibration.pixelsPerMM.toFixed(2)} px/mm`);
    console.log(`   🎯 Accuracy: ${(this.positionCalibration.positionAccuracy * 100).toFixed(1)}%`);
    console.log(`   📐 Rotation: ${this.positionCalibration.orientationCorrection.rotation.toFixed(1)}°`);
    
    return this.positionCalibration;
  }

  async runReferenceBasedTest(testStep, filamentType) {
    console.log(`🖨️ Printing ${testStep.name} reference objects...`);
    
    // Generate reference print G-code
    const referenceGCode = this.generateReferenceGCode(testStep.print);
    
    // Print the reference objects
    await this.sendGCodeToPrinter(referenceGCode);
    await this.waitForPrintCompletion();
    
    // Capture and analyze with known reference positions
    console.log('📸 Capturing high-resolution analysis image...');
    const analysisImage = await this.capture48MPImage(testStep.name);
    
    // Use positioning reference to precisely locate and measure test objects
    console.log('🔍 Analyzing test results with reference positioning...');
    const results = await this.analyzeReferenceBasedResults(
      analysisImage, 
      testStep, 
      this.positionCalibration
    );
    
    return results;
  }

  async analyzeReferenceBasedResults(image, testStep, positionRef) {
    console.log(`🧠 Running AI analysis on ${testStep.name}...`);
    
    // Use position calibration to accurately measure features
    const measurementData = this.extractPreciseMeasurements(image, testStep, positionRef);
    
    switch (testStep.name) {
      case 'flow_calibration':
        return this.analyzeFlowCalibrationResults(measurementData);
      case 'temperature_tower':
        return this.analyzeTemperatureTowerResults(measurementData);
      case 'input_shaping':
        return this.analyzeInputShapingResults(measurementData);
      case 'volumetric_flow':
        return this.analyzeVolumetricFlowResults(measurementData);
      default:
        throw new Error(`Unknown test type: ${testStep.name}`);
    }
  }

  extractPreciseMeasurements(image, testStep, positionRef) {
    console.log('📏 Extracting precise measurements using reference calibration...');
    
    // Convert pixel measurements to real-world dimensions
    const pixelsPerMM = positionRef.scaleCalibration.pixelsPerMM;
    const correctionMatrix = positionRef.orientationCorrection.correctionMatrix;
    
    // Locate measurement points from reference print design
    const measurementPoints = positionRef.measurementPoints;
    
    // Simulate precise measurements
    const measurements = {};
    
    if (testStep.name === 'flow_calibration') {
      measurements.wallThickness = measurementPoints.flowTestCubes.map(cube => ({
        flowRate: cube.flowRate,
        measuredThickness: this.measureWallThickness(image, cube.bounds, pixelsPerMM),
        expectedThickness: 1.2, // 3 perimeters at 0.4mm
        accuracy: this.calculateAccuracy(cube.flowRate)
      }));
      
      measurements.holeDiameters = measurementPoints.dimensionalFeatures.map(feature => ({
        expectedDiameter: feature.expectedDiameter,
        measuredDiameter: this.measureHoleDiameter(image, feature.center, pixelsPerMM),
        accuracy: this.calculateDiameterAccuracy(feature)
      }));
    }
    
    if (testStep.name === 'temperature_tower') {
      measurements.bridgeQuality = measurementPoints.temperatureSegments.map(segment => ({
        temperature: segment.temp,
        bridgeScore: this.analyzeBridgeQuality(image, segment.bounds),
        surfaceScore: this.analyzeSurfaceQuality(image, segment.bounds),
        stringingLevel: this.measureStringing(image, segment.bounds)
      }));
    }
    
    if (testStep.name === 'input_shaping') {
      measurements.ringingAnalysis = measurementPoints.inputShapingObjects?.map(obj => ({
        frequency: obj.frequency,
        ringingAmplitude: this.measureRingingAmplitude(image, obj.bounds, pixelsPerMM),
        surfaceQuality: this.analyzeSurfaceSmoothing(image, obj.bounds)
      })) || [];
    }
    
    return measurements;
  }

  analyzeFlowCalibrationResults(measurements) {
    console.log('📊 Analyzing flow calibration results...');
    
    // Find optimal flow rate based on wall thickness accuracy and surface quality
    const bestFlow = measurements.wallThickness.reduce((best, current) => {
      const score = (current.accuracy * 0.7) + (current.surfaceQuality || 0.8) * 0.3;
      const bestScore = (best.accuracy * 0.7) + (best.surfaceQuality || 0.8) * 0.3;
      return score > bestScore ? current : best;
    });
    
    console.log(`✅ Optimal flow rate: ${bestFlow.flowRate}%`);
    console.log(`📏 Wall thickness accuracy: ${(bestFlow.accuracy * 100).toFixed(1)}%`);
    
    return {
      optimalFlow: bestFlow.flowRate,
      confidence: bestFlow.accuracy,
      wallThicknessResults: measurements.wallThickness,
      holeDiameterResults: measurements.holeDiameters,
      recommendation: `Set flow rate to ${bestFlow.flowRate}% for optimal dimensional accuracy`
    };
  }

  analyzeTemperatureTowerResults(measurements) {
    console.log('🌡️ Analyzing temperature tower results...');
    
    // Score each temperature based on bridging, surface quality, and stringing
    const temperatureScores = measurements.bridgeQuality.map(result => ({
      temperature: result.temperature,
      overallScore: (result.bridgeScore * 0.4) + (result.surfaceScore * 0.4) + ((1 - result.stringingLevel) * 0.2)
    }));
    
    const optimalTemp = temperatureScores.reduce((best, current) => 
      current.overallScore > best.overallScore ? current : best
    );
    
    console.log(`✅ Optimal temperature: ${optimalTemp.temperature}°C`);
    
    return {
      optimalTemperature: optimalTemp.temperature,
      confidence: optimalTemp.overallScore,
      temperatureResults: temperatureScores,
      bridgeAnalysis: measurements.bridgeQuality
    };
  }

  analyzeInputShapingResults(measurements) {
    console.log('🎯 Analyzing input shaping results...');
    
    const optimalShaping = measurements.ringingAnalysis.reduce((best, current) => 
      current.ringingAmplitude < best.ringingAmplitude ? current : best
    );
    
    console.log(`✅ Optimal input shaping: ${optimalShaping.frequency} Hz`);
    console.log(`📉 Ringing reduced to: ${(optimalShaping.ringingAmplitude * 1000).toFixed(2)}μm`);
    
    return {
      optimalFrequency: optimalShaping.frequency,
      ringingReduction: optimalShaping.ringingAmplitude,
      inputShaperType: 'mzv',
      klipperConfig: `shaper_freq_x: ${optimalShaping.frequency}\nshaper_freq_y: ${optimalShaping.frequency}`
    };
  }

  // Helper measurement methods (simplified implementations)
  measureWallThickness(image, bounds, pixelsPerMM) {
    // Simulate precise wall thickness measurement
    return 1.18 + (Math.random() * 0.1); // mm
  }
  
  measureHoleDiameter(image, center, pixelsPerMM) {
    // Simulate hole diameter measurement
    return 4.95 + (Math.random() * 0.1); // mm
  }
  
  calculateAccuracy(flowRate) {
    // Simulate accuracy calculation based on flow rate
    return Math.max(0.7, 1 - Math.abs(flowRate - 100) / 100);
  }
  
  analyzeBridgeQuality(image, bounds) {
    return 0.85 + (Math.random() * 0.1);
  }
  
  analyzeSurfaceQuality(image, bounds) {
    return 0.80 + (Math.random() * 0.15);
  }
  
  measureStringing(image, bounds) {
    return Math.random() * 0.2; // 0-20% stringing
  }
  
  measureRingingAmplitude(image, bounds, pixelsPerMM) {
    return Math.random() * 0.05; // 0-50 microns
  }
  
  analyzeSurfaceSmoothing(image, bounds) {
    return 0.85 + (Math.random() * 0.1);
  }

  calculateTotalTime(sequence) {
    const times = sequence.map(s => parseInt(s.duration.split(' ')[0]));
    return times.reduce((total, time) => total + time, 0);
  }

  async sendGCodeToPrinter(gcode) {
    console.log('📤 Sending G-code to printer...');
    await this.delay(1000);
  }

  async capture48MPImage(testName) {
    console.log(`📸 Capturing 48MP image for ${testName}...`);
    await this.delay(2000);
    return { resolution: '48MP', testName: testName, timestamp: Date.now() };
  }

  generateReferenceGCode(printDefinition) {
    return `; Generated G-code for ${printDefinition.name}`;
  }

  delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}
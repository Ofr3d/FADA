// Reference Print Generator for Precise Positioning and Calibration
export class ReferenceCalibrationPrints {
  constructor() {
    this.referenceObjects = {};
    this.knownDimensions = {};
    this.positioningMarkers = {};
    this.printSequence = [];
  }

  generatePositioningReference() {
    console.log('📐 Generating positioning reference print...');
    
    // Creates a reference grid with known dimensions for camera calibration
    const positioningPrint = {
      name: 'positioning_reference',
      description: 'Grid pattern for camera position calibration',
      dimensions: { x: 100, y: 100, z: 2 },
      features: {
        cornerMarkers: [
          { position: { x: 10, y: 10 }, size: 5, height: 3, shape: 'circle' },
          { position: { x: 90, y: 10 }, size: 5, height: 3, shape: 'square' },
          { position: { x: 90, y: 90 }, size: 5, height: 3, shape: 'triangle' },
          { position: { x: 10, y: 90 }, size: 5, height: 3, shape: 'diamond' }
        ],
        gridLines: {
          spacing: 10, // 10mm grid
          lineWidth: 0.4,
          height: 0.2
        },
        centerCross: {
          position: { x: 50, y: 50 },
          armLength: 15,
          lineWidth: 1,
          height: 1
        },
        scaleReference: {
          // Precise 20mm calibration bar
          position: { x: 30, y: 50 },
          length: 20,
          width: 2,
          height: 2,
          actualSize: 20.000 // Known reference dimension
        }
      },
      gcode: this.generatePositioningGCode()
    };

    this.referenceObjects.positioning = positioningPrint;
    console.log('✅ Positioning reference ready');
    return positioningPrint;
  }

  generateFlowCalibrationSet() {
    console.log('🌊 Generating flow calibration test set...');
    
    const flowRates = [90, 95, 100, 105, 110];
    const testCubes = flowRates.map(rate => ({
      flowRate: rate,
      name: `flow_test_${rate}`,
      dimensions: { x: 20, y: 20, z: 20 },
      position: { x: 20 + (rate - 90) * 25, y: 30 }, // Spread across bed
      features: {
        solidWalls: {
          thickness: 1.2, // 3 perimeters at 0.4mm
          expectedThickness: 1.2 * (rate / 100) // Account for flow rate
        },
        topSurface: {
          infill: 100,
          expectedQuality: this.predictSurfaceQuality(rate)
        },
        dimensionalTest: {
          // Small holes to test accuracy
          holes: [
            { diameter: 5, position: { x: 10, y: 10 } },
            { diameter: 3, position: { x: 10, y: 15 } }
          ],
          expectedDiameters: flowRates.map(r => ({ 
            flow: r, 
            diameter5: 5 - (r - 100) * 0.02,  // Overextrusion reduces hole size
            diameter3: 3 - (r - 100) * 0.015 
          }))
        },
        textMarker: {
          text: `${rate}%`,
          position: { x: 15, y: 15 },
          height: 0.2,
          size: 3
        }
      }
    }));

    this.referenceObjects.flowCalibration = {
      name: 'flow_calibration_set',
      testCubes: testCubes,
      analysisGuide: {
        optimalRange: { min: 95, max: 105 },
        measurements: [
          'wall_thickness_accuracy',
          'surface_quality_score',
          'dimensional_accuracy',
          'hole_diameter_precision'
        ]
      }
    };

    console.log('✅ Flow calibration set ready');
    return this.referenceObjects.flowCalibration;
  }

  generateTemperatureTestTower() {
    console.log('🌡️ Generating temperature optimization tower...');
    
    const temperatures = [220, 210, 200, 190, 180];
    const towerHeight = 50;
    const segmentHeight = towerHeight / temperatures.length;
    
    const temperatureTower = {
      name: 'temperature_tower',
      dimensions: { x: 25, y: 25, z: towerHeight },
      position: { x: 50, y: 50 }, // Center of bed
      segments: temperatures.map((temp, index) => ({
        temperature: temp,
        startLayer: Math.floor(index * segmentHeight / 0.2), // 0.2mm layer height
        endLayer: Math.floor((index + 1) * segmentHeight / 0.2),
        zStart: index * segmentHeight,
        zEnd: (index + 1) * segmentHeight,
        testFeatures: {
          bridging: {
            // 15mm bridge test
            startX: 5, endX: 20,
            y: 10 + index * 2,
            expectedQuality: this.predictBridgeQuality(temp)
          },
          overhang: {
            // 45° overhang test
            angle: 45,
            length: 10,
            position: { x: 5, y: 15 + index * 2 }
          },
          stringing: {
            // Quick retraction test
            towers: [
              { x: 5, y: 5, height: 5 },
              { x: 20, y: 5, height: 5 }
            ],
            travelDistance: 15
          },
          surfaceFinish: {
            // Large flat area for surface analysis
            area: { x1: 2, y1: 18, x2: 23, y2: 23 }
          }
        },
        textMarker: {
          text: `${temp}°C`,
          position: { x: 12, y: 5 },
          height: 0.3
        }
      }))
    };

    this.referenceObjects.temperatureTower = temperatureTower;
    console.log('✅ Temperature tower ready');
    return temperatureTower;
  }

  generateInputShapingTest() {
    console.log('🎯 Generating input shaping test objects...');
    
    const frequencies = [20, 30, 40, 50, 60, 70];
    const testObjects = frequencies.map((freq, index) => ({
      frequency: freq,
      name: `input_shaping_${freq}hz`,
      dimensions: { x: 30, y: 30, z: 30 },
      position: { x: 10 + index * 35, y: 80 }, // Line them up
      features: {
        ringingTower: {
          // Tower with sharp direction changes to induce ringing
          walls: 'single_perimeter',
          speed: 100, // mm/s - high speed to induce ringing
          acceleration: 3000 // High accel for sharp corners
        },
        measurementSurfaces: {
          // Flat surfaces on X and Y faces for ringing analysis
          xFace: { position: 'east', area: { width: 30, height: 20 } },
          yFace: { position: 'north', area: { width: 30, height: 20 } }
        },
        sharpCorners: [
          // Internal corners that show ringing clearly
          { type: 'internal_90', position: { x: 10, y: 10 } },
          { type: 'internal_90', position: { x: 20, y: 10 } },
          { type: 'internal_90', position: { x: 20, y: 20 } },
          { type: 'internal_90', position: { x: 10, y: 20 } }
        ],
        textMarker: {
          text: `${freq}Hz`,
          position: { x: 15, y: 25 },
          height: 0.4
        }
      },
      analysisPoints: {
        // Specific points to measure ringing amplitude
        ringingMeasurement: [
          { face: 'x', distance: 2 }, // 2mm from corner
          { face: 'x', distance: 5 }, // 5mm from corner
          { face: 'y', distance: 2 },
          { face: 'y', distance: 5 }
        ]
      }
    }));

    this.referenceObjects.inputShaping = {
      name: 'input_shaping_test_set',
      objects: testObjects,
      analysisGuide: {
        ringingThreshold: 0.1, // Max acceptable ringing in mm
        measurementProtocol: 'surface_profile_analysis'
      }
    };

    console.log('✅ Input shaping test set ready');
    return this.referenceObjects.inputShaping;
  }

  generateVolumetricFlowTest() {
    console.log('💨 Generating volumetric flow test...');
    
    const flowRates = [5, 10, 15, 20, 25, 30]; // mm³/s
    const testPrint = {
      name: 'volumetric_flow_test',
      description: 'Progressive flow rate test with quality indicators',
      dimensions: { x: 150, y: 20, z: 10 },
      position: { x: 25, y: 40 },
      segments: flowRates.map((rate, index) => {
        const segmentWidth = 150 / flowRates.length;
        return {
          flowRate: rate,
          startX: index * segmentWidth,
          endX: (index + 1) * segmentWidth,
          features: {
            solidExtrusion: {
              width: 20,
              height: 10,
              speed: this.calculateSpeedForFlow(rate, 0.4, 0.2) // nozzle, layer height
            },
            qualityIndicators: {
              // Features that fail at high flow rates
              thinWall: { thickness: 0.4, height: 5 },
              smallGap: { width: 1, height: 3 },
              sharpCorner: { radius: 0.5 }
            },
            textMarker: {
              text: `${rate}`,
              position: { x: index * segmentWidth + segmentWidth/2, y: 10 },
              height: 0.2
            }
          }
        };
      })
    };

    this.referenceObjects.volumetricFlow = testPrint;
    console.log('✅ Volumetric flow test ready');
    return testPrint;
  }

  async analyzeReferencePositioning(cameraImage, referenceType) {
    console.log(`🔍 Analyzing ${referenceType} reference positioning...`);
    
    const reference = this.referenceObjects[referenceType];
    if (!reference) {
      throw new Error(`Reference type ${referenceType} not found`);
    }

    // Simulate computer vision analysis
    const analysis = {
      positionAccuracy: this.detectReferenceMarkers(cameraImage, reference),
      scaleCalibration: this.calculateScaleFactor(cameraImage, reference),
      orientationCorrection: this.detectOrientation(cameraImage, reference),
      measurementPoints: this.identifyMeasurementPoints(cameraImage, reference)
    };

    console.log(`📊 Position accuracy: ${(analysis.positionAccuracy * 100).toFixed(1)}%`);
    console.log(`📏 Scale factor: ${analysis.scaleCalibration.pixelsPerMM.toFixed(2)} px/mm`);
    
    return analysis;
  }

  detectReferenceMarkers(image, reference) {
    // Simulate detection of corner markers, grid lines, etc.
    const detectedMarkers = {
      cornerMarkers: 4, // All 4 corner markers found
      gridLines: 18, // 9x9 grid = 18 lines
      centerCross: true,
      scaleReference: true
    };

    // Calculate position accuracy based on detected features
    const expectedFeatures = this.countExpectedFeatures(reference);
    const detectedFeatures = this.countDetectedFeatures(detectedMarkers);
    
    return detectedFeatures / expectedFeatures;
  }

  calculateScaleFactor(image, reference) {
    // Use the known 20mm calibration bar to calculate pixels per mm
    const knownLength = 20.0; // mm
    const measuredPixels = 847; // Simulated pixel measurement
    
    return {
      pixelsPerMM: measuredPixels / knownLength,
      confidence: 0.95,
      referenceLength: knownLength,
      measuredPixels: measuredPixels
    };
  }

  detectOrientation(image, reference) {
    // Detect rotation/skew from grid lines and corner markers
    return {
      rotation: 0.5, // degrees
      skewX: 0.1,
      skewY: -0.2,
      correctionMatrix: [
        [1.0, -0.001, 0],
        [0.002, 1.0, 0],
        [0, 0, 1]
      ]
    };
  }

  identifyMeasurementPoints(image, reference) {
    // Return pixel coordinates of key measurement points
    return {
      flowTestCubes: [
        { flowRate: 90, center: { x: 423, y: 567 }, bounds: { x1: 350, y1: 490, x2: 496, y2: 644 } },
        { flowRate: 95, center: { x: 634, y: 567 }, bounds: { x1: 561, y1: 490, x2: 707, y2: 644 } },
        // ... more cubes
      ],
      temperatureSegments: [
        { temp: 220, bounds: { x1: 200, y1: 100, x2: 250, y2: 200 } },
        { temp: 210, bounds: { x1: 200, y1: 200, x2: 250, y2: 300 } },
        // ... more segments
      ],
      dimensionalFeatures: [
        { type: 'hole_5mm', center: { x: 445, y: 590 }, expectedDiameter: 5.0 },
        { type: 'hole_3mm', center: { x: 445, y: 620 }, expectedDiameter: 3.0 }
      ]
    };
  }

  generateCalibrationSequence(filamentType = 'PLA') {
    console.log(`📋 Generating calibration sequence for ${filamentType}...`);
    
    const sequence = [
      {
        step: 1,
        name: 'positioning_reference',
        print: this.generatePositioningReference(),
        duration: '5 min',
        purpose: 'Establish camera positioning and scale calibration'
      },
      {
        step: 2,
        name: 'flow_calibration',
        print: this.generateFlowCalibrationSet(),
        duration: '25 min',
        purpose: 'Determine optimal flow rate for dimensional accuracy'
      },
      {
        step: 3,
        name: 'temperature_tower',
        print: this.generateTemperatureTestTower(),
        duration: '35 min',
        purpose: 'Find optimal temperature for quality vs speed'
      },
      {
        step: 4,
        name: 'input_shaping',
        print: this.generateInputShapingTest(),
        duration: '45 min',
        purpose: 'Eliminate ringing and improve surface quality'
      },
      {
        step: 5,
        name: 'volumetric_flow',
        print: this.generateVolumetricFlowTest(),
        duration: '15 min',
        purpose: 'Determine maximum reliable print speeds'
      }
    ];

    this.printSequence = sequence;
    
    console.log('📋 Calibration sequence:');
    sequence.forEach(step => {
      console.log(`  ${step.step}. ${step.name.toUpperCase()} (${step.duration})`);
      console.log(`     ${step.purpose}`);
    });

    const totalTime = this.calculateTotalTime(sequence);
    console.log(`⏱️ Total calibration time: ${totalTime} minutes`);
    
    return sequence;
  }

  // Helper methods
  predictSurfaceQuality(flowRate) {
    return Math.max(0, 100 - Math.abs(flowRate - 100) * 2);
  }

  predictBridgeQuality(temperature) {
    const optimal = 200; // PLA optimal bridging temp
    return Math.max(0, 100 - Math.abs(temperature - optimal) * 1.5);
  }

  calculateSpeedForFlow(flowRate, nozzleWidth, layerHeight) {
    // Speed = flow_rate / (nozzle_width * layer_height)
    return Math.round(flowRate / (nozzleWidth * layerHeight));
  }

  countExpectedFeatures(reference) {
    // Count all features that should be detectable
    return 25; // Simplified count
  }

  countDetectedFeatures(detected) {
    return detected.cornerMarkers + detected.gridLines + 
           (detected.centerCross ? 1 : 0) + (detected.scaleReference ? 1 : 0);
  }

  calculateTotalTime(sequence) {
    const times = sequence.map(s => parseInt(s.duration.split(' ')[0]));
    return times.reduce((total, time) => total + time, 0);
  }

  generatePositioningGCode() {
    return `
; MakoAgent Positioning Reference Print
; Known dimensions for camera calibration
G28 ; Home all axes
G1 Z0.2 F300 ; First layer height
M104 S200 ; Heat nozzle
M190 S60 ; Wait for bed temp
M109 S200 ; Wait for nozzle temp

; Print positioning grid with known dimensions
; [G-code would be generated here for the reference grid]

M104 S0 ; Turn off nozzle
M140 S0 ; Turn off bed
G28 X Y ; Home X Y
M84 ; Disable steppers
`;
  }
}
// Advanced Spaghetti Detection System
export class SpaghettiDetector {
  constructor() {
    this.riskZones = {
      overhangs: { weight: 0.9, description: 'Overhangs >45° without support' },
      bridges: { weight: 0.8, description: 'Long bridges >20mm' },
      smallFeatures: { weight: 0.7, description: 'Features <2mm width' },
      firstLayers: { weight: 0.95, description: 'First 3 layers' },
      tallThinWalls: { weight: 0.85, description: 'Walls >20mm tall, <1mm thick' },
      corners: { weight: 0.6, description: 'Sharp external corners' }
    };
    
    this.safeZones = {
      solidInfill: { weight: 0.1, description: 'Areas with 100% infill' },
      thickWalls: { weight: 0.2, description: 'Walls >3mm thick' },
      lowHeight: { weight: 0.15, description: 'Features <5mm tall' },
      supported: { weight: 0.1, description: 'Areas with support material' }
    };
    
    this.detectionHistory = [];
    this.falsePositives = 0;
    this.truePositives = 0;
  }

  analyzeCurrentPrint(cameraData, sensorData, gcodeAnalysis, currentLayer) {
    console.log('🍝 Analyzing for spaghetti detection...');
    
    const riskScore = this.calculateRiskScore(gcodeAnalysis, currentLayer);
    const sensorAlerts = this.analyzeSensorPatterns(sensorData);
    const visualAnalysis = this.analyzeVisualPatterns(cameraData);
    
    const detection = {
      timestamp: Date.now(),
      layer: currentLayer,
      riskScore: riskScore,
      confidence: this.calculateConfidence(riskScore, sensorAlerts, visualAnalysis),
      alerts: sensorAlerts,
      riskFactors: this.identifyRiskFactors(gcodeAnalysis, currentLayer),
      recommendation: this.generateRecommendation(riskScore, sensorAlerts)
    };
    
    // Add to history for pattern learning
    this.detectionHistory.push(detection);
    if (this.detectionHistory.length > 50) {
      this.detectionHistory = this.detectionHistory.slice(-50);
    }
    
    return detection;
  }

  calculateRiskScore(gcodeAnalysis, currentLayer) {
    let totalRisk = 0;
    let weightSum = 0;
    
    // Analyze G-code for structural risk factors
    const layerData = gcodeAnalysis.layers?.[currentLayer] || {};
    
    // Check for overhangs
    if (layerData.overhangs > 0) {
      const overhangRisk = Math.min(layerData.overhangs / 10, 1) * this.riskZones.overhangs.weight;
      totalRisk += overhangRisk;
      weightSum += this.riskZones.overhangs.weight;
    }
    
    // Check for bridges
    if (layerData.bridges > 0) {
      const bridgeRisk = Math.min(layerData.bridges / 5, 1) * this.riskZones.bridges.weight;
      totalRisk += bridgeRisk;
      weightSum += this.riskZones.bridges.weight;
    }
    
    // First layers are critical
    if (currentLayer <= 3) {
      totalRisk += this.riskZones.firstLayers.weight;
      weightSum += this.riskZones.firstLayers.weight;
    }
    
    // Small features detection
    if (layerData.smallFeatures > 0) {
      const smallFeaturesRisk = Math.min(layerData.smallFeatures / 20, 1) * this.riskZones.smallFeatures.weight;
      totalRisk += smallFeaturesRisk;
      weightSum += this.riskZones.smallFeatures.weight;
    }
    
    // Reduce risk for safe zones
    if (layerData.solidInfill > 0.8) {
      totalRisk *= (1 - this.safeZones.solidInfill.weight);
    }
    
    if (layerData.supportMaterial) {
      totalRisk *= (1 - this.safeZones.supported.weight);
    }
    
    return weightSum > 0 ? Math.min(totalRisk / weightSum, 1) : 0;
  }

  analyzeSensorPatterns(sensorData) {
    const alerts = [];
    
    // Vibration pattern analysis
    if (sensorData.vibration?.length > 10) {
      const recentVibration = sensorData.vibration.slice(-10);
      const avgVibration = recentVibration.reduce((a, b) => a + b, 0) / recentVibration.length;
      const vibrationSpikes = recentVibration.filter(v => v > avgVibration * 2).length;
      
      if (vibrationSpikes > 3) {
        alerts.push({
          type: 'vibration_anomaly',
          severity: 'high',
          message: 'Unusual vibration pattern detected - possible detached print',
          confidence: 0.8
        });
      }
    }
    
    // Temperature fluctuation analysis
    if (sensorData.temperature?.length > 5) {
      const recentTemp = sensorData.temperature.slice(-5);
      const tempVariation = this.calculateVariation(recentTemp);
      
      if (tempVariation > 8) {
        alerts.push({
          type: 'temperature_instability',
          severity: 'medium',
          message: 'Temperature instability may indicate print failure',
          confidence: 0.6
        });
      }
    }
    
    // Filament flow analysis
    if (sensorData.filamentFlow?.length > 5) {
      const recentFlow = sensorData.filamentFlow.slice(-5);
      const avgFlow = recentFlow.reduce((a, b) => a + b, 0) / recentFlow.length;
      
      if (avgFlow < 100) {
        alerts.push({
          type: 'low_flow',
          severity: 'high',
          message: 'Low filament flow - possible jam or detachment',
          confidence: 0.9
        });
      }
      
      // Check for erratic flow patterns
      const flowVariation = this.calculateVariation(recentFlow);
      if (flowVariation > avgFlow * 0.5) {
        alerts.push({
          type: 'erratic_flow',
          severity: 'medium',
          message: 'Erratic extrusion pattern detected',
          confidence: 0.7
        });
      }
    }
    
    return alerts;
  }

  analyzeVisualPatterns(cameraData) {
    // Simulate visual pattern analysis
    // In real implementation, would use computer vision
    
    if (!cameraData || !cameraData.lastSnapshot) {
      return { confidence: 0, patterns: [] };
    }
    
    // Simulate detection of visual spaghetti indicators
    const patterns = [];
    const random = Math.random();
    
    // Simulate detecting stringy patterns
    if (random > 0.8) {
      patterns.push({
        type: 'stringy_material',
        location: { x: 150, y: 120 },
        confidence: 0.75,
        description: 'Stringy material detected near print area'
      });
    }
    
    // Simulate detecting material buildup on nozzle
    if (random > 0.9) {
      patterns.push({
        type: 'nozzle_buildup',
        location: { x: 0, y: 0 },
        confidence: 0.85,
        description: 'Material buildup on nozzle detected'
      });
    }
    
    const overallConfidence = patterns.length > 0 ? 
      patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0;
    
    return {
      confidence: overallConfidence,
      patterns: patterns
    };
  }

  identifyRiskFactors(gcodeAnalysis, currentLayer) {
    const factors = [];
    
    // Analyze current layer characteristics
    const layerData = gcodeAnalysis.layers?.[currentLayer] || {};
    
    if (currentLayer <= 3) {
      factors.push({
        factor: 'first_layers',
        risk: 'high',
        description: 'Critical early layers - bed adhesion failure risk'
      });
    }
    
    if (layerData.overhangs > 0) {
      factors.push({
        factor: 'overhangs_present',
        risk: layerData.overhangs > 5 ? 'high' : 'medium',
        description: `${layerData.overhangs} overhang features without support`
      });
    }
    
    if (layerData.bridges > 0) {
      factors.push({
        factor: 'bridges_present',
        risk: layerData.bridges > 3 ? 'high' : 'medium',
        description: `${layerData.bridges} bridge features detected`
      });
    }
    
    if (layerData.smallFeatures > 10) {
      factors.push({
        factor: 'small_features',
        risk: 'medium',
        description: 'Many small features - possible stringing'
      });
    }
    
    // Check for protective factors
    if (layerData.solidInfill > 0.8) {
      factors.push({
        factor: 'solid_infill',
        risk: 'low',
        description: 'Solid infill provides structural stability'
      });
    }
    
    if (layerData.supportMaterial) {
      factors.push({
        factor: 'support_present',
        risk: 'low',
        description: 'Support material reduces failure risk'
      });
    }
    
    return factors;
  }

  calculateConfidence(riskScore, sensorAlerts, visualAnalysis) {
    let confidence = riskScore * 0.4; // Base risk contributes 40%
    
    // Sensor data contributes 40%
    const highSeverityAlerts = sensorAlerts.filter(a => a.severity === 'high');
    const mediumSeverityAlerts = sensorAlerts.filter(a => a.severity === 'medium');
    
    confidence += (highSeverityAlerts.length * 0.3) + (mediumSeverityAlerts.length * 0.1);
    
    // Visual analysis contributes 20%
    confidence += visualAnalysis.confidence * 0.2;
    
    // Apply historical learning adjustment
    const accuracy = this.getHistoricalAccuracy();
    confidence *= accuracy;
    
    return Math.min(confidence, 1);
  }

  generateRecommendation(riskScore, sensorAlerts) {
    if (riskScore > 0.8 || sensorAlerts.some(a => a.severity === 'high')) {
      return {
        action: 'immediate_intervention',
        message: 'High spaghetti risk detected - consider pausing print for inspection',
        urgency: 'high',
        suggestions: [
          'Check bed adhesion and first layer quality',
          'Verify hotend temperature stability',
          'Inspect for filament jams or tangles',
          'Consider adding support material for overhangs'
        ]
      };
    } else if (riskScore > 0.5) {
      return {
        action: 'monitor_closely',
        message: 'Moderate spaghetti risk - monitor next few layers carefully',
        urgency: 'medium',
        suggestions: [
          'Watch for temperature fluctuations',
          'Check camera feed for anomalies',
          'Prepare to intervene if conditions worsen'
        ]
      };
    } else {
      return {
        action: 'continue_monitoring',
        message: 'Low spaghetti risk - continue normal monitoring',
        urgency: 'low',
        suggestions: [
          'Maintain current print settings',
          'Continue regular monitoring intervals'
        ]
      };
    }
  }

  calculateVariation(data) {
    if (data.length === 0) return 0;
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  getHistoricalAccuracy() {
    const total = this.truePositives + this.falsePositives;
    if (total === 0) return 0.8; // Default confidence
    return this.truePositives / total;
  }

  reportFeedback(wasActualSpaghetti) {
    if (wasActualSpaghetti) {
      this.truePositives++;
      console.log('✅ Spaghetti detection confirmed - learning from success');
    } else {
      this.falsePositives++;
      console.log('❌ False positive reported - adjusting detection sensitivity');
    }
  }

  getDetectionStats() {
    return {
      totalDetections: this.detectionHistory.length,
      accuracy: this.getHistoricalAccuracy(),
      truePositives: this.truePositives,
      falsePositives: this.falsePositives,
      recentDetections: this.detectionHistory.slice(-10)
    };
  }
}
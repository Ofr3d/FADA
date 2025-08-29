// Print Quality Analysis Engine
export class QualityAnalyzer {
  constructor() {
    this.metrics = {
      layerConsistency: 0,
      surfaceQuality: 0,
      dimensionalAccuracy: 0,
      overallScore: 0
    };
    this.issues = [];
    this.recommendations = [];
  }

  analyzeTemperatureProfile(temperatureData) {
    const issues = [];
    const recommendations = [];
    
    // Check temperature stability
    const tempVariation = this.calculateVariation(temperatureData);
    if (tempVariation > 5) {
      issues.push('Temperature fluctuation detected');
      recommendations.push('Check thermal insulation and PID tuning');
    }
    
    // Check heating consistency
    const avgTemp = temperatureData.reduce((a, b) => a + b, 0) / temperatureData.length;
    if (avgTemp < 180 || avgTemp > 250) {
      issues.push(`Unusual temperature: ${avgTemp.toFixed(1)}°C`);
      recommendations.push('Verify material temperature requirements');
    }
    
    return { issues, recommendations, stability: 100 - (tempVariation * 10) };
  }

  analyzeVibrationData(vibrationData) {
    const issues = [];
    const recommendations = [];
    
    // Detect excessive vibration
    const avgVibration = vibrationData.reduce((a, b) => a + b, 0) / vibrationData.length;
    if (avgVibration > 50) {
      issues.push('Excessive printer vibration detected');
      recommendations.push('Check belt tension and frame stability');
    }
    
    // Detect vibration patterns
    const patterns = this.detectVibrationPatterns(vibrationData);
    if (patterns.periodic) {
      issues.push('Periodic vibration pattern detected');
      recommendations.push('Check for loose pulleys or worn bearings');
    }
    
    return { issues, recommendations, score: Math.max(0, 100 - avgVibration) };
  }

  analyzeLayerQuality(gCodeData, sensorData) {
    const issues = [];
    const recommendations = [];
    let layerScore = 100;
    
    // Check layer height consistency
    const layerHeights = this.extractLayerHeights(gCodeData);
    const heightVariation = this.calculateVariation(layerHeights);
    
    if (heightVariation > 0.05) {
      issues.push('Inconsistent layer heights detected');
      recommendations.push('Calibrate Z-axis steps/mm and check bed leveling');
      layerScore -= 20;
    }
    
    // Check extrusion consistency
    if (sensorData.filamentFlow) {
      const flowVariation = this.calculateVariation(sensorData.filamentFlow);
      if (flowVariation > 10) {
        issues.push('Inconsistent filament flow detected');
        recommendations.push('Check extruder gear tension and hotend temperature');
        layerScore -= 15;
      }
    }
    
    return { issues, recommendations, score: Math.max(0, layerScore) };
  }

  detectCommonIssues(allData) {
    const issues = [];
    const recommendations = [];
    
    // Under-extrusion detection
    if (allData.temperature?.avg < 200 && allData.filamentFlow?.avg < 400) {
      issues.push('Possible under-extrusion');
      recommendations.push('Increase temperature or flow rate');
    }
    
    // Over-extrusion detection  
    if (allData.filamentFlow?.avg > 800) {
      issues.push('Possible over-extrusion');
      recommendations.push('Reduce flow rate or increase print speed');
    }
    
    // Warping risk
    if (allData.bedTemp < 50 && allData.ambientTemp < 20) {
      issues.push('High warping risk detected');
      recommendations.push('Increase bed temperature and consider enclosure');
    }
    
    // Stringing risk
    if (allData.humidity > 60) {
      issues.push('High humidity may cause stringing');
      recommendations.push('Store filament in dry environment');
    }
    
    return { issues, recommendations };
  }

  generateQualityReport(printerData, sensorData, gCodeData) {
    console.log('🔍 Analyzing print quality...');
    
    // Analyze different aspects
    const tempAnalysis = this.analyzeTemperatureProfile(printerData.temperatures || []);
    const vibAnalysis = this.analyzeVibrationData(sensorData.vibration || []);
    const layerAnalysis = this.analyzeLayerQuality(gCodeData, sensorData);
    const commonIssues = this.detectCommonIssues({
      temperature: printerData.temperature,
      bedTemp: printerData.bedTemp,
      filamentFlow: sensorData.filamentFlow,
      humidity: sensorData.humidity,
      ambientTemp: sensorData.temperature
    });
    
    // Combine all issues and recommendations
    const allIssues = [
      ...tempAnalysis.issues,
      ...vibAnalysis.issues,
      ...layerAnalysis.issues,
      ...commonIssues.issues
    ];
    
    const allRecommendations = [
      ...tempAnalysis.recommendations,
      ...vibAnalysis.recommendations,
      ...layerAnalysis.recommendations,
      ...commonIssues.recommendations
    ];
    
    // Calculate overall quality score
    const scores = [
      tempAnalysis.stability || 100,
      vibAnalysis.score || 100,
      layerAnalysis.score || 100
    ];
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const report = {
      timestamp: Date.now(),
      overallScore: Math.round(overallScore),
      grade: this.getQualityGrade(overallScore),
      issues: allIssues,
      recommendations: allRecommendations,
      metrics: {
        temperatureStability: tempAnalysis.stability || 0,
        vibrationLevel: vibAnalysis.score || 0,
        layerQuality: layerAnalysis.score || 0
      }
    };
    
    console.log(`📊 Quality analysis complete: ${report.grade} (${report.overallScore}/100)`);
    return report;
  }

  getQualityGrade(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Critical';
  }

  calculateVariation(data) {
    if (data.length === 0) return 0;
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  detectVibrationPatterns(data) {
    // Simple pattern detection
    let periodicCount = 0;
    for (let i = 1; i < data.length; i++) {
      if (Math.abs(data[i] - data[i-1]) > 10) {
        periodicCount++;
      }
    }
    
    return {
      periodic: periodicCount > data.length * 0.3
    };
  }

  extractLayerHeights(gCodeData) {
    // Extract Z-axis movements from G-code
    const heights = [];
    let currentZ = 0;
    
    if (gCodeData && gCodeData.length > 0) {
      gCodeData.forEach(line => {
        const zMatch = line.match(/Z([0-9.-]+)/);
        if (zMatch) {
          const newZ = parseFloat(zMatch[1]);
          if (newZ > currentZ) {
            heights.push(newZ - currentZ);
            currentZ = newZ;
          }
        }
      });
    }
    
    return heights.length > 0 ? heights : [0.2]; // Default layer height
  }
}
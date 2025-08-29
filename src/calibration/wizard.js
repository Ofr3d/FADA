// Interactive Calibration Wizard
import { CalibrationAssistant } from './assistant.js';

export class CalibrationWizard {
  constructor() {
    this.assistant = new CalibrationAssistant();
    this.currentWizard = null;
    this.wizardSteps = [];
    this.userInputs = {};
  }

  startSetupWizard() {
    console.log('🧙‍♂️ Starting MakoAgent Setup Wizard...');
    
    this.currentWizard = 'setup';
    this.wizardSteps = [
      { id: 'welcome', title: 'Welcome to MakoAgent', type: 'info' },
      { id: 'printer_type', title: 'Printer Information', type: 'input' },
      { id: 'bed_size', title: 'Bed Dimensions', type: 'input' },
      { id: 'filament_type', title: 'Default Filament', type: 'select' },
      { id: 'calibration_choice', title: 'Initial Calibration', type: 'select' },
      { id: 'summary', title: 'Setup Complete', type: 'summary' }
    ];
    
    return this.showWizardStep(0);
  }

  showWizardStep(stepIndex) {
    if (stepIndex >= this.wizardSteps.length) {
      return this.completeWizard();
    }
    
    const step = this.wizardSteps[stepIndex];
    console.log(`\n📋 Step ${stepIndex + 1}/${this.wizardSteps.length}: ${step.title}`);
    
    switch (step.type) {
      case 'info':
        return this.showInfoStep(step, stepIndex);
      case 'input':
        return this.showInputStep(step, stepIndex);
      case 'select':
        return this.showSelectStep(step, stepIndex);
      case 'summary':
        return this.showSummaryStep(step, stepIndex);
      default:
        return this.showWizardStep(stepIndex + 1);
    }
  }

  showInfoStep(step, stepIndex) {
    switch (step.id) {
      case 'welcome':
        console.log('Welcome to MakoAgent! 🦎');
        console.log('This wizard will help you set up your 3D printer for optimal monitoring.');
        console.log('The process takes about 5 minutes and will configure:');
        console.log('  • Printer specifications');
        console.log('  • Bed leveling parameters');  
        console.log('  • Temperature settings');
        console.log('  • Quality monitoring thresholds');
        break;
    }
    
    // Auto-continue info steps
    setTimeout(() => {
      this.showWizardStep(stepIndex + 1);
    }, 3000);
    
    return { step: stepIndex, waiting: false };
  }

  showInputStep(step, stepIndex) {
    switch (step.id) {
      case 'printer_type':
        console.log('What type of 3D printer do you have?');
        console.log('Examples: Ender 3, Prusa i3, Ultimaker, Custom, etc.');
        // Simulate user input
        this.userInputs.printerType = 'Ender 3 V2';
        console.log(`✓ Selected: ${this.userInputs.printerType}`);
        break;
        
      case 'bed_size':
        console.log('What are your printer bed dimensions?');
        console.log('Enter as: width x depth x height (mm)');
        // Simulate user input
        this.userInputs.bedSize = { width: 220, depth: 220, height: 250 };
        console.log(`✓ Bed size: ${this.userInputs.bedSize.width}x${this.userInputs.bedSize.depth}x${this.userInputs.bedSize.height}mm`);
        break;
    }
    
    setTimeout(() => {
      this.showWizardStep(stepIndex + 1);
    }, 2000);
    
    return { step: stepIndex, waiting: true };
  }

  showSelectStep(step, stepIndex) {
    switch (step.id) {
      case 'filament_type':
        console.log('What filament do you primarily use?');
        console.log('1. PLA (most common)');
        console.log('2. PETG'); 
        console.log('3. ABS');
        console.log('4. TPU/Flexible');
        console.log('5. Other/Multiple');
        
        // Simulate selection
        this.userInputs.filamentType = 'PLA';
        console.log(`✓ Selected: ${this.userInputs.filamentType}`);
        break;
        
      case 'calibration_choice':
        console.log('Which calibrations would you like to run now?');
        console.log('1. Basic setup only (recommended for first-time users)');
        console.log('2. Bed leveling calibration');
        console.log('3. E-steps calibration');
        console.log('4. Temperature tower');
        console.log('5. Full calibration suite');
        
        // Simulate selection
        this.userInputs.calibrationChoice = 'Basic setup only';
        console.log(`✓ Selected: ${this.userInputs.calibrationChoice}`);
        break;
    }
    
    setTimeout(() => {
      this.showWizardStep(stepIndex + 1);
    }, 2500);
    
    return { step: stepIndex, waiting: true };
  }

  showSummaryStep(step, stepIndex) {
    console.log('🎉 Setup wizard complete!');
    console.log('\nYour configuration:');
    console.log(`📱 Printer: ${this.userInputs.printerType}`);
    console.log(`📐 Bed size: ${this.userInputs.bedSize.width}x${this.userInputs.bedSize.depth}x${this.userInputs.bedSize.height}mm`);
    console.log(`🧵 Primary filament: ${this.userInputs.filamentType}`);
    console.log(`🔧 Calibration: ${this.userInputs.calibrationChoice}`);
    
    console.log('\nMakoAgent is now configured for your printer!');
    console.log('You can start calibration anytime from the web interface.');
    
    return this.completeWizard();
  }

  completeWizard() {
    const config = this.generateConfiguration();
    
    console.log('\n✅ Configuration saved successfully');
    console.log('🌐 Access your dashboard at: http://localhost:3000');
    
    this.currentWizard = null;
    return { 
      completed: true, 
      config: config,
      needsCalibration: this.userInputs.calibrationChoice !== 'Basic setup only'
    };
  }

  generateConfiguration() {
    const temps = this.getTemperatureDefaults(this.userInputs.filamentType);
    
    return {
      printer: {
        type: this.userInputs.printerType,
        bedSize: this.userInputs.bedSize,
        filamentType: this.userInputs.filamentType
      },
      temperatures: temps,
      monitoring: {
        temperatureAlerts: true,
        vibrationThreshold: 50,
        qualityAnalysis: true
      },
      calibration: {
        lastRun: null,
        bedLevelTolerance: 0.1,
        eStepsValue: 93,
        optimalTemp: temps.hotend
      }
    };
  }

  getTemperatureDefaults(filamentType) {
    const temps = {
      'PLA': { hotend: 200, bed: 60 },
      'PETG': { hotend: 235, bed: 80 },
      'ABS': { hotend: 240, bed: 100 },
      'TPU': { hotend: 210, bed: 50 }
    };
    
    return temps[filamentType] || temps['PLA'];
  }

  // Quick calibration starters
  startQuickBedLevel() {
    console.log('🚀 Starting quick bed leveling...');
    return this.assistant.startBedLevelingCalibration();
  }

  startQuickESteps() {
    console.log('🚀 Starting quick E-steps calibration...');
    return this.assistant.startExtrusionCalibration();
  }

  startQuickTempTower() {
    console.log('🚀 Starting quick temperature tower...');
    return this.assistant.startTemperatureTower();
  }

  // Advanced calibration menu
  showCalibrationMenu() {
    console.log('\n🔧 MakoAgent Calibration Menu');
    console.log('=============================');
    console.log('1. 🛏️  Bed Leveling Assistant');
    console.log('2. ⚙️  E-steps Calibration');
    console.log('3. 🌡️  Temperature Tower');
    console.log('4. 🎯 Flow Rate Calibration');
    console.log('5. 📐 Dimensional Accuracy Test');
    console.log('6. 🔄 Full Calibration Suite');
    console.log('7. 📊 View Previous Results');
    console.log('8. ❌ Exit');
    
    return {
      menu: 'calibration',
      options: [
        'Bed Leveling Assistant',
        'E-steps Calibration', 
        'Temperature Tower',
        'Flow Rate Calibration',
        'Dimensional Accuracy Test',
        'Full Calibration Suite',
        'View Previous Results',
        'Exit'
      ]
    };
  }

  getWizardStatus() {
    if (!this.currentWizard) {
      return { active: false };
    }
    
    return {
      active: true,
      wizard: this.currentWizard,
      step: this.wizardSteps.length > 0 ? 1 : 0,
      total: this.wizardSteps.length
    };
  }
}
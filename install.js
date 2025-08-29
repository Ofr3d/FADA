#!/usr/bin/env node
// Zero-drama installation script for MakoAgent

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🦎 MakoAgent Installation');
console.log('========================\n');

const installer = {
  async run() {
    try {
      console.log('📦 Installing dependencies...');
      this.installDependencies();
      
      console.log('🔧 Setting up system...');
      this.setupSystem();
      
      console.log('🚀 Creating shortcuts...');
      this.createShortcuts();
      
      console.log('\n✅ Installation complete!\n');
      console.log('To start MakoAgent:');
      console.log('  npm start');
      console.log('\nOr visit: http://localhost:3000');
      
    } catch (error) {
      console.error('\n❌ Installation failed:', error.message);
      console.log('\nTry running: npm install');
      process.exit(1);
    }
  },

  installDependencies() {
    try {
      execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
      throw new Error('Failed to install Node.js dependencies');
    }
  },

  setupSystem() {
    // Create startup script
    const startScript = `@echo off
cd /d "%~dp0"
node src/index.js
pause`;
    
    if (process.platform === 'win32') {
      writeFileSync('start-makoagent.bat', startScript);
      console.log('  Created start-makoagent.bat');
    }
    
    // Create config directory if needed
    if (!existsSync('config')) {
      execSync('mkdir config', { stdio: 'pipe' });
      console.log('  Created config directory');
    }
  },

  createShortcuts() {
    // Create desktop shortcut script for Windows
    if (process.platform === 'win32') {
      const desktopScript = `
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\\Desktop\\MakoAgent.lnk")
$Shortcut.TargetPath = "${process.cwd()}\\start-makoagent.bat"
$Shortcut.WorkingDirectory = "${process.cwd()}"
$Shortcut.IconLocation = "${process.cwd()}\\start-makoagent.bat"
$Shortcut.Save()`;
      
      writeFileSync('create-shortcut.ps1', desktopScript);
      console.log('  Created desktop shortcut helper');
    }
  }
};

installer.run();
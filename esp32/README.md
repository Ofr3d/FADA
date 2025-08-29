# ESP32 Hardware Integration

Ready-to-flash ESP32 code for MakoAgent hardware sensors.

## Quick Setup

1. **Install Arduino IDE** with ESP32 support
2. **Install Libraries:**
   - `WiFi` (built-in)
   - `WebSocketsClient` by Markus Sattler
   - `DHT sensor library` by Adafruit
   - `ArduinoJson` by Benoit Blanchon

3. **Wire sensors:**
   - DHT22: Data pin → GPIO 4
   - Vibration sensor: → GPIO 2  
   - Filament sensor: → A0

4. **Configure WiFi:**
   - Edit `makoagent_sensor.ino`
   - Update `ssid` and `password`
   - Update `makoagent_host` with your PC's IP

5. **Flash to ESP32**
6. **Start MakoAgent** - ESP32 will auto-connect

## Supported Sensors

- **DHT22** - Temperature & humidity monitoring
- **Vibration sensor** - Print quality detection  
- **Filament flow sensor** - Runout detection
- **ESP32-CAM** - Timelapse and monitoring

## Data Format

ESP32 sends JSON via WebSocket:
```json
{
  "type": "sensorData",
  "temperature": 23.5,
  "humidity": 45.2,
  "vibration": 0,
  "filamentFlow": 512,
  "timestamp": 123456
}
```

## Troubleshooting

- **No connection?** Check WiFi credentials and PC IP
- **No sensor data?** Verify wiring and sensor power
- **Frequent disconnects?** Check WiFi signal strength
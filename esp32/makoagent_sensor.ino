/*
 * MakoAgent ESP32 Sensor Node
 * Collects temperature, humidity, vibration, and filament flow data
 * Sends data via WebSocket to MakoAgent
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi credentials (update these)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MakoAgent server settings
const char* makoagent_host = "192.168.1.100";  // Update with your PC's IP
const int makoagent_port = 8080;

// Pin definitions
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define VIBRATION_PIN 2
#define FILAMENT_PIN A0

// Sensors
DHT dht(DHT_PIN, DHT_TYPE);
WebSocketsClient webSocket;

// Data collection
float temperature = 0;
float humidity = 0;
int vibration = 0;
int filamentFlow = 0;
unsigned long lastReading = 0;
const unsigned long READING_INTERVAL = 5000; // 5 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("🦎 MakoAgent ESP32 Sensor starting...");
  
  // Initialize sensors
  dht.begin();
  pinMode(VIBRATION_PIN, INPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  // Setup WebSocket
  setupWebSocket();
  
  Serial.println("✅ ESP32 sensor ready");
}

void loop() {
  webSocket.loop();
  
  // Read sensors every 5 seconds
  if (millis() - lastReading > READING_INTERVAL) {
    readSensors();
    sendSensorData();
    lastReading = millis();
  }
  
  delay(100);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.print("✅ WiFi connected: ");
  Serial.println(WiFi.localIP());
}

void setupWebSocket() {
  webSocket.begin(makoagent_host, makoagent_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("❌ WebSocket Disconnected");
      break;
      
    case WStype_CONNECTED:
      Serial.printf("✅ WebSocket Connected to: %s\n", payload);
      break;
      
    case WStype_TEXT:
      Serial.printf("📥 Received: %s\n", payload);
      handleCommand((char*)payload);
      break;
      
    default:
      break;
  }
}

void readSensors() {
  // Read temperature and humidity
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  
  // Read vibration (digital pin - simple on/off)
  vibration = digitalRead(VIBRATION_PIN);
  
  // Read filament flow sensor (analog)
  filamentFlow = analogRead(FILAMENT_PIN);
  
  // Validate readings
  if (isnan(temperature)) temperature = 0;
  if (isnan(humidity)) humidity = 0;
  
  Serial.printf("📊 T:%.1f°C H:%.1f%% V:%d F:%d\n", 
                temperature, humidity, vibration, filamentFlow);
}

void sendSensorData() {
  if (webSocket.isConnected()) {
    StaticJsonDocument<200> doc;
    
    doc["type"] = "sensorData";
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["vibration"] = vibration;
    doc["filamentFlow"] = filamentFlow;
    doc["timestamp"] = millis();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    webSocket.sendTXT(jsonString);
  }
}

void handleCommand(String command) {
  StaticJsonDocument<200> doc;
  deserializeJson(doc, command);
  
  String cmd = doc["command"];
  
  if (cmd == "ping") {
    sendPong();
  } else if (cmd == "getStatus") {
    sendStatus();
  }
}

void sendPong() {
  StaticJsonDocument<100> doc;
  doc["type"] = "pong";
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
}

void sendStatus() {
  StaticJsonDocument<200> doc;
  doc["type"] = "status";
  doc["uptime"] = millis();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["wifiRSSI"] = WiFi.RSSI();
  doc["connected"] = webSocket.isConnected();
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
}
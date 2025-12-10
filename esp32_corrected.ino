#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <HardwareSerial.h>
#include <math.h>  // optional for calibration math

// ================== NEW: Timestamp Function =====================
String getTimestamp() {
  time_t now = time(nullptr);
  struct tm* p_tm = localtime(&now);

  char buffer[40];
  sprintf(buffer, "%02d/%02d/%04d - %02d:%02d:%02d",
          p_tm->tm_mon + 1,
          p_tm->tm_mday,
          p_tm->tm_year + 1900,
          p_tm->tm_hour,
          p_tm->tm_min,
          p_tm->tm_sec);

  return String(buffer);
}
// ================================================================

// NEW: Wait for NTP time to be valid
bool waitForNTP() {
  Serial.print("Syncing time");
  for (int i = 0; i < 20; i++) {
    time_t now = time(nullptr);
    if (now > 100000) { 
      Serial.println("\nTime synchronized!");
      return true;
    }
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nFailed to sync time.");
  return false;
}

HardwareSerial Radar(2);

// WiFi & Firebase configuration
#define WIFI_SSID "mahinay francis"
#define WIFI_PASSWORD "05141979"
#define API_KEY "AIzaSyDs6eEpYkKzOIbit60mitGDY6qbLMclxvs"
#define DATABASE_URL "https://esp32-connecttest-default-rtdb.asia-southeast1.firebasedatabase.app/"

// Human Body Temperature (Thermopile)
#define VT_PIN 32
#define VCC 3.0

// Linear calibration constants (CALIBRATE WITH YOUR SENSOR)
// Instructions: Test at 2 known temperatures and calculate:
// k = (temp2 - temp1) / (volt2 - volt1)
// offset = temp1 - (k * volt1)
// Example: if at 37°C sensor reads 0.5V, and at 39°C it reads 0.8V:
// k = (39 - 37) / (0.8 - 0.5) = 6.67
// offset = 37 - (6.67 * 0.5) = 33.67
float k = 6.67;      // °C per volt (REPLACE WITH YOUR CALIBRATION VALUE)
float offset = 33.67; // °C offset (REPLACE WITH YOUR CALIBRATION VALUE)

// ==================== TEMPERATURE FILTERING ============================
#define FILTER_SIZE 10
float tempReadings[FILTER_SIZE] = {0};
int readIndex = 0;
bool filterFilled = false;
// ===================================================================

// Microphone
#define MIC_PIN 34
int micValue = 0;
String soundLevel = "Quiet";

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

#define TRIG 12
#define ECHO 14

bool objectPresent = false;
bool wasObjectPresent = false;
int fallCount = 0;

int presence;
int motionEnergy;

String sleepPattern = "Unknown";

#define GREEN_LED 18
#define RED_LED 19

unsigned long prevMillis = 0;
const long interval = 1000; // Update every 1 second

unsigned long redBlinkPrevious = 0;
const long redBlinkInterval = 500;
bool redState = LOW;

// UNIQUE ESP32 ID
String deviceID;

// NEW: base paths
String basePath;
String infoPath;
String sensorPath;

// NEW: device start record flag
bool sentStartTime = false;

// ==================== OFFLINE BUFFER ============================
struct SensorData {
  float temperature;
  String sound;
  float distance;
  String fallStatus;
  int fallCount;
  String sleepPattern;
  String timestamp;
};

#define BUFFER_SIZE 50
SensorData offlineBuffer[BUFFER_SIZE];
int bufferIndex = 0;
// ================================================================

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(300);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected to WiFi!");

    configTime(28800, 0, "pool.ntp.org");
    waitForNTP();

    deviceID = WiFi.macAddress();
    Serial.print("Device Unique ID: ");
    Serial.println(deviceID);

    // Create base paths once
    basePath = "/devices/" + deviceID;
    infoPath = basePath + "/info";
    sensorPath = basePath + "/sensor";

  } else {
    Serial.println("\nWiFi Connection Failed!");
    deviceID = "UNKNOWN_DEVICE";
  }
}

void pushBufferedData() {
  // Send all cached data when online
  if (WiFi.status() == WL_CONNECTED && signupOK && Firebase.ready() && bufferIndex > 0) {
    for (int i = 0; i < bufferIndex; i++) {
      SensorData data = offlineBuffer[i];
      FirebaseJson json;
      json.add("device_id", deviceID);
      json.add("temperature", data.temperature);
      json.add("sound", data.sound);
      json.add("distance", data.distance);
      json.add("fallStatus", data.fallStatus);
      json.add("fallCount", data.fallCount);
      json.add("sleepPattern", data.sleepPattern);

      if (!Firebase.RTDB.setJSON(&fbdo, sensorPath.c_str(), &json)) {
        Serial.printf("Buffered Firebase error: %s\n", fbdo.errorReason().c_str());
        return; // stop if failed
      }
      Serial.println("Buffered data sent: " + data.timestamp);
    }
    bufferIndex = 0; // clear buffer
  }
}

float adcToVolt(int raw) {
  return raw * (VCC / 4095.0);
}

float getBodyTempC() {
  int vtRaw = analogRead(VT_PIN);
  float vtV = adcToVolt(vtRaw);
  float temp = k * vtV + offset;
  
  // DEBUG: Print actual values before clamping
  // Uncomment this line to see raw readings for calibration
  // Serial.printf("DEBUG - RAW: %d | Voltage: %.3fV | Before clamp: %.2f°C\n", vtRaw, vtV, temp);
  
  // Store reading in filter buffer
  tempReadings[readIndex] = temp;
  readIndex = (readIndex + 1) % FILTER_SIZE;
  
  // Mark filter as filled after first 10 readings
  if (readIndex == 0) filterFilled = true;
  
  // Calculate average of readings in buffer
  float sum = 0;
  int count = filterFilled ? FILTER_SIZE : readIndex;
  for (int i = 0; i < count; i++) {
    sum += tempReadings[i];
  }
  float avgTemp = sum / count;
  
  // Clamp to human range 36–45 °C
  if (avgTemp < 36.0) avgTemp = 36.0;
  if (avgTemp > 45.0) avgTemp = 45.0;
  return avgTemp;
}

void setup() {
  Serial.begin(115200);
  Radar.begin(256000, SERIAL_8N1, 16, 17);

  Serial.println("LD2410B Sleep Monitoring Test");

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  pinMode(RED_LED, OUTPUT);
  digitalWrite(RED_LED, LOW);

  pinMode(GREEN_LED, OUTPUT);
  digitalWrite(GREEN_LED, HIGH);

  pinMode(VT_PIN, INPUT);

  connectWiFi();

  // Firebase Setup
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
    Serial.println("Firebase auth OK");
  } else {
    Serial.printf("Firebase auth failed: %s\n", 
                  config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  unsigned long currentMillis = millis();

  // 🔥 Send start timestamp ONCE
  if (!sentStartTime && signupOK && WiFi.status() == WL_CONNECTED && Firebase.ready()) {
    time_t now = time(nullptr);
    if (now > 100000) {
      Firebase.RTDB.setString(&fbdo, (infoPath + "/deviceStartTime").c_str(), getTimestamp());
      sentStartTime = true;

      Serial.print("Device started at: ");
      Serial.println(getTimestamp());
    }
  }

  // 🔥 Device Last Active — always updates if online
  if (signupOK && WiFi.status() == WL_CONNECTED && Firebase.ready()) {
    Firebase.RTDB.setString(&fbdo, (infoPath + "/deviceLastActive").c_str(), getTimestamp());
  }

  // Push any buffered data if online
  pushBufferedData();

  if (currentMillis - prevMillis >= interval) {
    prevMillis = currentMillis;

    // ------------------- Human Body Temperature -------------------
    float temp = getBodyTempC();

    // ------------------- Radar parsing -------------------
    if (Radar.available() >= 2) {  // read at least 2 bytes
      presence = Radar.read();
      motionEnergy = Radar.read();

      // Sleep pattern detection
      if (presence == 0 && motionEnergy == 0) sleepPattern = "Absent";
      else if (presence && motionEnergy < 5) sleepPattern = "Deep Sleep";
      else if (presence && motionEnergy <= 30) sleepPattern = "Light Sleep";
      else if (presence && motionEnergy > 30) sleepPattern = "Awake";
      else sleepPattern = "Unknown";
    }

    // ------------------- Microphone -------------------
    int total = 0;
    for (int i = 0; i < 50; i++) {
      total += analogRead(MIC_PIN);
      delayMicroseconds(500);
    }
    micValue = total / 50;
    soundLevel = (micValue < 2800) ? "Quiet" : "Crying";

    // ------------------- Ultrasonic -------------------
    digitalWrite(TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);

    long duration = pulseIn(ECHO, HIGH, 30000);
    float distance = duration * 0.034 / 2;

    if (distance > 0 && distance <= 50) objectPresent = true;
    else objectPresent = false;

    if (wasObjectPresent && !objectPresent) fallCount++;
    wasObjectPresent = objectPresent;

    String fallStatus = objectPresent ? "Present" : "Absent";

    // ------------------- Serial Output -------------------
    Serial.printf("📊 Temp: %.2f°C | Sound: %s | Distance: %.2f cm | Status: %s | Falls: %d | Sleep: %s\n",
                  temp, soundLevel.c_str(), distance, fallStatus.c_str(), fallCount, sleepPattern.c_str());

    // ------------------- Prepare sensor data -------------------
    SensorData currentData;
    currentData.temperature = temp;
    currentData.sound = soundLevel;
    currentData.distance = distance;
    currentData.fallStatus = fallStatus;
    currentData.fallCount = fallCount;
    currentData.sleepPattern = sleepPattern;
    currentData.timestamp = getTimestamp();

    // 🔥 Send Sensor Data or cache if offline
    if (signupOK && WiFi.status() == WL_CONNECTED && Firebase.ready()) {
      FirebaseJson json;
      json.add("device_id", deviceID);
      json.add("temperature", temp);
      json.add("sound", soundLevel);
      json.add("distance", distance);
      json.add("fallStatus", fallStatus);
      json.add("fallCount", fallCount);
      json.add("sleepPattern", sleepPattern);

      if (!Firebase.RTDB.setJSON(&fbdo, sensorPath.c_str(), &json)) {
        Serial.printf("Firebase error: %s\n", fbdo.errorReason().c_str());
        // save to buffer if failed
        offlineBuffer[bufferIndex++] = currentData;
        if (bufferIndex >= BUFFER_SIZE) bufferIndex = 0;
      }
    } else {
      // save to buffer if offline
      offlineBuffer[bufferIndex++] = currentData;
      if (bufferIndex >= BUFFER_SIZE) bufferIndex = 0;
    }
  }

  // ------------------- RED LED Blink Fix -------------------
  if (!objectPresent) {
    if (currentMillis - redBlinkPrevious >= redBlinkInterval) {
      redBlinkPrevious = currentMillis;
      redState = !redState;
      digitalWrite(RED_LED, redState);
    }
  } else {
    digitalWrite(RED_LED, LOW);
    redState = LOW;
  }
}

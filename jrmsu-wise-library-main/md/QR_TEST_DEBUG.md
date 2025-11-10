# 🔧 QR Code Authentication Debug Guide

## 🎯 **TESTING STEPS**

### **1. Generate New QR Code**
1. Login manually first with credentials:
   - **Admin**: `KCL-00001` / `admin123`
   - **Student**: `KC-24-A-12345` / `ana123`
2. Go to Profile page
3. Click "Regenerate" to get new QR with streamlined structure
4. Download or screenshot the QR code

### **2. Test QR Login Flow**
1. Logout
2. Go to QR Login mode
3. Scan the new QR code
4. Check browser console for detailed logs

## 🔍 **DEBUG CONSOLE LOGS TO LOOK FOR**

### **Successful Flow Should Show:**
```
🎯 QR Code raw data detected: {"fullName":"Ana Marie Santos"...
📋 QR Code parsed successfully: { userId: "KC-24-A-12345", userType: "student", ... }
🔍 QR Code validation result: { isValid: true, hasData: true }
🆔 AuthContext - Processing QR login: { userId: "KC-24-A-12345", ... }
🔐 AuthContext - Calling database authentication...
🔍 QR Authentication - Received data: { userId: "KC-24-A-12345", hasSessionToken: true, ... }
🔍 AuthContext - Database auth result: { success: true, hasUser: true }
✅ User authenticated successfully via QR login: Ana Marie Santos (KC-24-A-12345)
```

### **If Authentication Fails:**
```
❌ QR Code validation failed: [error message]
❌ AuthContext - QR authentication failed: [error message]
🔍 QR Authentication - Received data: { hasSessionToken: false, hasLegacyAuth: false }
```

## 🛠️ **COMMON ISSUES & FIXES**

### **Issue 1: "Missing required fields"**
**Cause**: QR code has old structure or corrupted data
**Fix**: Regenerate QR code from profile page

### **Issue 2: "Missing authentication token"**
**Cause**: QR code doesn't have sessionToken or legacy auth fields
**Fix**: Check if QR generation is working correctly

### **Issue 3: "User not found"**
**Cause**: Database doesn't have user with that ID
**Fix**: Check sample users are initialized in database

### **Issue 4: "QR code has expired"**
**Cause**: QR code timestamp is older than 30 minutes
**Fix**: Generate fresh QR code

## 🔬 **SAMPLE QR DATA STRUCTURES**

### **New Streamlined Structure (Good)**
```json
{
  "fullName": "Ana Marie Santos",
  "userId": "KC-24-A-12345", 
  "userType": "student",
  "systemId": "JRMSU-LIBRARY",
  "systemTag": "JRMSU-KCS",
  "timestamp": 1640995200000,
  "sessionToken": "base64sessiontoken",
  "role": "Student"
}
```

### **Legacy Structure (Also Supported)**  
```json
{
  "fullName": "Ana Marie Santos",
  "userId": "KC-24-A-12345",
  "userType": "student", 
  "systemId": "JRMSU-LIBRARY",
  "systemTag": "JRMSU-KCS",
  "authCode": "123456",
  "encryptedToken": "base64token",
  "timestamp": 1640995200000,
  "role": "Student"
}
```

## 🚨 **IMMEDIATE DEBUGGING**

### **Step 1: Check QR Content**
In browser console while scanning:
```javascript
// After scanning, check what was detected
console.log('QR Raw Data:', detectedQRString);
```

### **Step 2: Validate QR Structure**
```javascript
// Test QR validation manually
import { validateJRMSUQRCode } from '@/components/qr/StableQRCode';
const result = validateJRMSUQRCode(qrString);
console.log('Validation:', result);
```

### **Step 3: Test Database Lookup**
```javascript
// Test if user exists in database
import { databaseService } from '@/services/database';
const user = databaseService.getUserById('KC-24-A-12345');
console.log('Database User:', user);
```

### **Step 4: Test Authentication**
```javascript
// Test QR authentication directly
const authResult = databaseService.authenticateWithQRCode(parsedQRData);
console.log('Auth Result:', authResult);
```

## 🔄 **RESET INSTRUCTIONS**

### **If Nothing Works:**
1. Clear browser localStorage: `localStorage.clear()`
2. Refresh page to reinitialize sample users
3. Login manually to generate fresh QR code
4. Try QR login again

### **Sample Users Available:**
- **Admin**: `KCL-00001` / `admin123` 
- **Admin with 2FA**: `KCL-00045` / `maria123`
- **Student**: `KC-23-A-00243` / `student123`
- **Student (Ana)**: `KC-24-A-12345` / `ana123` ← **Best for testing**

## 📱 **QR SCANNER TIPS**

1. **Camera Selection**: Chicony USB 2.0 Camera will auto-select
2. **Lighting**: Ensure good lighting on QR code
3. **Distance**: Hold QR code 6-12 inches from camera
4. **Stability**: Keep QR code steady for 2-3 seconds
5. **Logo Space**: New QR codes have logo space but are still readable

## 🎯 **SUCCESS INDICATORS**

### **QR Detected Successfully:**
- ✅ "QRCode detect!" message appears
- ✅ Green loading overlay shows
- ✅ "Verifying QR credentials..." message
- ✅ Automatic redirect to dashboard
- ✅ User is logged in

### **QR Detection Failed:**
- ❌ Red error message appears
- ❌ Scanner continues running
- ❌ Console shows validation errors
- ❌ No login occurs

The system should now work correctly with both new streamlined QR codes and legacy QR codes for backward compatibility.
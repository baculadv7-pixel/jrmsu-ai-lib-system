

# ✅ TODO LIST – Python 2FA & QR System Implementation (Accurate, Stable, Logo-Compatible)

---

## 🧠 1. Python Libraries for 2FA (TOTP)

### 🔧 Replace and finalize library usage:

| Task                | Library                         | Description                                                 |
| ------------------- | ------------------------------- | ----------------------------------------------------------- |
| Generate TOTP codes | **pyotp**                       | Implements RFC 6238 (same standard as Google Authenticator) |
| Generate QR codes   | **qrcode**                      | Creates QR images (used for setup in Authenticator apps)    |
| Scan / Detect QR    | **opencv-python** or **pyzbar** | Reads QR codes using webcam or image input                  |

---

## 🧩 2. What You Can Do with QR Code Login (Python)

| Task                           | Description                                                     | Python Libraries                   |
| ------------------------------ | --------------------------------------------------------------- | ---------------------------------- |
| 🧱 Generate QR codes           | Create QR images (text, URLs, 2FA secrets, etc.)                | `qrcode`, `segno`, `pyqrcode`      |
| 📸 Scan / Detect QR codes      | Read QR codes from webcam or images                             | `pyzbar`, `opencv-python`, `zxing` |
| 🧠 Decode and process QR data  | Extract URLs, text, or special formats                          | Built into the above libraries     |
| 🎬 Animated QR scanner overlay | Show bounding box or scan line (like Google Authenticator)      | `opencv-python` (drawing)          |
| 🔐 2FA / OTP integration       | Generate & verify time-based codes (Google Authenticator style) | `pyotp`, `qrcode`                  |

---

## 🧮 3. System Integration Goals

* [ ] Use **Python** for all:

  * 2FA generation & validation
  * QR code generation
  * QR code scanning and decoding

* [ ] **Do not change** anything in the **design or UI** of the project.

* [ ] You **may update, fix, or insert code** in backend or database only **if needed** to improve accuracy and stability.

---

## 🧱 4. QR Code Readability and Accuracy

* [ ] Make QR codes **readable even with logos embedded**.
* [ ] Use **high error correction levels (Q or H)** in QR generation.
* [ ] Ensure **logos are properly scaled and centered**.
* [ ] Maintain **good contrast, focus, and lighting** for detection.
* [ ] Optimize detection using:

  * Convert image to grayscale
  * Apply slight Gaussian blur (optional)
  * Use adaptive thresholding for contrast
* [ ] Prefer:

  * `cv2.QRCodeDetector()` (OpenCV)
  * `pyzbar.decode()` (ZBar engine)
* [ ] Implement a **retry mechanism** (resize/reprocess) if initial detection fails.
* [ ] Validate decoded data format before login authentication.

---

## 🔐 5. QR Code Login Requirements (QR Code, QR Scanner, QR Generator)

### ✅ Remove These from QR Code Login:

* ❌ 2FA Setup Key
* ❌ Real-Time Authentication Code
* ❌ Expiration of QR Code

### ✅ Keep These (QR Code Login Fields):

| Field                             | Description                | Example                                                               |
| --------------------------------- | -------------------------- | --------------------------------------------------------------------- |
| Full Name                         | User’s registered name     | *Maria Isabel Santos Rodriguez*                                       |
| User ID                           | Unique identifier          | *KC-23-A-00243* (Student) / *KCL-00045* (Admin)                       |
| User Type                         | Role of user               | Student / Admin                                                       |
| Department / Course / Year / Role | Academic or staff info     | *BSIT / 3rd Year / A / Librarian*                                     |
| Email                             | Verification info          | *[maria.rodriguez@jrmsu.edu.ph](mailto:maria.rodriguez@jrmsu.edu.ph)* |
| Encrypted Password Token          | System-readable only       | *hashcode*                                                            |
| Profile Picture Path (optional)   | File path of profile image | `/uploads/users/KC-23-A-00243.png`                                    |

📌 **Logo Placement**

* **JRMSU–KCS** → Student
* **JRMSU–KCL** → Admin
* **JRMSU–Library** → Book QR Codes

✅ **Validation Rules**

* QR Scanner must confirm all fields exist and match database entries.
* QR Code remains stable (non-changing) after registration or manual generation.

---

## ⚙️ 6. 2FA in Settings Page (`http://localhost:8080/settings`)

### Keep the Following Fields:

| Field               | Description                             |
| ------------------- | --------------------------------------- |
| 2FA Setup Key       | Used for linking Google Authenticator   |
| Real-Time Auth Code | Rotating 6-digit TOTP verification code |

* [ ] Ensure setup key and manual entry key match.
* [ ] Validate TOTP accuracy using `pyotp` (RFC 6238 standard).
* [ ] Maintain persistent 2FA state across logout and refresh.
* [ ] Store setup keys securely and encrypted in database.

---

## 🧰 7. Implementation for Accurate Logo-Readable QR Codes

✅ **Best Detection Practices (Python Implementation Notes):**

1. Use high error correction level (**Q** or **H**) when generating the QR code.
2. Capture clear images with proper lighting.
3. Convert the image to grayscale before decoding.
4. Optionally apply Gaussian blur to reduce logo edge interference.
5. Apply adaptive thresholding for sharp contrast.
6. Use:

   * `cv2.QRCodeDetector()` or
   * `pyzbar.decode()`
7. Retry with resized frames if detection fails.
8. Avoid cropping the QR — keep all 3 finder corners visible.
9. For live video, analyze multiple frames for better accuracy.
10. Always verify decoded content format before login validation.

---

## 🗂️ 8. File Paths for QR Logo Images

| File               | Path                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| JRMSU–KCL logo     | `"C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\src\assets\JRMSU-KCL-removebg-preview.png"`     |
| JRMSU–KCS logo     | `"C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\src\assets\JRMSU-KCS-removebg-preview.png"`     |
| JRMSU–Library logo | `"C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\src\assets\JRMSU-Library-removebg-preview.png"` |

---

## 🧩 9. Accuracy & Synchronization Checklist

* [ ] Verify **QR Code Generator** accuracy after registration and profile editing.
* [ ] Ensure **QR Scanner** reads data accurately and matches the backend and database.
* [ ] Confirm that the **QR Scanner** structure matches the **QR Code** structure.
* [ ] Check if the **QR Code Generator** and **QR Scanner** have identical field formats.
* [ ] If inconsistencies are found, **fix and synchronize** all components.

---

## 🧾 10. Final Rules

* [ ] **Do not change** anything in the **frontend or design/UI**.
* [ ] Only **update or insert** backend or database logic if necessary.
* [ ] Make sure every fix maintains **accuracy, stability, and synchronization**.
* [ ] Provide a final **requirements structure document** after verifying all accuracy and logic.



=======================================================

Reminder:
dont ever change the design and ui just add if needed
REMOVE ANY duplication / temporar then merge the duplication / temporary or test file to the original that has almost similar functionality, Do not keep or create any temporary files named normal, basic, demo, simple, test, testing, tmp, temp, or similar — remove or archive them outside the project if necessary.


fix accuration,

check also if the qrcode generator is accurate to the qrcode scan during after registration and during edition, check also if the qrcode generator, qrcode and qrscanner are accurate to the frontend, backend and database. check it, if you find something not accurate make it accurate.

check also if the qrscanner is accurate the qrcode while the qrcode and the qrscanner is accurate to the backend and the database, just check if you find something make it accurate.

is the qr scanner structure required accurate to the qrcode structure requirements then the qr code generator is accurate to structure of the qr scanner and qrcode

still dont change anything in the frontend, backend and database, add insert and fix only if you find something or needed to


show me the requirements structure
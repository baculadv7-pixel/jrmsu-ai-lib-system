# 📋 Profile & Management Pages - Complete Audit & Implementation Plan

## 🎯 Objective

Ensure ALL database fields from the registration flow are displayed and editable in:
1. **Student Management** (http://localhost:8080/students)
2. **Admin Management** (http://localhost:8080/admins)
3. **Profile Page** (http://localhost:8080/profile)

---

## 📊 Database Fields Comparison

### ADMINS Table (38 columns)

**Phase 2 - Personal Information:**
1. ✅ first_name
2. ✅ middle_name
3. ✅ last_name
4. ✅ suffix
5. ✅ full_name (generated)
6. ✅ age
7. ✅ birthdate
8. ✅ gender
9. ✅ email
10. ✅ phone

**Phase 2 - Permanent Address:**
11. ❓ street
12. ❓ barangay
13. ❓ municipality
14. ❓ province
15. ❓ region
16. ✅ country
17. ❓ zip_code

**Phase 2 - Current Address:**
18. ❓ current_street
19. ❓ current_barangay
20. ❓ current_municipality
21. ❓ current_province
22. ❓ current_region
23. ✅ current_country
24. ❓ current_zip
25. ❓ current_landmark
26. ❓ same_as_current

**Phase 2 - Computed:**
27. ❓ permanent_address (full string)
28. ❓ current_address (full string)

**Phase 3 - Institutional:**
29. ✅ admin_id
30. ✅ position

**Phase 4 - Security:**
31. ✅ password_hash
32. ✅ two_factor_enabled
33. ✅ two_factor_secret
34. ✅ qr_code_data
35. ✅ qr_code_generated_at
36. ✅ system_tag
37. ✅ account_status
38. ✅ created_at
39. ✅ updated_at

---

### STUDENTS Table (46 columns)

**Phase 2 - Personal Information:**
1. ✅ first_name
2. ✅ middle_name
3. ✅ last_name
4. ✅ suffix
5. ✅ full_name (generated)
6. ✅ age
7. ✅ birthdate
8. ✅ gender
9. ✅ email
10. ✅ phone

**Phase 2 - Permanent Address (OLD SCHEMA):**
11. ❓ street
12. ❓ barangay
13. ❓ municipality
14. ❓ province
15. ❓ region
16. ✅ country
17. ❓ zip_code

**Phase 2 - Current Address (NEW SCHEMA):**
18. ❓ current_address_street
19. ❓ current_address_barangay
20. ❓ current_address_municipality
21. ❓ current_address_province
22. ❓ current_address_region
23. ❓ current_address_zip
24. ❓ current_address_landmark

**Phase 2 - Permanent Address (NEW SCHEMA):**
25. ❓ permanent_address_street
26. ❓ permanent_address_barangay
27. ❓ permanent_address_municipality
28. ❓ permanent_address_province
29. ❓ permanent_address_region
30. ❓ permanent_address_zip
31. ❓ same_as_current

**Phase 2 - Computed:**
32. ❓ permanent_address (full string)
33. ❓ current_address (full string)

**Phase 3 - Academic:**
34. ✅ student_id
35. ✅ college_department
36. ✅ course_major
37. ✅ year_level
38. ✅ block

**Phase 4 - Security:**
39. ✅ password_hash
40. ✅ two_factor_enabled
41. ✅ two_factor_secret
42. ✅ qr_code_data
43. ✅ qr_code_generated_at
44. ✅ system_tag
45. ✅ account_status
46. ✅ created_at
47. ✅ updated_at

---

## 🔍 Current Status Analysis

### ❌ MISSING Fields in UI (Likely)

**Address Fields (Both Admin & Student):**
- Permanent Address breakdown (street, barangay, municipality, province, region, zip)
- Current Address breakdown (street, barangay, municipality, province, region, zip, landmark)
- same_as_current checkbox

**Display Issues:**
- May only show computed `permanent_address` and `current_address` strings
- Individual address components not editable
- Cannot update address parts separately

---

## 📋 Implementation Plan

### Phase 1: Audit Current UI ✅

**Check Files:**
1. ✅ `src/components/AdminProfileModal.tsx`
2. ✅ `src/components/student/StudentProfileModal.tsx`
3. ✅ `src/pages/Profile.tsx`
4. ✅ `src/pages/AdminManagement.tsx`
5. ✅ `src/pages/StudentManagement.tsx`

**Verify:**
- Which fields are displayed
- Which fields are editable
- Which fields are missing

---

### Phase 2: Add Missing Address Fields

**Admin Profile Modal:**
```typescript
// Permanent Address Section
<div className="space-y-4">
  <Label>Permanent Address</Label>
  <div className="grid grid-cols-2 gap-4">
    <Input label="Street" value={street} onChange={...} />
    <Input label="Barangay" value={barangay} onChange={...} />
    <Input label="Municipality" value={municipality} onChange={...} />
    <Input label="Province" value={province} onChange={...} />
    <Input label="Region" value={region} onChange={...} />
    <Input label="Zip Code" value={zip_code} onChange={...} />
  </div>
</div>

// Current Address Section
<div className="space-y-4">
  <Label>Current Address</Label>
  <Checkbox 
    label="Same as Permanent Address" 
    checked={same_as_current}
    onChange={handleSameAsCurrentToggle}
  />
  <div className="grid grid-cols-2 gap-4">
    <Input label="Street" value={current_street} disabled={same_as_current} />
    <Input label="Barangay" value={current_barangay} disabled={same_as_current} />
    <Input label="Municipality" value={current_municipality} disabled={same_as_current} />
    <Input label="Province" value={current_province} disabled={same_as_current} />
    <Input label="Region" value={current_region} disabled={same_as_current} />
    <Input label="Zip Code" value={current_zip} disabled={same_as_current} />
    <Textarea label="Landmark/Notes" value={current_landmark} />
  </div>
</div>
```

**Student Profile Modal:**
```typescript
// Use NEW SCHEMA field names
permanent_address_street
permanent_address_barangay
permanent_address_municipality
permanent_address_province
permanent_address_region
permanent_address_zip

current_address_street
current_address_barangay
current_address_municipality
current_address_province
current_address_region
current_address_zip
current_address_landmark
```

---

### Phase 3: Update Backend API

**Endpoints to Update:**
```python
# python-backend/app.py

@app.route('/api/users/<user_id>', methods=['PATCH'])
def update_user(user_id):
    data = request.json
    user_type = data.get('userType')
    
    if user_type == 'admin':
        # Update admins table with ALL fields
        update_query = """
            UPDATE admins SET
                first_name = %s,
                middle_name = %s,
                last_name = %s,
                suffix = %s,
                age = %s,
                birthdate = %s,
                gender = %s,
                email = %s,
                phone = %s,
                position = %s,
                street = %s,
                barangay = %s,
                municipality = %s,
                province = %s,
                region = %s,
                zip_code = %s,
                current_street = %s,
                current_barangay = %s,
                current_municipality = %s,
                current_province = %s,
                current_region = %s,
                current_zip = %s,
                current_landmark = %s,
                same_as_current = %s,
                updated_at = NOW()
            WHERE admin_id = %s
        """
    
    elif user_type == 'student':
        # Update students table with ALL fields
        update_query = """
            UPDATE students SET
                first_name = %s,
                middle_name = %s,
                last_name = %s,
                suffix = %s,
                age = %s,
                birthdate = %s,
                gender = %s,
                email = %s,
                phone = %s,
                college_department = %s,
                course_major = %s,
                year_level = %s,
                block = %s,
                permanent_address_street = %s,
                permanent_address_barangay = %s,
                permanent_address_municipality = %s,
                permanent_address_province = %s,
                permanent_address_region = %s,
                permanent_address_zip = %s,
                current_address_street = %s,
                current_address_barangay = %s,
                current_address_municipality = %s,
                current_address_province = %s,
                current_address_region = %s,
                current_address_zip = %s,
                current_address_landmark = %s,
                same_as_current = %s,
                updated_at = NOW()
            WHERE student_id = %s
        """
```

---

### Phase 4: Update Database Service

**File:** `src/services/database.ts`

```typescript
export interface User {
  // ... existing fields ...
  
  // Admin Address Fields
  street?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  region?: string;
  zip_code?: string;
  current_street?: string;
  current_barangay?: string;
  current_municipality?: string;
  current_province?: string;
  current_region?: string;
  current_zip?: string;
  current_landmark?: string;
  same_as_current?: boolean;
  
  // Student Address Fields (NEW SCHEMA)
  permanent_address_street?: string;
  permanent_address_barangay?: string;
  permanent_address_municipality?: string;
  permanent_address_province?: string;
  permanent_address_region?: string;
  permanent_address_zip?: string;
  current_address_street?: string;
  current_address_barangay?: string;
  current_address_municipality?: string;
  current_address_province?: string;
  current_address_region?: string;
  current_address_zip?: string;
  current_address_landmark?: string;
}
```

---

### Phase 5: Global Sync Implementation

**Ensure Updates Propagate:**

1. **Admin Management → Profile Page**
   - Update in AdminProfileModal
   - Refresh Profile page data
   - Update local state

2. **Profile Page → Admin Management**
   - Update in Profile component
   - Refresh AdminManagement list
   - Update local state

3. **Student Management → Profile Page**
   - Update in StudentProfileModal
   - Refresh Profile page data
   - Update local state

4. **Database → All Pages**
   - Backend updates database
   - Frontend fetches updated data
   - All pages show latest info

---

## 🎯 Implementation Checklist

### Frontend

- [ ] Update `User` interface in `src/services/database.ts`
- [ ] Add address fields to `AdminProfileModal.tsx`
- [ ] Add address fields to `StudentProfileModal.tsx`
- [ ] Add address fields to `Profile.tsx`
- [ ] Add "Same as Permanent" checkbox logic
- [ ] Add address validation
- [ ] Test edit/save functionality

### Backend

- [ ] Update `GET /api/users/:id` to return ALL fields
- [ ] Update `PATCH /api/users/:id` to accept ALL fields
- [ ] Add address field validation
- [ ] Test database updates
- [ ] Verify data persistence

### Database

- [ ] Verify all columns exist in `admins` table
- [ ] Verify all columns exist in `students` table
- [ ] Test computed address fields
- [ ] Verify indexes are present

### Testing

- [ ] Create/edit admin with full address
- [ ] Create/edit student with full address
- [ ] Toggle "Same as Permanent" checkbox
- [ ] Verify sync between Management and Profile pages
- [ ] Test with existing users
- [ ] Test with new registrations

---

## 🚀 Next Steps

1. **Audit Current UI** - Check what's missing
2. **Implement Address Fields** - Add to all modals
3. **Update Backend API** - Handle all fields
4. **Test Global Sync** - Verify data flow
5. **Document Changes** - Update user guide

---

## ⚠️ Important Notes

**Address Field Naming:**
- **Admins:** Use `street`, `current_street` (simpler schema)
- **Students:** Use `permanent_address_street`, `current_address_street` (detailed schema)

**Computed Fields:**
- `full_name` - Auto-generated from first/middle/last/suffix
- `permanent_address` - Concatenated from address parts
- `current_address` - Concatenated from current address parts

**Read-Only Fields:**
- Admin ID / Student ID
- Position (Admin)
- Block (Student - extracted from ID)
- Created At
- System Tag

**This is a comprehensive implementation that will take multiple steps to complete properly!**

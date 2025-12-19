# Media Service - Frontend Integration Guide

A comprehensive file upload service with direct MinIO storage and public URL generation. This document serves as the **Single Source of Truth** for frontend integration.

## Table of Contents
1. [UI/UX & Upload Workflow](#section-1-uiux--upload-workflow)
2. [API Reference & Constraints](#section-2-api-reference--constraints)
3. [Error Handling & Edge Cases](#section-3-error-handling--edge-cases)

---

## Section 1: UI/UX & Upload Workflow

### Upload Strategy Analysis

**Strategy:** **Direct Upload via Multer (multipart/form-data)**
- ❌ **No Presigned URLs** - Files upload directly through the API
- ✅ **Server-side Processing** - Multer handles file validation and storage
- ✅ **Immediate Public URLs** - Files are instantly accessible via MinIO public bucket

### Frontend Implementation Steps

```typescript
// 1. User selects file
const handleFileSelect = (file: File) => {
  // 2. Frontend validates BEFORE upload
  if (!validateFile(file)) return;
  
  // 3. Show optimistic preview
  const previewUrl = URL.createObjectURL(file);
  setPreviewImage(previewUrl);
  
  // 4. Start upload with progress
  uploadWithProgress(file);
};

// 5. On success, replace preview with server URL
const onUploadSuccess = (response) => {
  URL.revokeObjectURL(previewUrl); // Clean up
  setProfileImage(response.data.fileUrl);
};
```

### Component Mapping

Based on the upload workflow, implement these UI components:

#### Core Upload Components
- **File Input/Drag & Drop Zone** - Accept image files with validation feedback
- **Image Preview Component** - Show selected file before upload
- **Upload Progress Bar** - Display upload progress with percentage
- **Image Cropper Modal** (Optional) - Allow users to crop before upload
- **Profile Avatar Component** - Display current profile image with edit overlay

#### Supporting Components
- **File Validation Toast** - Show immediate feedback for invalid files
- **Upload Status Indicator** - Loading states and success/error messages
- **Image Gallery** (Future) - Browse and manage uploaded images
- **Delete Confirmation Modal** - Confirm image deletion

### User Journey: The Complete Upload Lifecycle

```
1. User clicks "Change Profile Picture" → File input opens
2. User selects image file → Frontend validates size/type immediately
3. ✅ Valid file → Show local preview (Blob URL) + "Upload" button
4. ❌ Invalid file → Show error toast, clear input
5. User clicks "Upload" → Progress bar appears
6. Upload starts → FormData with multipart/form-data
7. Progress updates → Update progress bar (0-100%)
8. Upload completes → Replace preview with server URL
9. Success feedback → Show "Profile updated" toast
10. Background sync → Kafka event updates other services
```

### UX Best Practices

#### Optimistic Previews
```typescript
// ✅ DO: Show immediate preview for better UX
const showOptimisticPreview = (file: File) => {
  const blobUrl = URL.createObjectURL(file);
  setPreviewImage(blobUrl);
  
  // Clean up when component unmounts or new file selected
  return () => URL.revokeObjectURL(blobUrl);
};
```

#### Constraint Feedback
```typescript
// ✅ DO: Validate immediately after file selection
const validateFile = (file: File) => {
  // Check file type BEFORE network request
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showError('Please select a JPEG, PNG, or WebP image');
    return false;
  }
  
  // Check file size BEFORE network request
  if (file.size > 5 * 1024 * 1024) { // 5MB
    showError(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please select an image under 5MB.`);
    return false;
  }
  
  return true;
};
```

#### Rate Limit Awareness
```typescript
// ✅ DO: Track upload attempts to prevent rate limiting
const uploadTracker = {
  attempts: 0,
  windowStart: Date.now(),
  
  canUpload() {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    // Reset counter if window expired
    if (now - this.windowStart > windowMs) {
      this.attempts = 0;
      this.windowStart = now;
    }
    
    if (this.attempts >= 10) {
      showError('Upload limit reached. Please try again in 15 minutes.');
      return false;
    }
    
    return true;
  },
  
  recordAttempt() {
    this.attempts++;
  }
};
```

---

## Section 2: API Reference & Constraints

All endpoints are accessed through API Gateway at `http://localhost:4000/api/media/*`

### Upload Profile Image

#### POST /api/media/upload-profile-image

**Description:** Upload a profile image with server-side validation

**Authentication:** Required (JWT cookie)

**Headers:**
```
Content-Type: multipart/form-data (STRICT - set automatically by browser)
Cookie: token=jwt_token_here
```

**Multer Configuration Constraints:**
```typescript
// Extracted from multer.ts
const constraints = {
  maxFileSize: 5242880, // 5MB (5 * 1024 * 1024)
  maxFiles: 1,           // Single file only
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/webp'
  ],
  fieldName: 'profileImage' // EXACT field name required
};
```

**Rate Limiting:**
- **Window:** 15 minutes
- **Limit:** 10 uploads per IP
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Request Format:**
```typescript
// ✅ Correct FormData structure
const formData = new FormData();
formData.append('profileImage', file); // Field name MUST be 'profileImage'

fetch('/api/media/upload-profile-image', {
  method: 'POST',
  body: formData,
  credentials: 'include' // Include JWT cookie
  // DO NOT set Content-Type header - browser sets it automatically
});
```

**Success Response (200):**
```json
{
  "success": true,
  "msg": "Profile image uploaded successfully",
  "data": {
    "fileName": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
    "fileUrl": "http://localhost:9000/profile-images/123_a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
    "fileSize": 1024000,
    "mimeType": "image/png"
  }
}
```

**TypeScript Interface:**
```typescript
interface UploadResponse {
  success: boolean;
  msg: string;
  data: {
    fileName: string;    // Format: {userId}_{uuid}.{ext}
    fileUrl: string;     // Direct public URL
    fileSize: number;    // Bytes
    mimeType: string;    // Original MIME type
  };
}
```

---

### Delete Profile Image

#### DELETE /api/media/delete-profile-image

**Description:** Delete a profile image by filename or URL

**Authentication:** Required (JWT cookie)

**Headers:**
```
Content-Type: application/json
Cookie: token=jwt_token_here
```

**Zod Validation Rules:**
```typescript
// Extracted from validation.ts
const deleteSchema = {
  fileName: {
    type: 'string',
    minLength: 1,
    required: true,
    message: 'File name is required'
  }
};
```

**Request Body:**
```typescript
interface DeleteRequest {
  fileName: string; // Can be filename OR full URL
}

// ✅ Both formats work:
// Option 1: Just filename
{ "fileName": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890.png" }

// Option 2: Full URL (service extracts filename)
{ "fileName": "http://localhost:9000/profile-images/123_a1b2c3d4-e5f6-7890-abcd-ef1234567890.png" }
```

**Success Response (200):**
```json
{
  "success": true,
  "msg": "Profile image deleted successfully"
}
```

---

### File URL Structure

**Pattern:** `{MINIO_PUBLIC_URL}/{BUCKET_NAME}/{userId}_{uuid}.{extension}`

**Example:** `http://localhost:9000/profile-images/123_a1b2c3d4-e5f6-7890-abcd-ef1234567890.png`

**Components:**
- `MINIO_PUBLIC_URL`: `http://localhost:9000` (configurable)
- `BUCKET_NAME`: `profile-images` (configurable)
- `userId`: Authenticated user's ID
- `uuid`: Unique identifier (prevents conflicts)
- `extension`: Original file extension

---

## Section 3: Error Handling & Edge Cases

### Master Error Table

| HTTP Status | Backend Code | Error Scenario | User-Facing Message | UI Action |
|-------------|--------------|----------------|-------------------|----------|
| **400** | `No file uploaded` | No file in FormData | "Please select an image to upload" | Clear form, show file input |
| **400** | `LIMIT_FILE_SIZE` | File > 5MB | "Your image is {size}MB. Please select an image under 5MB." | Clear file input, show red helper text |
| **400** | `LIMIT_FILE_COUNT` | Multiple files sent | "Please select only one image at a time" | Clear file input, reset to single file |
| **400** | `Invalid file type` | Wrong MIME type | "Please select a JPEG, PNG, or WebP image" | Clear file input, highlight supported formats |
| **400** | `Validation error` | Missing fileName in delete | "Invalid request. Please try again." | Refresh page or retry action |
| **401** | `Unauthorized - No token provided` | Missing JWT cookie | "Please log in to upload images" | Redirect to login page |
| **401** | `Unauthorized - Invalid token` | Malformed JWT | "Session expired. Please log in again." | Clear auth, redirect to login |
| **401** | `Unauthorized - Token revoked` | Blacklisted token | "Session expired. Please log in again." | Clear auth, redirect to login |
| **401** | `Unauthorized - Session expired` | Redis session gone | "Session expired. Please log in again." | Clear auth, redirect to login |
| **429** | Rate limit exceeded | > 10 uploads/15min | "Upload limit reached. Please try again in {minutes} minutes." | Disable upload button, show countdown |
| **500** | `Failed to upload profile image` | MinIO/server error | "Upload failed. Please try again." | Enable retry button |
| **500** | `Failed to delete profile image` | MinIO/server error | "Delete failed. Please try again." | Enable retry button |

### Frontend Error Handling Implementation

#### File Validation (Client-Side)
```typescript
const validateFileClientSide = (file: File): string | null => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return `Please select a JPEG, PNG, or WebP image. Selected: ${file.type}`;
  }
  
  // Check file size (5MB = 5,242,880 bytes)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return `Your image is ${sizeMB}MB. Please select an image under 5MB.`;
  }
  
  return null; // Valid file
};
```

#### Upload Error Handler
```typescript
const handleUploadError = (error: any) => {
  // Rate limiting
  if (error.status === 429) {
    const retryAfter = error.headers?.['retry-after'] || 900; // 15 minutes default
    const minutes = Math.ceil(retryAfter / 60);
    showError(`Upload limit reached. Please try again in ${minutes} minutes.`);
    setUploadDisabled(true);
    setTimeout(() => setUploadDisabled(false), retryAfter * 1000);
    return;
  }
  
  // Authentication errors
  if (error.status === 401) {
    showError('Session expired. Please log in again.');
    clearAuth();
    redirectToLogin();
    return;
  }
  
  // File validation errors
  if (error.status === 400) {
    const message = error.data?.msg || 'Invalid file. Please try again.';
    showError(message);
    clearFileInput();
    return;
  }
  
  // Server errors
  if (error.status >= 500) {
    showError('Upload failed. Please try again.');
    setRetryAvailable(true);
    return;
  }
  
  // Generic error
  showError('Something went wrong. Please try again.');
};
```

#### Progress Tracking with Error Recovery
```typescript
const uploadWithProgress = async (file: File) => {
  try {
    setUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('profileImage', file);
    
    const response = await fetch('/api/media/upload-profile-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      
      // Track upload progress
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      }
    });
    
    if (!response.ok) {
      throw await response.json();
    }
    
    const result = await response.json();
    
    // Success: Update UI with server URL
    setProfileImage(result.data.fileUrl);
    showSuccess('Profile image updated successfully!');
    
  } catch (error) {
    handleUploadError(error);
  } finally {
    setUploading(false);
    setProgress(0);
  }
};
```

#### Optimistic Updates with Rollback
```typescript
const deleteImageOptimistically = async (fileName: string) => {
  // Store current state for rollback
  const previousImage = profileImage;
  
  // Optimistically update UI
  setProfileImage(null);
  showSuccess('Image deleted');
  
  try {
    const response = await fetch('/api/media/delete-profile-image', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw await response.json();
    }
    
    // Success - optimistic update was correct
    
  } catch (error) {
    // Rollback optimistic update
    setProfileImage(previousImage);
    handleUploadError(error);
  }
};
```

### Edge Cases & Solutions

#### Network Interruption
```typescript
// Implement retry logic for network failures
const retryUpload = async (file: File, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(file);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

#### Memory Management
```typescript
// Clean up blob URLs to prevent memory leaks
const cleanupPreview = () => {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }
};

// Call on component unmount or new file selection
useEffect(() => {
  return () => cleanupPreview();
}, []);
```

#### Concurrent Upload Prevention
```typescript
// Prevent multiple simultaneous uploads
const [isUploading, setIsUploading] = useState(false);

const handleUpload = async (file: File) => {
  if (isUploading) {
    showWarning('Upload in progress. Please wait.');
    return;
  }
  
  setIsUploading(true);
  try {
    await uploadFile(file);
  } finally {
    setIsUploading(false);
  }
};
```

---

## Production Deployment Notes

### Environment Configuration
- Update `MINIO_PUBLIC_URL` for production MinIO endpoint
- Configure proper CORS origins for file uploads
- Set up CDN for faster image delivery
- Implement image optimization (resize, compress)

### Security Considerations
- Validate file content (not just MIME type)
- Implement virus scanning for uploaded files
- Add watermarking for sensitive images
- Monitor for malicious file uploads

### Performance Optimization
- Implement image compression before upload
- Add thumbnail generation
- Use progressive JPEG for better loading
- Consider WebP conversion for better compression
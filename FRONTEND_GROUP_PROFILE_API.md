# Group Profile Image API - Frontend Integration

## API Gateway Base URL
```
http://localhost:4000
```

## Endpoints

### 1. Upload Group Profile Image
```http
POST /api/media/group-profile-images/{groupId}/upload
```

**Headers:**
```javascript
{
  'Authorization': 'Bearer <token>',
  'Content-Type': 'multipart/form-data'
}
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('groupProfileImage', file);
```

**Response:**
```javascript
{
  "success": true,
  "msg": "Group profile image uploaded successfully",
  "data": {
    "fileName": "group-abc123-1234567890.jpg",
    "fileUrl": "http://localhost:3003/uploads/group-abc123-1234567890.jpg",
    "fileSize": 245760,
    "mimeType": "image/jpeg",
    "groupId": "abc123"
  }
}
```

### 2. Delete Group Profile Image
```http
DELETE /api/media/group-profile-images/{groupId}/delete
```

**Headers:**
```javascript
{
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

**Body:**
```javascript
{
  "fileName": "group-abc123-1234567890.jpg"
}
```

**Response:**
```javascript
{
  "success": true,
  "msg": "Group profile image deleted successfully"
}
```

## Frontend Implementation Examples

### React Hook for Group Profile Image
```typescript
import { useState } from 'react';

interface GroupProfileImageHook {
  uploadImage: (groupId: string, file: File) => Promise<any>;
  deleteImage: (groupId: string, fileName: string) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export const useGroupProfileImage = (): GroupProfileImageHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (groupId: string, file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('groupProfileImage', file);
      
      const response = await fetch(`http://localhost:4000/api/media/group-profile-images/${groupId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.msg || 'Upload failed');
      }
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (groupId: string, fileName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:4000/api/media/group-profile-images/${groupId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.msg || 'Delete failed');
      }
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, deleteImage, loading, error };
};
```

### React Component Example
```tsx
import React, { useState } from 'react';
import { useGroupProfileImage } from './hooks/useGroupProfileImage';

interface GroupProfileImageProps {
  groupId: string;
  currentImageUrl?: string;
  isAdmin: boolean;
}

export const GroupProfileImage: React.FC<GroupProfileImageProps> = ({
  groupId,
  currentImageUrl,
  isAdmin
}) => {
  const { uploadImage, deleteImage, loading, error } = useGroupProfileImage();
  const [imageUrl, setImageUrl] = useState(currentImageUrl);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImage(groupId, file);
      setImageUrl(result.data.fileUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageUrl) return;
    
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    try {
      await deleteImage(groupId, fileName);
      setImageUrl(undefined);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="group-profile-image">
      <div className="image-container">
        {imageUrl ? (
          <img src={imageUrl} alt="Group Profile" className="profile-image" />
        ) : (
          <div className="placeholder">No Image</div>
        )}
      </div>
      
      {isAdmin && (
        <div className="controls">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={loading}
            style={{ display: 'none' }}
            id={`upload-${groupId}`}
          />
          <label htmlFor={`upload-${groupId}`} className="upload-btn">
            {loading ? 'Uploading...' : 'Upload Image'}
          </label>
          
          {imageUrl && (
            <button onClick={handleDeleteImage} disabled={loading}>
              Delete Image
            </button>
          )}
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

## Permission Requirements
- Only group **admins** and **co-admins** can upload/delete group profile images
- Regular members can only view the group profile image
- The backend automatically validates permissions before processing requests

## File Constraints
- **Supported formats:** JPG, PNG, GIF, WebP
- **Max file size:** 5MB (configurable in media service)
- **Rate limiting:** Applied to prevent abuse

## Error Handling
Common error responses:
```javascript
// Unauthorized (403)
{
  "success": false,
  "msg": "Only admins can update group profile image"
}

// File too large (413)
{
  "success": false,
  "msg": "File size exceeds limit"
}

// Invalid file type (400)
{
  "success": false,
  "msg": "Invalid file type"
}
```
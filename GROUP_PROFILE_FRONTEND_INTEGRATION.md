# Group Profile Image - Frontend Integration Guide

## Updated Files
- `client/src/api/media.api.ts` - Added group profile image API methods
- `client/src/store/mediaSlice.ts` - Added Redux actions and state management

## API Gateway URLs
- Upload: `POST http://localhost:4000/api/media/group-profile-images/{groupId}/upload`
- Delete: `DELETE http://localhost:4000/api/media/group-profile-images/{groupId}/delete`

## Usage in Components

### Import Required Functions
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { uploadGroupProfileImage, deleteGroupProfileImage, clearError } from '../store/mediaSlice';
```

### Component Implementation
```typescript
const GroupProfileImageUpload = ({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) => {
  const dispatch = useAppDispatch();
  const { uploadingGroup, deletingGroup, error, lastUploadedGroupImage } = useAppSelector(state => state.media);

  const handleUpload = async (file: File) => {
    if (!isAdmin) return;
    await dispatch(uploadGroupProfileImage({ groupId, file }));
  };

  const handleDelete = async (fileName: string) => {
    if (!isAdmin) return;
    await dispatch(deleteGroupProfileImage({ groupId, fileName }));
  };

  return (
    <div>
      {isAdmin && (
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          disabled={uploadingGroup}
        />
      )}
      {error && <div className="error">{error}</div>}
      {uploadingGroup && <div>Uploading...</div>}
    </div>
  );
};
```

## State Structure
```typescript
interface MediaState {
  uploadingGroup: boolean;
  deletingGroup: boolean;
  lastUploadedGroupImage: {
    groupId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  } | null;
}
```

## Permission Check
Only users with `role: 'ADMIN'` or `role: 'CO_ADMIN'` can upload/delete group profile images.
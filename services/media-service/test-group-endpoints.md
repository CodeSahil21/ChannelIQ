# Group Profile Image API Endpoints

## Upload Group Profile Image
```
POST /api/media/group-profile-images/:groupId/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- groupProfileImage: <file>
```

## Delete Group Profile Image
```
DELETE /api/media/group-profile-images/:groupId/delete
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "fileName": "group-abc123-image.jpg"
}
```

## Events Published
- `GROUP_PROFILE_IMAGE_UPLOADED`
- `GROUP_PROFILE_IMAGE_DELETED`

## Chat Service Handlers
- Updates group.imageUrl in database
- Invalidates relevant cache entries
- Validates user permissions (admin/co-admin only)
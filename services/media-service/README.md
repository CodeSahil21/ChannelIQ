# Media Service

Handles file uploads and media management with MinIO object storage.

## Port: 3003

## Features

- Profile image upload with validation
- Direct MinIO public URL generation
- File deletion with URL/filename support
- Rate limiting for uploads
- Kafka event publishing
- Public bucket access (no presigned URLs)

## API Endpoints

- `POST /api/v1/media/upload-profile-image` - Upload profile image
- `DELETE /api/v1/media/delete-profile-image` - Delete profile image

## File Specifications

- **Max size:** 5MB
- **Formats:** JPEG, PNG, WebP
- **Rate limit:** 10 uploads per 15 minutes
- **Storage:** MinIO with public read access

## Environment Variables

```env
PORT=3003
JWT_SECRET=<jwt_secret>
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=profile-images
MINIO_PUBLIC_URL=http://localhost:9000
REDIS_HOST=<redis_host>
REDIS_PORT=<redis_port>
KAFKA_BROKER=localhost:9092
```

## MinIO Setup

1. **Create bucket:**
```bash
mc mb minio/profile-images
```

2. **Set public read policy:**
```bash
mc anonymous set public minio/profile-images
```

## Image URL Format

Uploaded images are accessible via direct public URLs:
```
http://localhost:9000/profile-images/{userId}_{uuid}.{ext}
```

## Upload Response

```json
{
  "success": true,
  "msg": "Profile image uploaded successfully",
  "data": {
    "fileName": "12_uuid.png",
    "fileUrl": "http://localhost:9000/profile-images/12_uuid.png",
    "fileSize": 1024000,
    "mimeType": "image/png"
  }
}
```

## Usage

```bash
npm install
npm run dev
```

## File Handling

- Automatic filename generation with user ID and UUID
- Supports both filename and full URL for deletion
- No presigned URL logic - direct public access only
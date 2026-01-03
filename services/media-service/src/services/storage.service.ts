import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

class StorageService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    this.bucketName = process.env.MINIO_BUCKET_NAME || 'profile-images';
  }

  async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        // console.log(`✅ Bucket '${this.bucketName}' created successfully`);
      } else {
        // console.log(`📋 Bucket '${this.bucketName}' already exists`);
      }
      
      // Set bucket policy to public read
      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`]
        }]
      };
      
      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      // console.log(`✅ Bucket '${this.bucketName}' set to public read`);
      
    } catch (error) {
      console.error('❌ Failed to initialize bucket:', error);
      throw error;
    }
  }

  async uploadFile(
    file: Express.Multer.File, 
    userId: string
  ): Promise<{ fileName: string; fileUrl: string }> {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${userId}_${uuidv4()}${fileExtension}`;
      
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Amz-Meta-Original-Name': file.originalname,
          'X-Amz-Meta-User-Id': userId,
        }
      );

      const publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
      const fileUrl = `${publicUrl}/${this.bucketName}/${fileName}`;
      
      // console.log(`✅ File uploaded successfully: ${fileName}`);
      return { fileName, fileUrl };
      
    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      // Extract filename from URL if it's a full URL
      let actualFileName = fileName;
      if (fileName.startsWith('http')) {
        actualFileName = fileName.split('/').pop() || fileName;
      }
      
      await this.minioClient.removeObject(this.bucketName, actualFileName);
      // console.log(`✅ File deleted successfully: ${actualFileName}`);
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      throw error;
    }
  }




}

export default new StorageService();
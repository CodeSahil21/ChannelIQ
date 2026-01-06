import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

class StorageService {
  private supabase: any;
  private bucketName: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.bucketName = process.env.SUPABASE_BUCKET_NAME || 'profile-images';
  }

  async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists, create if not
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket: any) => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/*', 'video/*', 'application/pdf', 'application/msword', 'application/vnd.*', 'text/plain']
        });
      }
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
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);
      
      return { fileName, fileUrl: publicUrl };
      
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
      
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([actualFileName]);
        
      if (error) throw error;
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      throw error;
    }
  }
}

export default new StorageService();
/**
 * Asset Handler Utility
 * Downloads images from URLs and uploads to S3 bucket strategically
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// S3 Configuration
const S3_BUCKET = process.env.S3_BUCKET || 'hunter-irrigation-supply';
const S3_REGION = process.env.S3_REGION || 'us-west-2'; // Use us-west-2 as default
const S3_ENDPOINT = process.env.S3_ENDPOINT; // Optional, for S3-compatible services

/**
 * Initialize S3 client
 * Uses AWS CLI default credentials (from ~/.aws/credentials or IAM role)
 */
function getS3Client(): S3Client {
  const config: any = {
    region: S3_REGION,
  };

  // If explicit credentials are provided via environment, use them
  // Otherwise, AWS SDK will automatically use AWS CLI default profile
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    };
  }
  // If not provided, AWS SDK will use:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // 2. AWS credentials file (~/.aws/credentials)
  // 3. IAM role (if running on EC2/ECS/Lambda)

  // Use custom endpoint if provided (for S3-compatible services)
  if (S3_ENDPOINT) {
    config.endpoint = S3_ENDPOINT;
    config.forcePathStyle = true; // Required for some S3-compatible services
  }

  return new S3Client(config);
}

/**
 * Download image from URL to temporary file
 */
export async function downloadImage(
  imageUrl: string,
  tempDir: string = '/tmp'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(imageUrl);
      const filename = path.basename(url.pathname) || `image-${Date.now()}.jpg`;
      const filepath = path.join(tempDir, filename);

      const protocol = url.protocol === 'https:' ? https : http;

      const file = fs.createWriteStream(filepath);

      protocol
        .get(imageUrl, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download image: ${response.statusCode}`));
            return;
          }

          response.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve(filepath);
          });
        })
        .on('error', (err) => {
          fs.unlink(filepath, () => {}); // Delete file on error
          reject(err);
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Upload image to S3 bucket
 * Organizes images strategically: products/{brand-slug}/{sku}/{filename}
 */
export async function uploadImageToS3(
  filepath: string,
  brandSlug: string,
  sku: string,
  index: number = 0
): Promise<string | null> {
  try {
    const s3Client = getS3Client();
    console.log(`  📤 Uploading to S3 (${S3_REGION}): ${S3_BUCKET}`);
    const filename = path.basename(filepath);
    const ext = path.extname(filename).toLowerCase();
    const mimetype = getMimeType(filename);

    // Clean SKU for use in path (remove special characters)
    const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const cleanBrandSlug = brandSlug.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

    // Strategic path: products/{brand}/{sku}/{sku}-{index}.{ext}
    // Example: products/hunter-irrigation/hpc-fp/hpc-fp-0.jpg
    const s3Key = `products/${cleanBrandSlug}/${cleanSku}/${cleanSku}-${index}${ext}`;

    // Check if file already exists in S3
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      }));
      console.log(`  ℹ️  Image already exists in S3: ${s3Key}`);
      // Return existing URL
      return getS3Url(s3Key);
    } catch (error: any) {
      // File doesn't exist, proceed with upload
      if (error.name !== 'NotFound') {
        throw error;
      }
    }

    // Read file
    const fileContent = fs.readFileSync(filepath);

    // Upload to S3
    // Note: ACL 'public-read' may not work in all regions/buckets
    // If you get ACL errors, remove ACL and use bucket policy instead
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: mimetype,
      CacheControl: 'max-age=31536000', // 1 year cache
      // ACL: 'public-read', // Commented out - use bucket policy for public access instead
    });

    await s3Client.send(command);

    console.log(`  ✅ Uploaded to S3: ${s3Key}`);
    return getS3Url(s3Key);
  } catch (error) {
    console.error(`Error uploading image ${filepath} to S3:`, error);
    return null;
  }
}

/**
 * Get S3 URL for a given key
 */
function getS3Url(s3Key: string): string {
  if (S3_ENDPOINT) {
    // Custom endpoint (e.g., DigitalOcean Spaces, MinIO)
    return `${S3_ENDPOINT}/${S3_BUCKET}/${s3Key}`;
  } else {
    // Standard AWS S3 URL (us-west-2)
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Process multiple image URLs and upload to S3
 * Returns both S3 URLs and file paths (for creating Vendure assets)
 */
export async function processImages(
  imageUrls: string[],
  brandSlug: string,
  sku: string,
  tempDir: string = '/tmp'
): Promise<{ s3Urls: string[]; filePaths: string[] }> {
  const s3Urls: string[] = [];
  const filePaths: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    if (!imageUrl || imageUrl.trim() === '') {
      continue;
    }

    try {
      // Download image
      const filepath = await downloadImage(imageUrl, tempDir);

      // Upload to S3
      const s3Url = await uploadImageToS3(filepath, brandSlug, sku, i);

      if (s3Url) {
        s3Urls.push(s3Url);
        // Keep file path for Vendure asset creation (will be cleaned up later)
        filePaths.push(filepath);
      } else {
        // Clean up if S3 upload failed
        try {
          fs.unlinkSync(filepath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      console.error(`Error processing image ${imageUrl}:`, error);
      // Continue with next image
    }
  }

  return { s3Urls, filePaths };
}

/**
 * Parse image URLs from CSV Images column
 */
export function parseImageUrls(imagesString: string): string[] {
  if (!imagesString || imagesString.trim() === '') {
    return [];
  }

  // Split by comma and clean up
  return imagesString
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));
}

/**
 * Generate brand slug from brand name
 */
export function generateBrandSlug(brandName: string): string {
  if (!brandName) return 'unknown';
  
  return brandName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

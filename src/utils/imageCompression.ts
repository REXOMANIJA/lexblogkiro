import imageCompression from 'browser-image-compression';

/**
 * Compress and optimize an image file
 * @param file - The image file to compress
 * @returns Compressed image file
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Maximum file size in MB
    maxWidthOrHeight: 1920, // Maximum width or height
    useWebWorker: true, // Use web worker for better performance
    fileType: file.type, // Preserve original file type
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, return original file
    return file;
  }
}

/**
 * Compress multiple image files
 * @param files - Array of image files to compress
 * @returns Array of compressed image files
 */
export async function compressImages(files: File[]): Promise<File[]> {
  const compressionPromises = files.map(file => compressImage(file));
  return Promise.all(compressionPromises);
}

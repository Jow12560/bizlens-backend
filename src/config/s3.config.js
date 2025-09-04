import supabase from './db.config.js'; // Import the Supabase client
import sharp from 'sharp'; // Import sharp for image processing
const supabaseUrl = process.env.SUPABASE_URL; // Ensure this is defined in your environment variables

// Function to upload an image to Supabase Storage with a unique file name
export async function uploadImage(bucketName, filePath, fileBuffer, type = '') {
  // Extract the original file name from the provided filePath
  const originalFileName = filePath.split('/').pop();
  
  // Determine file extension based on type
  const isSignature = type.toLowerCase() === 'signature';
  const fileExtension = isSignature ? 'png' : 'jpg';
  
  // Generate a unique file name using the current timestamp and a random number
  const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExtension}`;
  // Replace the original file name in filePath with the unique file name
  const newFilePath = filePath.replace(originalFileName, uniqueFileName);

  try {
    // Transform the image based on type
    let processedBuffer = fileBuffer;
    const image = sharp(fileBuffer);
    const metadata = await image.metadata();

    if (isSignature) {
      // For Signature type, convert to PNG
      processedBuffer = await image
        .png()
        .toBuffer();
    } else {
      // For other types, convert to JPEG
      processedBuffer = await image
        .jpeg({ 
          quality: 80,
          mozjpeg: true
        })
        .toBuffer();
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(newFilePath, processedBuffer, {
        contentType: isSignature ? 'image/png' : 'image/jpeg'
      });

    if (error) {
      console.error(`[ERROR]: Failed to upload image: ${error.message}`);
      return null;
    }

    // Return the unique file name
    return uniqueFileName;
  } catch (error) {
    console.error(`[ERROR]: Failed to process image: ${error.message}`);
    return null;
  }
}

// Function to delete an image from Supabase storage by the relative file path
export async function deleteImage(bucketName, filePath) {
  if (!filePath) {
    console.error('[ERROR]: Invalid file path');
    return;
  }

  console.log(`[INFO]: Attempting to delete image at path: ${filePath}`);

  // Delete the image by its relative file path in the bucket
  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]); // Ensure filePath is correct (with folder prefix)

  if (error) {
    console.error(`[ERROR]: Failed to delete image: ${error.message}`);
    return false;
  }

  console.log('[INFO]: Image deleted successfully', data);
  return true;
}

// Function to delete all files within a specific folder in Supabase Storage
export async function deleteFolder(bucketName, folderPath) {
  if (!folderPath) {
    console.error('[ERROR]: Invalid folder path');
    return false;
  }

  console.log(`[INFO]: Attempting to delete all files in folder at path: ${folderPath}`);

  // List all files in the specified folder
  const { data: files, error: listError } = await supabase.storage
    .from(bucketName)
    .list(folderPath);

  if (listError) {
    console.error(`[ERROR]: Failed to list files in folder ${folderPath}: ${listError.message}`);
    return false;
  }

  if (!files || files.length === 0) {
    console.log(`[INFO]: No files found in folder ${folderPath}`);
    return true; // Folder is already empty, nothing to delete
  }

  console.log(`[INFO]: Found ${files.length} file(s) in folder ${folderPath}. Attempting to delete each file.`);

  // Attempt to delete each file and log the full URL
  for (const file of files) {
    const filePath = `${folderPath}/${file.name}`.replace(/\/+/g, '/'); // Remove redundant slashes
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`; // Full URL for the file

    console.log(`[INFO]: Attempting to delete file at URL: ${fileUrl}`);

    const { data: deleteData, error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (deleteError) {
      console.error(`[ERROR]: Failed to delete file at URL: ${fileUrl}: ${deleteError.message}`);
    } else {
      console.log(`[INFO]: File at URL: ${fileUrl} deleted successfully.`);
    }
  }

  console.log(`[INFO]: Finished attempting to delete all files in folder ${folderPath}.`);
  return true;
}

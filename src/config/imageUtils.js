// ✅ Function to check if an image needs resizing
export async function checkImageSize(blob, maxSizeMB = 1) {
    const sizeMB = blob.size / (1024 * 1024); // Convert to MB
    console.log(`🔍 Image size: ${sizeMB.toFixed(2)}MB`);
  
    return sizeMB > maxSizeMB; // Returns true if resizing is needed
  }
  
  // ✅ Function to resize & compress images
  export async function resizeAndCompressImage(blob, maxWidth = 4608, maxHeight = 3456, quality = 0.9) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
  
        img.onload = function () {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
  
          // 🔹 Scale down if the image is larger than allowed dimensions
          if (width > maxWidth || height > maxHeight) {
            const scaleFactor = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * scaleFactor);
            height = Math.floor(height * scaleFactor);
          }
  
          canvas.width = width;
          canvas.height = height;
  
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }
  
          // Convert to JPEG (smaller than PNG) & apply compression
          canvas.toBlob(
            function (compressedBlob) {
              resolve(compressedBlob || null);
            },
            "image/jpeg",
            quality // ✅ Uses 90% quality to keep details
          );
        };
      };
    });
  }
  
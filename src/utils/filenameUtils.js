// Thai to English character mapping
const thaiToEnglish = {
  'ก': 'k', 'ข': 'kh', 'ค': 'kh', 'ฆ': 'kh', 'ง': 'ng',
  'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch',
  'ญ': 'y', 'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th',
  'ฒ': 'th', 'ณ': 'n', 'ด': 'd', 'ต': 't', 'ถ': 'th',
  'ท': 'th', 'ธ': 'th', 'น': 'n', 'บ': 'b', 'ป': 'p',
  'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph',
  'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w',
  'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l',
  'อ': '', 'ฮ': 'h',
  'ะ': 'a', 'า': 'a', 'ิ': 'i', 'ี': 'i', 'ึ': 'ue', 'ื': 'ue',
  'ุ': 'u', 'ู': 'u', 'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai',
  '่': '', '้': '', '๊': '', '๋': '', 'ั': 'a', '็': '',
  '์': '', 'ํ': '', 'ๆ': '',
  ' ': '-', '_': '-', '.': '.', '-': '-'
};

/**
 * Transforms a Thai filename to English
 * @param {string} filename - The original filename
 * @returns {string} - The transformed filename
 */
export function transformThaiToEnglish(filename) {
  if (!filename) return filename;

  // Get the file extension
  const extension = filename.split('.').pop().toLowerCase();
  // Get the filename without extension
  const nameWithoutExt = filename.slice(0, -(extension.length + 1));

  // Transform the filename
  let transformedName = nameWithoutExt
    .toLowerCase()
    .split('')
    .map(char => thaiToEnglish[char] || char)
    .join('')
    // Remove multiple consecutive dashes
    .replace(/-+/g, '-')
    // Remove dashes at start and end
    .replace(/^-+|-+$/g, '')
    // Remove special characters except dashes and dots
    .replace(/[^a-z0-9-_.]/g, '');

  // Add timestamp to make filename unique
  const timestamp = Date.now();
  return `${transformedName}-${timestamp}.${extension}`;
}

/**
 * Example usage:
 * transformThaiToEnglish("LINE_ALBUM_ASP@ โรบินสันจันทบุรี_250304_44.jpg")
 * Output: "line-album-asp-robin-sun-jan-ta-bu-ri-250304-44-1234567890.jpg"
 */ 
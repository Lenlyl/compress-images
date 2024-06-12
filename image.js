/*
 * @Author: Lorrin
 * @Date: 2024-06-09 15:02:49
 * @LastEditors: Lorrin
 * @LastEditTime: 2024-06-12 15:08:32
 * @Description: 
 */
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

async function resizeAndSaveImage(inputPath, outputPath, maxSizeKB) {
  const maxSizeBytes = maxSizeKB * 1024;
  let quality = 80; // 初始质量
  let resizedWidth = null;

  // 读取图片
  const image = await sharp(inputPath);
  const metadata = await image.metadata();

  // 定义一个函数来递归地调整图片大小
  async function adjustSize() {
    // 设定等比缩放的宽度
    resizedWidth = Math.round(metadata.width * quality / 100);
    // 压缩图片
    const buffer = await image
      .resize({ width: resizedWidth })
      .jpeg({ quality: quality })
      .toBuffer();

    if (buffer.length <= maxSizeBytes) {
      // 如果图片大小满足要求，保存图片
      await fs.writeFile(outputPath, buffer);
    } else if (quality > 10) {
      // 如果图片太大，降低质量并递归尝试
      quality -= 10;
      await adjustSize();
    } else {
      // 如果质量太低仍然不满足要求，则抛出错误
      throw new Error('Cannot resize image to fit within the specified size.');
    }
  }

  // 开始调整图片大小
  await adjustSize();
}

async function processImagesInDir(inPath, outPath, maxSizeKB) {
  const files = await fs.readdir(inPath);
  const imageFiles = files.filter(file => path.extname(file).toLowerCase() === '.jpg');

  for (const imageFile of imageFiles) {
    const inputPath = path.join(inPath, imageFile);
    const outputPath = path.join(outPath, imageFile);
    try {
      await resizeAndSaveImage(inputPath, outputPath, maxSizeKB);
      console.log(`Processed ${imageFile}`);
    } catch (error) {
      console.error(`Error processing ${imageFile}:`, error);
    }
  }
}

// 使用示例
const dirPath = './inputImages'; // 图片所在的文件夹路径
const outPath = './outImages'; // 压缩后的文件夹路径
const maxSizeKB = 200; // 最大图片大小（KB）
processImagesInDir(dirPath, outPath, maxSizeKB)
  .then(() => console.log('All images processed successfully.'))
  .catch(error => console.error('Error processing images:', error));
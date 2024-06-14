/*
 * @Author: Lorrin
 * @Date: 2024-06-09 15:02:49
 * @LastEditors: Lorrin
 * @LastEditTime: 2024-06-14 10:47:08
 * @Description: 
 */
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

async function resizeAndSaveImage(inputPath, outPath, dirName, maxSizeKB) {
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
      console.log('start save new image');
      // 如果图片大小满足要求，保存图片
      try {
        await fs.mkdir(dirName, { recursive: true });
        await fs.writeFile(outPath, buffer);
        console.log('文件已成功写入:', outPath);
      } catch (error) {
        console.error('写入文件时发生错误:', err);
      }
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

// async function processImagesInDir(inPath, outPath, maxSizeKB) {
//   const files = await fs.readdir(inPath);
async function processImagesInDir(filePathList, outPath, maxSizeKB) {
  const files = [...filePathList]
  const imageFiles = files.filter(file => path.extname(file).toLowerCase() === '.jpg');

  for (const imageFile of imageFiles) {
    const inputPath = imageFile;
    const imageName = path.basename(imageFile); // 文件名
    const dirName = path.dirname(imageFile).replace("inputImages", "outImages"); // 文件所在目录
    console.log('2-dirName:', dirName);
    // console.log('imageName: ', imageName);
    // const outputPath = path.join(outPath, imageName); // 转换后保存到新目录下
    const outputPath =  imageFile.replace("inputImages", "outImages")// 保存原目录结构
    console.log('3-outputPath:',outputPath);
    try {
      await resizeAndSaveImage(inputPath, outputPath, dirName, maxSizeKB);
      console.log(`Processed ${imageFile}`);
    } catch (error) {
      console.error(`Error processing ${imageFile}:`, error);
    }
  }
}

// await resizeAndSaveImage(inputPath, outputPath, maxSizeKB)
//               console.log(`Processed ${imageFile}`);
// 使用示例
const dirPath = './inputImages'; // 图片所在的文件夹路径
const outPath = './outImages'; // 压缩后的文件夹路径
const maxSizeKB = 200; // 最大图片大小（KB）
var imagesPathList = [];
async function traverseDirectory(dir) {
  // 读取目录内容
  const files = await fs.readdir(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    fs.stat(fullPath).then(stats => {
      // console.log(stats);
      // 如果是目录，则递归遍历
      if (stats.isDirectory()) {
        console.log(`遍历目录: ${fullPath}`);
        traverseDirectory(fullPath);
      } else {
        // 如果是文件，则输出文件名
        console.log(`找到文件: ${fullPath}`);
        // 保存读取的图片路径
        imagesPathList.push(fullPath);
      }
    })
  });
}
traverseDirectory(dirPath)
console.log('1----', imagesPathList);

setTimeout(() => {
  console.log('2----', imagesPathList);
  processImagesInDir(imagesPathList, outPath, maxSizeKB)
    .then(() => console.log('All images processed successfully.'))
    .catch(error => console.error('Error processing images:', error));
}, 2000)
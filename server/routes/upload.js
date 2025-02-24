const express = require('express');
const router = express.Router();
const multer = require('multer');
const { minioClient, bucket } = require('../config/minio');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 临时文件存储目录
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// 配置multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

// 检查文件是否已存在
router.post('/check', async (req, res) => {
  try {
    const { hash, name } = req.body;
    const exists = await minioClient.statObject(bucket, `files/${hash}/${name}`).catch(() => false);
    
    if (exists) {
      res.json({
        exists: true,
        url: `http://113.45.161.48:9000/${bucket}/files/${hash}/${name}`
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查文件失败'
    });
  }
});

// 上传分片
router.post('/chunk', upload.single('file'), (req, res) => {
  res.json({
    success: true,
    message: '分片上传成功'
  });
});

// 合并分片
router.post('/merge', async (req, res) => {
  try {
    const { hash, name, chunks } = req.body;
    const filePath = path.join(UPLOAD_DIR, hash, name);
    const chunkDir = path.join(UPLOAD_DIR, hash);
    
    // 创建写入流
    const writeStream = fs.createWriteStream(filePath);
    
    // 按顺序写入分片
    for (let i = 0; i < chunks; i++) {
      const chunkPath = path.join(chunkDir, i.toString());
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', resolve);
        readStream.on('error', reject);
      });
      fs.unlinkSync(chunkPath);
    }
    
    writeStream.end();
    
    // 上传到MinIO
    await minioClient.fPutObject(
      bucket,
      `files/${hash}/${name}`,
      filePath
    );
    
    // 清理临时文件
    fs.unlinkSync(filePath);
    fs.rmdirSync(chunkDir);
    
    res.json({
      success: true,
      url: `http://113.45.161.48:9000/${bucket}/files/${hash}/${name}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '合并文件失败'
    });
  }
});

// 上传图片
router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    const file = req.file;
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: '只能上传图片文件'
      });
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `images/${Date.now()}${fileExt}`;

    // 上传到MinIO
    await minioClient.putObject(bucket, fileName, file.buffer);

    // 生成访问URL
    const fileUrl = `http://113.45.161.48:9000/${bucket}/${fileName}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        type: 'image',
        name: file.originalname,
        size: file.size
      }
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({
      success: false,
      message: '上传图片失败'
    });
  }
});

// 上传文件
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `files/${Date.now()}${fileExt}`;

    // 上传到MinIO
    await minioClient.putObject(bucket, fileName, file.buffer);

    // 生成访问URL
    const fileUrl = `http://113.45.161.48:9000/${bucket}/${fileName}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        type: 'file',
        name: file.originalname,
        size: file.size
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({
      success: false,
      message: '上传文件失败'
    });
  }
});

module.exports = router; 
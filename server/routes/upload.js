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

// 上传文件
router.post('/', upload.single('file'), async (req, res) => {
  console.log('收到上传请求:', req.file ? '有文件' : '无文件');
  try {
    if (!req.file) {
      console.log('没有接收到文件');
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    const file = req.file;
    console.log('文件信息:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}${fileExt}`;
    const fileType = file.mimetype.startsWith('image/') ? 'image' : 'file';
    const filePath = `${fileType}s/${fileName}`;

    console.log('准备上传到MinIO:', {
      bucket,
      filePath
    });

    // 上传到MinIO
    await minioClient.putObject(bucket, filePath, file.buffer);
    console.log('MinIO上传成功');

    // 生成访问URL
    const fileUrl = `http://113.45.161.48:9000/${bucket}/${filePath}`;

    console.log('生成的文件URL:', fileUrl);

    res.json({
      success: true,
      data: {
        url: fileUrl,
        type: fileType,
        name: file.originalname,
        size: file.size
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({
      success: false,
      message: '上传文件失败: ' + error.message
    });
  }
});

module.exports = router; 
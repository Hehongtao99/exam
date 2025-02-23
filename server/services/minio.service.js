const Minio = require('minio');
const config = require('../config/minio');

const minioClient = new Minio.Client({
  endPoint: config.endPoint,
  port: config.port,
  useSSL: config.useSSL,
  accessKey: config.accessKey,
  secretKey: config.secretKey
});

// 确保 bucket 存在
async function ensureBucket() {
  const exists = await minioClient.bucketExists(config.bucket);
  if (!exists) {
    await minioClient.makeBucket(config.bucket);
  }
}

// 上传文件
async function uploadFile(file) {
  await ensureBucket();
  const fileName = `${Date.now()}-${file.originalname}`;
  await minioClient.putObject(config.bucket, fileName, file.buffer);
  return {
    url: `http://${config.endPoint}:${config.port}/${config.bucket}/${fileName}`,
    fileName
  };
}

module.exports = {
  uploadFile
}; 
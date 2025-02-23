const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: '113.45.161.48',
  port: 9000,
  useSSL: false,
  accessKey: 'hht5002342003',
  secretKey: 'hht5002342003'
});

const bucket = 'chat-media';

// 确保bucket存在
const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket);
      // 设置bucket策略为公开读
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`]
          }
        ]
      };
      await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
    }
    console.log('MinIO bucket 已就绪:', bucket);
  } catch (error) {
    console.error('MinIO bucket初始化失败:', error);
  }
};

// 立即初始化bucket
ensureBucket().catch(console.error);

module.exports = {
  minioClient,
  bucket
}; 
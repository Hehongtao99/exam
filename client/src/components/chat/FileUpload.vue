<template>
  <div class="file-upload">
    <a-upload
      :multiple="true"
      :show-upload-list="false"
      :before-upload="handleBeforeUpload"
      :custom-request="handleCustomUpload"
    >
      <div class="upload-trigger">
        <slot>
          <a-button>
            <template #icon>
              <span class="anticon">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="upload" width="1em" height="1em" fill="currentColor"><path d="M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z"></path></svg>
              </span>
            </template>
            选择文件
          </a-button>
        </slot>
      </div>
    </a-upload>

    <!-- 上传进度列表 -->
    <div v-if="uploadingFiles.length > 0" class="upload-list">
      <div 
        v-for="file in uploadingFiles" 
        :key="file.uid"
        class="upload-item"
      >
        <div class="file-info">
          <span class="file-icon">
            <svg viewBox="64 64 896 896" focusable="false" data-icon="file" width="1em" height="1em" fill="currentColor"><path d="M534 352V136H232v752h560V394H576a42 42 0 01-42-42z"></path><path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM602 137.8L790.2 326H602V137.8zM792 888H232V136h302v216a42 42 0 0042 42h216v494z"></path></svg>
          </span>
          <div class="file-details">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-size">{{ formatFileSize(file.size) }}</div>
          </div>
        </div>
        
        <div class="upload-progress">
          <a-progress 
            :percent="file.progress" 
            :status="file.status"
            :show-info="false"
            :stroke-width="4"
          />
          <span class="progress-text">{{ file.progress }}%</span>
          <a-button 
            v-if="file.status === 'uploading'"
            type="link" 
            danger
            size="small"
            @click="cancelUpload(file)"
          >
            取消
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import SparkMD5 from 'spark-md5';

const props = defineProps({
  maxSize: {
    type: Number,
    default: 1024 * 1024 * 50 // 50MB
  },
  chunkSize: {
    type: Number,
    default: 1024 * 1024 * 2 // 2MB
  }
});

const emit = defineEmits(['success', 'error']);

const uploadingFiles = ref([]);
const uploadControllers = new Map();

// 处理文件上传前的检查
const handleBeforeUpload = (file) => {
  if (file.size > props.maxSize) {
    message.error(`文件大小不能超过${props.maxSize / 1024 / 1024}MB`);
    return false;
  }
  return true;
};

// 计算文件hash
const calculateHash = (file) => {
  return new Promise((resolve) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      spark.append(e.target.result);
      resolve(spark.end());
    };
  });
};

// 自定义上传实现
const handleCustomUpload = async ({ file, onProgress, onSuccess, onError }) => {
  try {
    const fileHash = await calculateHash(file);
    const uploadFile = {
      uid: file.uid,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading'
    };
    uploadingFiles.value.push(uploadFile);

    // 检查文件是否已存在
    const checkResponse = await fetch('/api/upload/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hash: fileHash,
        name: file.name,
        size: file.size
      })
    });

    const checkResult = await checkResponse.json();
    if (checkResult.exists) {
      // 文件已存在，直接使用
      uploadFile.progress = 100;
      uploadFile.status = 'success';
      onSuccess(checkResult.url);
      emit('success', {
        name: file.name,
        url: checkResult.url
      });
      return;
    }

    // 分片上传
    const chunks = Math.ceil(file.size / props.chunkSize);
    const controller = new AbortController();
    uploadControllers.set(file.uid, controller);

    for (let i = 0; i < chunks; i++) {
      const start = i * props.chunkSize;
      const end = Math.min(start + props.chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('hash', fileHash);
      formData.append('name', file.name);
      formData.append('chunk', i);
      formData.append('chunks', chunks);

      await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      uploadFile.progress = Math.round((i + 1) * 100 / chunks);
      onProgress({ percent: uploadFile.progress });
    }

    // 合并分片
    const mergeResponse = await fetch('/api/upload/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hash: fileHash,
        name: file.name,
        size: file.size,
        chunks
      })
    });

    const mergeResult = await mergeResponse.json();
    uploadFile.status = 'success';
    onSuccess(mergeResult.url);
    emit('success', {
      name: file.name,
      url: mergeResult.url
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    uploadFile.status = 'exception';
    onError(error);
    emit('error', error);
  } finally {
    uploadControllers.delete(file.uid);
  }
};

// 取消上传
const cancelUpload = (file) => {
  const controller = uploadControllers.get(file.uid);
  if (controller) {
    controller.abort();
    uploadControllers.delete(file.uid);
  }
  const index = uploadingFiles.value.findIndex(f => f.uid === file.uid);
  if (index > -1) {
    uploadingFiles.value.splice(index, 1);
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.upload-list {
  margin-top: 16px;
}

.upload-item {
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.file-icon {
  font-size: 24px;
  color: #1890ff;
  margin-right: 8px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.upload-progress {
  display: flex;
  align-items: center;
}

.progress-text {
  margin: 0 8px;
  font-size: 12px;
  color: #666;
}
</style> 
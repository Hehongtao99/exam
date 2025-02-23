<template>
  <div class="questions-container">
    <div class="header">
      <h2>{{ questionBank?.name }} - 题目管理</h2>
      <a-space>
        <a-select v-model:value="currentType" style="width: 120px">
          <a-select-option value="">全部类型</a-select-option>
          <a-select-option value="single">单选题</a-select-option>
          <a-select-option value="multiple">多选题</a-select-option>
          <a-select-option value="judge">判断题</a-select-option>
          <a-select-option value="essay">问答题</a-select-option>
        </a-select>
        <a-button type="primary" @click="showCreateModal">
          添加题目
        </a-button>
      </a-space>
    </div>

    <a-table :columns="columns" :data-source="questions" :loading="loading">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
        </template>
        <template v-if="column.key === 'content'">
          <div style="max-width: 300px; white-space: pre-wrap;">{{ record.content }}</div>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm
              title="确定要删除这道题目吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 创建/编辑题目对话框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="1200px"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :maskClosable="false"
    >
      <div class="modal-content" style="display: flex; gap: 16px;">
        <!-- 左侧智能输入区域 -->
        <div class="input-section" style="flex: 1; padding: 16px; border-right: 1px solid #f0f0f0;">
          <a-collapse style="margin-bottom: 16px;">
            <a-collapse-panel header="智能录入格式说明" key="1">
              <div class="format-guide">
                <h4>支持以下格式：</h4>
                <div class="format-item">
                  <div class="format-title">单选题格式：</div>
                  <div class="format-content">题目内容... A. 选项1 B. 选项2 C. 选项3 D. 选项4 答案: C</div>
                </div>
                <div class="format-item">
                  <div class="format-title">多选题格式：</div>
                  <div class="format-content">题目内容... A. 选项1 B. 选项2 C. 选项3 D. 选项4 答案: A,B</div>
                </div>
                <div class="format-item">
                  <div class="format-title">判断题格式：</div>
                  <div class="format-content">题目内容... 答案: true（或false）</div>
                  <div class="format-note" style="font-size: 12px; color: #666; margin-top: 4px;">注：答案可以是 true/false，不区分大小写</div>
                </div>
                <div class="format-item">
                  <div class="format-title">问答题格式：</div>
                  <div class="format-content">题目内容... 答案: 答案内容</div>
                </div>
                <div class="format-item" style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e8e8e8;">
                  <div class="format-title" style="color: #1890ff;">批量录入说明：</div>
                  <div class="format-content" style="background-color: #e6f7ff; border: 1px solid #91d5ff;">
                    1. 每道题目之间请用空行分隔（按两次回车）
                    2. 支持混合录入不同类型的题目
                    3. 录入后可在预览界面中查看所有题目详情
                  </div>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
          <a-textarea
            v-model:value="inputText"
            placeholder="请在此输入题目内容..."
            :rows="16"
            @input="parseInput"
            style="margin-bottom: 16px;"
          />
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section" style="flex: 1; padding: 16px;">
          <a-form :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
            <a-form-item label="题目类型" required>
              <a-select v-model:value="formData.type">
                <a-select-option value="single">单选题</a-select-option>
                <a-select-option value="multiple">多选题</a-select-option>
                <a-select-option value="judge">判断题</a-select-option>
                <a-select-option value="essay">问答题</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="题目内容" required>
              <a-textarea v-model:value="formData.content" :rows="4" placeholder="请输入题目内容" />
            </a-form-item>
            <template v-if="['single', 'multiple'].includes(formData.type)">
              <a-form-item label="选项" required>
                <div v-for="(value, key) in formData.options" :key="key" class="option-item">
                  <a-input-group compact>
                    <div class="option-prefix">
                      <template v-if="formData.type === 'single'">
                        <a-radio
                          :value="key"
                          :checked="formData.answer === key"
                          @change="() => formData.answer = key"
                        >
                          {{ key }}
                        </a-radio>
                      </template>
                      <template v-else>
                        <a-checkbox 
                          :value="key"
                          :checked="formData.answer && formData.answer.includes(key)"
                          @change="e => handleMultipleAnswerChange(e.target.checked, key)"
                        >
                          {{ key }}
                        </a-checkbox>
                      </template>
                    </div>
                    <a-input 
                      v-model:value="formData.options[key]" 
                      style="width: calc(100% - 80px)"
                      placeholder="请输入选项内容"
                    />
                    <a-button
                      type="link"
                      danger
                      style="width: 32px; padding: 0"
                      @click="removeOption(key)"
                      :disabled="Object.keys(formData.options).length <= 2"
                    >
                      删除
                    </a-button>
                  </a-input-group>
                </div>
                <a-button 
                  type="dashed" 
                  block 
                  @click="addOption" 
                  style="margin-top: 8px"
                  :disabled="Object.keys(formData.options).length >= 26"
                >
                  添加选项
                </a-button>
              </a-form-item>
            </template>
            <a-form-item label="答案" required>
              <template v-if="formData.type === 'single'">
                <a-select v-model:value="formData.answer">
                  <a-select-option
                    v-for="(_, index) in formData.options"
                    :key="index"
                    :value="String.fromCharCode(65 + index)"
                  >
                    {{ String.fromCharCode(65 + index) }}
                  </a-select-option>
                </a-select>
              </template>
              <template v-else-if="formData.type === 'multiple'">
                <a-select
                  v-model:value="formData.answer"
                  mode="multiple"
                  :options="Object.keys(formData.options).map(key => ({ 
                    value: key, 
                    label: key 
                  }))"
                  @change="value => formData.answer = value.sort().join(',')"
                />
              </template>
              <template v-else-if="formData.type === 'judge'">
                <a-radio-group v-model:value="formData.answer">
                  <a-radio :value="true">正确</a-radio>
                  <a-radio :value="false">错误</a-radio>
                </a-radio-group>
              </template>
              <template v-else>
                <a-textarea v-model:value="formData.answer" :rows="4" placeholder="请输入答案" />
              </template>
            </a-form-item>
            <a-form-item label="解析">
              <a-textarea v-model:value="formData.analysis" :rows="4" placeholder="请输入题目解析" />
            </a-form-item>
          </a-form>
        </div>
      </div>
    </a-modal>

    <!-- 预览多个题目对话框 -->
    <a-modal
      v-model:open="previewModalVisible"
      title="预览解析后的题目"
      width="1200px"
      @ok="handleBatchSave"
      @cancel="previewModalVisible = false"
      :maskClosable="false"
      :bodyStyle="{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }"
    >
      <div class="preview-content">
        <a-collapse v-model:activeKey="activeKeys">
          <a-collapse-panel 
            v-for="(question, index) in previewQuestions" 
            :key="index"
            :class="'preview-panel-' + question.type"
          >
            <template #header>
              <div class="preview-panel-header">
                <span class="preview-panel-index">{{ index + 1 }}.</span>
                <span class="preview-panel-type">
                  <a-tag :color="getTypeColor(question.type)">{{ getTypeText(question.type) }}</a-tag>
                </span>
                <span class="preview-panel-content">{{ question.content }}</span>
                <span class="preview-panel-answer">
                  <a-tag :color="getAnswerTagColor(question)">
                    答案: {{ formatAnswerPreview(question) }}
                  </a-tag>
                </span>
              </div>
            </template>
            <div class="question-preview-detail">
              <div class="preview-item">
                <span class="label">题目内容：</span>
                <div class="content">{{ question.content }}</div>
              </div>
              <template v-if="['single', 'multiple'].includes(question.type)">
                <div class="preview-item">
                  <span class="label">选项：</span>
                  <div class="content options-list">
                    <div 
                      v-for="(value, key) in question.options" 
                      :key="key" 
                      class="option-item"
                      :class="{ 'option-correct': isCorrectOption(question, key) }"
                    >
                      <span class="option-key">{{ key }}.</span>
                      <span class="option-value">{{ value }}</span>
                    </div>
                  </div>
                </div>
              </template>
              <div class="preview-item">
                <span class="label">答案：</span>
                <div class="content">
                  <template v-if="['single', 'multiple'].includes(question.type)">
                    <div class="answer-options">
                      <a-tag 
                        v-for="key in question.answer.split(',')" 
                        :key="key"
                        :color="getAnswerTagColor(question)"
                      >
                        {{ key }}. {{ question.options[key] }}
                      </a-tag>
                    </div>
                  </template>
                  <template v-else>
                    <a-tag :color="getAnswerTagColor(question)">{{ formatAnswer(question) }}</a-tag>
                  </template>
                </div>
              </div>
            </div>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import axios from 'axios'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(false)
const questions = ref([])
const questionBank = ref(null)
const currentType = ref('')
const modalVisible = ref(false)
const modalTitle = ref('添加题目')
const inputText = ref('')
const previewModalVisible = ref(false)
const previewQuestions = ref([])
const activeKeys = ref([])

const formData = ref({
  id: null,
  type: 'single',
  content: '',
  options: {
    A: '',
    B: '',
    C: '',
    D: ''
  },
  answer: '',
  analysis: ''
})

const columns = [
  {
    title: '题目类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
  },
  {
    title: '题目内容',
    dataIndex: 'content',
    key: 'content'
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    width: 150
  }
]

const previewColumns = [
  {
    title: '题目类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
  },
  {
    title: '题目内容',
    dataIndex: 'content',
    key: 'content'
  },
  {
    title: '答案',
    dataIndex: 'answer',
    key: 'answer'
  }
]

const getTypeColor = (type) => {
  const colors = {
    single: 'blue',
    multiple: 'green',
    judge: 'orange',
    essay: 'purple'
  }
  return colors[type]
}

const getTypeText = (type) => {
  const texts = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    essay: '问答题'
  }
  return texts[type]
}

const parseMultipleQuestions = (input) => {
  const questions = input.split(/\n\s*\n+/).filter(q => q.trim());
  const parsedQuestions = [];

  for (const questionText of questions) {
    const parsed = parseQuestion(questionText.trim());
    if (parsed) {
      parsedQuestions.push(parsed);
    }
  }

  if (parsedQuestions.length > 0) {
    previewQuestions.value = parsedQuestions;
    previewModalVisible.value = true;
  } else {
    message.error('没有识别到有效的题目，请检查格式');
  }
};

const parseQuestion = (text) => {
  const singleRegex = /^(.*?)\s*A\.\s*(.*?)\s*B\.\s*(.*?)\s*C\.\s*(.*?)\s*D\.\s*(.*?)\s*答案:\s*([A-D])$/;
  const singleMatch = text.match(singleRegex);
  
  if (singleMatch) {
    return {
      type: 'single',
      content: singleMatch[1].trim(),
      options: {
        A: singleMatch[2].trim(),
        B: singleMatch[3].trim(),
        C: singleMatch[4].trim(),
        D: singleMatch[5].trim()
      },
      answer: singleMatch[6].trim()
    };
  }

  const multipleRegex = /^(.*?)\s*A\.\s*(.*?)\s*B\.\s*(.*?)\s*C\.\s*(.*?)\s*D\.\s*(.*?)\s*答案:\s*([A-D,]+)$/;
  const multipleMatch = text.match(multipleRegex);
  
  if (multipleMatch) {
    return {
      type: 'multiple',
      content: multipleMatch[1].trim(),
      options: {
        A: multipleMatch[2].trim(),
        B: multipleMatch[3].trim(),
        C: multipleMatch[4].trim(),
        D: multipleMatch[5].trim()
      },
      answer: multipleMatch[6].trim()
    };
  }

  const judgeRegex = /^(.*?)\s*答案:\s*(true|false|True|False|TRUE|FALSE)$/i;
  const judgeMatch = text.match(judgeRegex);
  
  if (judgeMatch) {
    return {
      type: 'judge',
      content: judgeMatch[1].trim(),
      options: {},
      answer: judgeMatch[2].toLowerCase() === 'true'
    };
  }

  const essayRegex = /^(.*?)\s*答案:\s*(.+)$/s;
  const essayMatch = text.match(essayRegex);
  
  if (essayMatch) {
    return {
      type: 'essay',
      content: essayMatch[1].trim(),
      options: {},
      answer: essayMatch[2].trim()
    };
  }

  return null;
};

const parseInput = () => {
  if (!inputText.value.trim()) return;
  
  if (inputText.value.includes('\n\n')) {
    parseMultipleQuestions(inputText.value);
  } else {
    const question = parseQuestion(inputText.value);
    if (question) {
      formData.value = {
        ...formData.value,
        ...question
      };
      message.success('题目解析成功！');
    } else {
      message.error('输入格式不正确，请检查！');
    }
  }
};

const handleBatchSave = async () => {
  try {
    const results = [];
    for (const question of previewQuestions.value) {
      const data = {
        ...question,
        bankId: route.params.id
      };
      const res = await axios.post('/api/questions', data);
      results.push(res.data.success);
    }
    
    const successCount = results.filter(r => r).length;
    if (successCount === previewQuestions.value.length) {
      message.success(`成功录入 ${successCount} 道题目`);
    } else {
      message.warning(`成功录入 ${successCount} 道题目，失败 ${previewQuestions.value.length - successCount} 道`);
    }
    
    previewModalVisible.value = false;
    inputText.value = '';
    await fetchQuestions();
  } catch (error) {
    message.error('批量录入失败');
  }
};

// 获取题库信息
const fetchQuestionBank = async () => {
  try {
    loading.value = true
    const res = await axios.get(`/api/question-banks/${route.params.id}`)
    if (res.data.success) {
      questionBank.value = res.data.data
    } else {
      message.error(res.data.message || '获取题库信息失败')
    }
  } catch (error) {
    console.error('获取题库信息失败:', error)
    message.error(error.response?.data?.message || '获取题库信息失败')
  } finally {
    loading.value = false
  }
}

// 获取题目列表
const fetchQuestions = async () => {
  try {
    loading.value = true
    const params = { bankId: route.params.id }
    if (currentType.value) {
      params.type = currentType.value
    }
    const res = await axios.get('/api/questions', { params })
    if (res.data.success) {
      questions.value = res.data.data
    }
  } catch (error) {
    message.error('获取题目列表失败')
  } finally {
    loading.value = false
  }
}

// 显示创建对话框
const showCreateModal = () => {
  modalTitle.value = '添加题目'
  formData.value = {
    id: null,
    type: 'single',
    content: '',
    options: {
      A: '',
      B: '',
      C: '',
      D: ''
    },
    answer: '',
    analysis: ''
  }
  modalVisible.value = true
}

// 处理编辑
const handleEdit = (record) => {
  modalTitle.value = '编辑题目'
  formData.value = {
    id: record.id,
    type: record.type,
    content: record.content,
    options: record.type === 'single' || record.type === 'multiple' 
      ? record.options
      : { A: '', B: '', C: '', D: '' },
    answer: record.answer,
    analysis: record.analysis
  }
  modalVisible.value = true
}

// 处理删除
const handleDelete = async (record) => {
  try {
    const res = await axios.delete(`/api/questions/${record.id}`)
    if (res.data.success) {
      message.success('删除成功')
      await fetchQuestions()
    }
  } catch (error) {
    message.error('删除失败')
  }
}

// 添加选项
const addOption = () => {
  const keys = Object.keys(formData.value.options);
  if (keys.length >= 26) return; // 最多26个选项(A-Z)
  const nextKey = String.fromCharCode(65 + keys.length);
  formData.value.options[nextKey] = '';
};

// 移除选项
const removeOption = (key) => {
  const options = { ...formData.value.options };
  delete options[key];
  // 重新排序选项
  const newOptions = {};
  Object.values(options).forEach((value, index) => {
    newOptions[String.fromCharCode(65 + index)] = value;
  });
  formData.value.options = newOptions;
};

// 处理多选题答案变化
const handleMultipleAnswerChange = (checked, key) => {
  let answers = formData.value.answer ? formData.value.answer.split(',') : [];
  if (checked) {
    answers.push(key);
  } else {
    answers = answers.filter(a => a !== key);
  }
  formData.value.answer = answers.sort().join(',');
};

// 处理对话框确认
const handleModalOk = async () => {
  try {
    if (!formData.value.content) {
      message.error('请输入题目内容')
      return
    }

    if (['single', 'multiple'].includes(formData.value.type)) {
      const options = formData.value.options;
      if (Object.values(options).some(opt => !opt)) {
        message.error('请填写完整的选项')
        return
      }
      if (Object.keys(options).length < 2) {
        message.error('至少需要两个选项')
        return
      }
    }

    if (!formData.value.answer) {
      message.error('请输入答案')
      return
    }

    // 验证答案格式
    if (formData.value.type === 'single') {
      if (!Object.keys(formData.value.options).includes(formData.value.answer)) {
        message.error('答案必须是选项中的一个')
        return
      }
    } else if (formData.value.type === 'multiple') {
      const answers = formData.value.answer.split(',');
      const validAnswers = answers.every(ans => Object.keys(formData.value.options).includes(ans));
      if (!validAnswers) {
        message.error('答案必须是选项中的组合');
        return;
      }
    } else if (formData.value.type === 'judge') {
      if (!['true', 'false'].includes(formData.value.answer)) {
        message.error('判断题答案必须是true或false');
        return;
      }
    }

    const data = {
      ...formData.value,
      bankId: route.params.id,
      options: formData.value.options
    }

    let res
    if (formData.value.id) {
      res = await axios.put(`/api/questions/${formData.value.id}`, data)
    } else {
      res = await axios.post('/api/questions', data)
    }

    if (res.data.success) {
      message.success(formData.value.id ? '更新成功' : '创建成功')
      modalVisible.value = false
      await fetchQuestions()
    }
  } catch (error) {
    message.error(formData.value.id ? '更新失败' : '创建失败')
  }
}

// 处理对话框取消
const handleModalCancel = () => {
  modalVisible.value = false
}

const getPreviewPanelHeader = (question, index) => {
  const typeText = getTypeText(question.type);
  const contentPreview = question.content.length > 30 
    ? question.content.substring(0, 30) + '...' 
    : question.content;
  return `${index + 1}. ${typeText} - ${contentPreview}`;
};

const getAnswerTagColor = (question) => {
  const colors = {
    single: 'blue',
    multiple: 'green',
    judge: 'orange',
    essay: 'purple'
  }
  return colors[question.type]
}

const formatAnswer = (question) => {
  if (question.type === 'single') {
    return `${question.answer}. ${question.options[question.answer]}`;
  } else if (question.type === 'multiple') {
    return question.answer.split(',').map(key => `${key}. ${question.options[key]}`).join('、');
  } else if (question.type === 'judge') {
    return question.answer ? '正确' : '错误';
  } else if (question.type === 'essay') {
    return question.answer;
  }
  return '';
};

const formatAnswerPreview = (question) => {
  if (question.type === 'single') {
    return question.answer;
  } else if (question.type === 'multiple') {
    return question.answer;
  } else if (question.type === 'judge') {
    return question.answer ? '正确' : '错误';
  } else {
    return '查看详情';
  }
};

const isCorrectOption = (question, key) => {
  if (question.type === 'single') {
    return question.answer === key;
  } else if (question.type === 'multiple') {
    return question.answer.split(',').includes(key);
  }
  return false;
};

onMounted(() => {
  fetchQuestionBank()
  fetchQuestions()
})
</script>

<style scoped>
.modal-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.input-section {
  background-color: #fafafa;
  border-radius: 4px;
}

.format-guide {
  padding: 8px;
}

.format-item {
  margin-bottom: 8px;
}

.format-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.format-content {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
}

.questions-container {
  background: #fff;
  border-radius: 4px;
  padding: 24px;
  min-height: calc(100vh - 180px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #1f1f1f;
}

:deep(.ant-table) {
  background: #fff;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}

:deep(.ant-btn-link) {
  padding: 4px 8px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.ant-tag) {
  min-width: 60px;
  text-align: center;
}

:deep(.ant-input-group) {
  display: flex;
  align-items: center;
}

:deep(.ant-input-group .ant-input) {
  border-radius: 2px 0 0 2px;
}

:deep(.ant-input-group .ant-btn) {
  border-radius: 0 2px 2px 0;
}

:deep(.ant-form-item-required::before) {
  display: inline-block;
  margin-right: 4px;
  color: #ff4d4f;
  font-size: 14px;
  font-family: SimSun, sans-serif;
  line-height: 1;
  content: '*';
}

.option-item {
  margin-bottom: 8px;
}

.option-item .ant-input-group {
  display: flex;
  align-items: center;
}

.option-prefix {
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-right: none;
  border-radius: 2px 0 0 2px;
}

:deep(.ant-radio-wrapper), :deep(.ant-checkbox-wrapper) {
  margin-right: 0;
}

:deep(.ant-input-group) .ant-input {
  border-radius: 0;
}

:deep(.ant-input-group) .ant-btn {
  border-radius: 0 2px 2px 0;
}

.question-preview-detail {
  padding: 8px;
}

.preview-item {
  margin-bottom: 12px;
}

.preview-item .label {
  font-weight: 500;
  color: #666;
  margin-right: 8px;
}

.preview-item .content {
  margin-top: 4px;
}

.options-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 8px;
  background: #fafafa;
  border-radius: 4px;
}

.option-key {
  font-weight: 500;
  margin-right: 8px;
  color: #1890ff;
}

.option-value {
  flex: 1;
}

.answer-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.answer-options .ant-tag {
  margin-right: 0;
  font-size: 14px;
}

.preview-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.preview-panel-index {
  font-weight: bold;
  color: #1890ff;
  min-width: 30px;
}

.preview-panel-type {
  min-width: 80px;
}

.preview-panel-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-panel-answer {
  margin-left: auto;
}

.option-correct {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
}

:deep(.ant-collapse-content) {
  background-color: #fafafa;
}

:deep(.ant-collapse-item) {
  margin-bottom: 8px;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.preview-panel-single .ant-collapse-header) {
  border-left: 4px solid #1890ff;
}

:deep(.preview-panel-multiple .ant-collapse-header) {
  border-left: 4px solid #52c41a;
}

:deep(.preview-panel-judge .ant-collapse-header) {
  border-left: 4px solid #fa8c16;
}

:deep(.preview-panel-essay .ant-collapse-header) {
  border-left: 4px solid #722ed1;
}

.preview-content {
  padding: 16px;
}

:deep(.ant-modal-body) {
  padding: 0;
}
</style> 
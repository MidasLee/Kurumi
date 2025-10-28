# Kurumi

<div align=center>
    <img src="./src/images/avatars/kurumi.png" width=16%>
</div>

> Hi！我是Kurumi，一个轻量级、可嵌入的聊天助手组件，使用 webpack 方式打包，旨在将所有 JS 脚本、CSS 样式表、插件和静态文件等全部打包到一个 JS 文件中，方便在现存的B/S架构项目中直接引入使用。

<div align=center>
    <a href="./readme.md">中文文档</a> | <a href="./readme-en.md">英文文档</a>
</div>

## 功能特点

- 📱 **轻量级组件**：单一 JS 文件引入，快速集成到任何网页
- 🎨 **主题支持**：内置明亮模式和暗黑模式，可自由切换
- 💬 **多模态交互**：支持文本和图片输入，实现更丰富的对话体验
- 📝 **Markdown 支持**：自动渲染 Markdown 格式的消息内容
- 🔄 **会话管理**：支持创建、保存和切换多个会话
- 🔧 **自定义应用**：可配置多个预设应用/助手，每个应用有独立的提示词和功能定位
- 🎯 **模型切换**：支持在多个 AI 模型之间切换
- 💾 **本地存储**：使用 IndexDB 保存聊天记录，确保数据持久化

## 项目优势

### 纯前端架构，无缝集成
- **零后端依赖**：采用纯前端架构设计，通过单一 JavaScript 文件即可完成部署
- **跨系统集成**：能够轻松嵌入任何 B/S 模式系统，为现有项目快速赋能 AI 能力
- **独立运行**：只需引入打包后的 JS 文件即可独立运行，无需额外配置或后端服务
- **即插即用**：支持在新旧系统中快速集成，大幅降低开发和部署成本

### 基础技术栈，极致兼容
- **轻量级实现**：基于原生 JavaScript 和 jQuery 构建，避免引入重型框架
- **广泛兼容性**：不依赖特定前端框架（如 Vue、React），几乎兼容所有 B/S 系统
- **低侵入性**：通过 CSS 命名空间隔离，最小化对宿主系统的影响
- **高效加载**：优化的资源打包策略，确保在各类环境中的快速加载和响应

### 模块化设计，易于扩展
- **清晰的代码结构**：采用模块化架构，核心功能拆分为独立模块（util.js、config.js、api.js 等）
- **统一入口管理**：通过 index.js 作为统一入口，便于维护和管理
- **开发友好**：仿现代前端框架的开发模式，降低二次开发的学习门槛
- **灵活扩展**：支持自定义模型配置、应用配置和界面定制，满足不同场景需求

## 环境要求
nodejs>=20
npm>=10

## 技术栈

- **前端框架**：原生 JavaScript + jQuery
- **样式处理**：原生 CSS + Bootstrap Icons + Font Awesome
- **打包工具**：Webpack 5
- **代码转译**：Babel
- **UI 组件**：Layer 弹窗、SimpleMDE 编辑器
- **数据存储**：IndexDB
- **AI 接口**：支持 VLLM、Ollama、OpenAI 等兼容 OpenAI API 格式的大模型服务

## 快速开始

* 拉取代码：

```shell
git clone https://github.com/Midas/kurumi.git
```

* 初始化：

```shell
npm run init
```

* 打包：

``` shell
npm run build
```

打包后文件在dist目录下：./dist/kurumi-chat.js，已在项目根目录下创建了一个示例HTML文件（index.html），可以使用nginx发布该页面或直接在浏览器中打开该文件查看组件效果。

注：index.html页面只做测试使用，需在index.html页面中配置实际的AI模型接口地址、应用配置等参数，才可测试完整功能。

## 安装与使用

### 引入方式

1. **直接引入打包后的文件**

```html
<!-- 在 HTML 页面底部引入 -->
<script src="path/to/kurumi-chat.js"></script>
<script>
    // 初始化 KurumiChat
    const kurumiChat = new KurumiChat({
        theme: 'light', // 可选: 'light' 或 'dark'
        title: 'Kurumi',
        userId: 'Midas888',
        userName: 'Midas',
        currentModel: customModels,
        currentApp: customApps
    });
    
    // 初始化聊天组件
    kurumiChat.chat.init();

    // APP配置示例
    const customApps = [
            {
                id: "0b14a19f-d5c6-4ae9-aa9f-c57a2b5fac59",
                index: 0,
                name: "编程知识问答助手",
                description: "一个专业的编程知识问答助手，能够回答编程相关的问题。",
                prompt: "你是一个专业的编程知识问答助手，能够回答编程相关的问题。请根据用户的提问回答问题。",
                // 注：图标URL来自Flaticon，版权归Flaticon所有，此处只做测试使用
                img: "https://cdn-icons-png.flaticon.com/128/6601/6601223.png"
            },
            {
                id: "b5db9320-17f4-4a55-bcae-53e73f26d395",
                index: 1,
                name: "歌曲作词专家",
                description: "一个专业的歌曲作词专家，能够创作符合用户需求的歌曲作词。",
                prompt: "你是一个专业的歌曲作词专家，能够创作符合用户需求的歌曲作词。请根据用户的需求创作歌曲作词。",
                // 注：图标base64来自iconfont，版权归iconfont所有，此处只做测试使用
                img: "data:image/png;base64,iVBORw0KGgoAAAANS......"
            },
            {
                id: "a6bde728-7f69-b16c-79da-4ff05c1f14b2",
                index: 2,
                name: "图像识别专家",
                description: "一个专业的图像识别专家，能够识别用户上传的图像并根据用户对图像内容的提问返回识别结果。",
                prompt: "你是一个专业的图像识别专家，能够识别用户上传的图像并根据用户对图像内容的提问返回识别结果。请根据用户上传的图像进行识别。",
                // 注：图标base64来自iconfont，版权归iconfont所有，此处只做测试使用
                img: "https://cdn-icons-png.flaticon.com/128/6384/6384343.png"
            },
            //...
        ];

        // 模型配置示例（可根据实际部署的VLLM、Ollama和OpenAI模型修改）
        const customModels = [
            {
                id: "a8c8a08a922f11f0923e0242ac190006", // VLLM接口
                serverUrl: "http://10.26.24.28:8000",
                modelName: "Qwen3-8B",
                apiPath: "/v1/chat/completions", // VLLM标准API路径
                apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
            },
            {
                id: "b94451f2922f11f0aaee0242ac190006", // VLLM接口
                serverUrl: "http://10.26.24.28:8001",
                modelName: "Qwen2.5-7B-Instruct",
                apiPath: "/v1/chat/completions",
                apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
            },
            {
                id: "769d7160-3048-45a4-a1cb-aa3d3f03f9cb", // Ollama接口
                serverUrl: "http://10.26.24.27:11434",
                modelName: "qwen2.5:0.5b",
                apiPath: "/v1/chat/completions",
                apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
            },
            {
                id: "8910efc2-4ed9-e808-7214-975cf122b625", // Ollama多模态大模型接口
                serverUrl: "http://10.26.24.27:11434",
                modelName: "minicpm-v:8b",
                apiPath: "/v1/chat/completions",
                apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
            },
        ];
</script>
```

## 配置说明

### 初始化配置项

```javascript
const options = {
    theme: 'light', // 主题模式，可选 'light' 或 'dark'
    title: 'Kurumi 助手', // 聊天窗口标题
    userId: 'default_user', // 用户ID，用于会话存储
    userName: '用户', // 用户名
    allModels: [], // 可选模型列表
    currentModel: {}, // 当前使用的模型
    customApps: [], // 自定义应用列表
    currentApp: {} // 当前使用的应用
};
```

### 模型配置示例

```javascript
const demoModel = {
    id: 'model-id',
    serverUrl: 'http://api.example.com', // 模型服务地址
    modelName: 'model-name', // 模型名称
    apiPath: '/v1/chat/completions', // API路径
    apiKey: 'your-api-key' // API密钥（可选）
};
```

### 应用配置示例

```javascript
const demoApp = {
    id: 'app-id',
    name: '编程助手', // 应用名称
    description: '专业的编程知识问答助手', // 应用描述
    prompt: '你是一个专业的编程知识问答助手...', // 系统提示词
    img: 'https://example.com/icon.png' // 应用图标，支持图片链接和Base64编码
};
```

## 开发指南

### 项目结构

```
kurumi/
├── src/
│   ├── css/            # 样式文件
│   ├── images/         # 图片资源
│   ├── libs/           # 第三方库
│   ├── models/         # 核心模型
│   │   ├── api.js      # API接口封装
│   │   ├── config.js   # 配置文件
│   │   └── util.js     # 工具函数
│   └── index.js        # 主入口文件
├── index.html          # 示例页面
├── package.json        # 项目依赖
├── webpack.config.js   # Webpack配置
└── readme.md           # 项目说明
```

### 核心功能模块

1. **聊天核心逻辑**
   - 会话管理（创建、加载、保存）
   - 消息处理（发送、接收、编辑）
   - 图片处理（上传、预览、Base64转换）

2. **UI交互**
   - 弹窗管理（Layer）
   - 编辑器集成（SimpleMDE）
   - 主题切换

3. **数据存储**
   - IndexDB会话存储
   - 本地缓存管理

4. **API通信**
   - 流式消息接收
   - 多模态支持
   - 错误处理

## 插件依赖说明

### 通过npm安装的依赖

| 依赖名称 | 版本 | 用途 |
|---------|------|------|
| bootstrap-icons | ^1.13.1 | 提供矢量图标 |
| font-awesome | ^4.7.0 | 提供图标字体 |
| simplemde | ^1.11.2 | Markdown编辑器 |

### 通过webpack配置引入的本地依赖

| 依赖名称 | 版本 | 文件位置 | 用途 |
|---------|------|---------|------|
| jQuery | 3.7.1 | src/libs/jquery-3.7.1.min.js | DOM操作和事件处理 |
| marked | 0.3.19 | src/libs/marked-0.3.19.min.js | Markdown解析 |
| layer | - | src/libs/layer/layer.js | 弹窗组件 |

### 开发依赖

| 依赖名称 | 版本 | 用途 |
|---------|------|------|
| webpack | ^5.100.2 | 模块打包工具 |
| webpack-cli | ^6.0.1 | Webpack命令行工具 |
| @babel/core | ^7.28.0 | JavaScript编译器 |
| @babel/preset-env | ^7.28.0 | Babel预设配置 |
| babel-loader | ^10.0.0 | Webpack的Babel加载器 |
| css-loader | ^7.1.2 | 处理CSS文件 |
| style-loader | ^4.0.0 | 将CSS注入DOM |
| imports-loader | ^5.0.0 | 修改模块导出 |

## 组件二次开发

为了提高项目的集成友好性和用户体验，本项目对第三方组件进行了以下关键修改：

### 样式隔离与命名空间
- 对Layer弹窗组件的所有CSS类名进行了前缀处理，添加了`kurumi-chat-`前缀
- 有效避免与宿主系统的CSS样式产生冲突和混淆
- 确保在任何系统中引入时都能保持样式一致性

### 本地化与界面优化
- 对SimpleMDE编辑器进行了全面汉化，包括界面元素、按钮文本和提示信息
- 优化了中文语境下的排版和显示效果
- 提升了中文用户的使用体验

### 主题支持增强
- 对组件CSS进行了深度修改，原生支持明暗两种主题模式
- 为所有UI元素（包括Layer弹窗和SimpleMDE编辑器）添加了主题切换能力
- 使用CSS变量实现主题颜色的统一管理和动态切换

### 插件适配与定制
- 根据项目需求定制了Layer弹窗的交互行为和动画效果
- 对SimpleMDE编辑器进行了样式和功能调整，使其与整体UI风格一致
- 保留了原插件的核心功能，同时优化了集成体验

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 依赖库授权协议

| 依赖库 | 版本 | 授权协议 | 备注 |
|-------|------|---------|------|
| jQuery | - | MIT License | 前端JavaScript库，用于DOM操作和事件处理 |
| Bootstrap Icons | - | MIT License | 图标库，提供界面所需图标 |
| Font Awesome | 4.7.0 | SIL OFL 1.1 | 字体图标库，遵循SIL开放字体协议 |
| SimpleMDE | - | MIT License | Markdown编辑器 |
| marked.js | - | MIT License | Markdown解析库 |
| layer.js | - | MIT License | 弹窗组件库 |

## 本项目授权协议
本项目采用 <a href="./LICENSE">MIT 许可证</a>。

### MIT许可证的优势
1. **高度自由**：允许任何人自由地使用、复制、修改、合并、发布、分发、转授权及销售软件副本
2. **商业友好**：无限制地支持商业用途，非常适合用于商业项目
3. **简洁明确**：协议文本简短易懂，降低了合规风险
4. **促进传播**：宽松的条款有助于项目的广泛传播和采用
5. **保留归属**：仅要求保留原作者的版权声明和许可声明，维护了作者的基本权益

## 注意事项

1. **API密钥安全**：生产环境中请勿将真实API密钥硬编码在前端代码中
2. **图片大小限制**：默认限制上传图片大小为10MB
3. **浏览器支持**：需要浏览器支持现代JavaScript特性和IndexDB
4. **CORS配置**：如果AI服务部署在不同域，需要正确配置CORS策略
5. **使用第三方库时**，请确保遵守各自的授权协议要求

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本聊天功能
- 实现多模态交互
- 支持主题切换和会话管理

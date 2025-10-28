/**
 * 通用配置文件
 * 可根据实际部署修改VLLM地址、主题等
 */
export const config = {
    // 默认主题（light/dark）
    defaultTheme: "light",
    // 消息提示时长（毫秒）
    messageDuration: 3000,
    // IndexDB数据库配置
    dbConfig: {
        name: "KurumiChatHistoryDB",
        version: 1,
        storeName: "kurumiChatSessions"
    },
    // 默认模型配置（可在前端切换）
    defaultModels: [
        {
            id: "a8c8a08a922f11f0923e0242ac190006",
            serverUrl: "http://10.26.24.28:8000",
            modelName: "Qwen3-8B",
            apiPath: "/v1/chat/completions", // VLLM标准API路径
            apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
        },
        {
            id: "b94451f2922f11f0aaee0242ac190006",
            serverUrl: "http://10.26.24.28:8001",
            modelName: "Qwen2.5-7B-Instruct",
            apiPath: "/v1/chat/completions",
            apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
        },
        {
            id: "769d7160-3048-45a4-a1cb-aa3d3f03f9cb",
            serverUrl: "http://10.26.24.27:11434",
            modelName: "qwen2.5:0.5b",
            apiPath: "/v1/chat/completions",
            apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
        },
        {
            id: "8910efc2-4ed9-e808-7214-975cf122b625",
            serverUrl: "http://10.26.24.27:11434",
            modelName: "minicpm-v:8b",
            apiPath: "/v1/chat/completions",
            apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
        },
        //...
    ],
    // 默认应用配置
    defaultApps: [
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
            img: "data:image/png;base64,iVBORw..."
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
    ]
};
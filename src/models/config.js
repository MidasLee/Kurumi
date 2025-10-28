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
            apiPath: "/v1/chat/completions",
            apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
        },
        {
            id: "b94451f2922f11f0aaee0242ac190006",
            serverUrl: "http://10.26.24.28:8001",
            modelName: "Qwen2.5-7B-Instruct",
            apiPath: "/v1/chat/completions",
            apiKey: "sk-1234567890abcdef1234567890abcdef", // 替换为实际的API密钥
        }
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
            img: "data:image/png;base64,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"
        }
    ]
};
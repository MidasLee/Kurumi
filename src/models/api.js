import { config } from './config.js';
import { util } from './util.js';

/**
 * 通用API模块
 * 包含：1.VLLM接口调用 2.IndexDB聊天记录存储
 */
export const api = {
    // ------------------------------
    // 1. VLLM API调用（流式+非流式）
    // ------------------------------
    /**
     * 流式请求大模型回答（核心方法）
     * @param {Object} params - 请求参数
     * @param {string} params.model - 模型标识符（与modelName功能相同，保留为向后兼容）
     * @param {string} params.modelName - 模型名称（实际使用的参数）
     * @param {string} params.serverUrl - 服务器地址（包含协议，如https://）
     * @param {string} params.apiPath - API路径（如/v1/chat/completions）
     * @param {string} [params.apiKey] - API密钥（可选，用于OpenAI接口）
     * @param {Array} params.messages - 对话历史（包含role和content字段的对象数组）
     * @param {Function} onMessage - 流式消息回调（接收解析后的HTML内容）
     * @param {Function} onComplete - 完成回调（接收最终HTML和原始文本）
     * @param {Function} onError - 错误回调（接收错误消息）
     */
    streamChat: async (params, onMessage, onComplete, onError) => {
        try {
            const requestUrl = `${params.serverUrl}${params.apiPath}`;
            
            // 构建请求头
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // 如果提供了apiKey，添加Authorization头
            // 既支持需要apiKey的OpenAI接口，又能兼容不需要apiKey的VLLM或Ollama接口
            if (params.apiKey) {
                headers['Authorization'] = `Bearer ${params.apiKey}`;
            }
            
            // 准备请求参数
            const requestParams = {
                model: params.modelName || params.model,
                messages: params.messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 2048
            };
            
            // 特殊处理包含图片的消息（multimodal格式）
            // 检查消息中是否包含base64图片
            const hasImages = params.messages.some(msg => 
                msg.content && (typeof msg.content === 'object' || msg.content.includes('data:image/'))
            );
            
            // 如果包含图片，调整为支持multimodal的格式
            if (hasImages) {
                // 转换消息格式以支持图片
                requestParams.messages = params.messages.map(msg => {
                    if (msg.content && typeof msg.content === 'string' && msg.content.includes('data:image/')) {
                        // 将包含base64图片的文本消息转换为multimodal格式
                        return {
                            ...msg,
                            content: [
                                {
                                    type: 'text',
                                    text: msg.content.split('data:image/')[0] || '请分析以下图片：'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: msg.content.match(/data:image\/[^\s]+/)[0]
                                    }
                                }
                            ]
                        };
                    }
                    return msg;
                });
            }
            
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestParams)
            });

            if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
            if (!response.body) throw new Error("不支持流式响应");

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // 完成时，传递最终解析后的HTML
                    const finalHtml = marked.parse(fullText);
                    onComplete(finalHtml, fullText);
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            if (content) {
                                fullText += content;
                                const parsedHtml = marked.parse(fullText);
                                onMessage(parsedHtml);
                            }
                        } catch (e) {
                            console.error('解析流式数据失败:', e);
                        }
                    }
                }
            }
        } catch (error) {
            onError(error.message);
        }
    },

    // ------------------------------
    // 2. IndexDB聊天记录存储
    // ------------------------------
    /**
     * 打开IndexDB数据库
     * @returns {Promise<IDBDatabase>} 数据库实例
     */
    openDB: () => {
        return new Promise((resolve, reject) => {
            // 使用版本2以支持appId索引
            const request = indexedDB.open(config.dbConfig.name, 2);

            // 数据库升级/创建
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建或获取会话存储表
                let store;
                if (!db.objectStoreNames.contains(config.dbConfig.storeName)) {
                    // 新建存储表时直接创建两个索引
                    store = db.createObjectStore(config.dbConfig.storeName, { keyPath: 'id' });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('appId', 'appId', { unique: false });
                } else {
                    // 升级现有表时添加appId索引（如果版本从1升级到2）
                    if (event.oldVersion < 2) {
                        const transaction = event.target.transaction;
                        store = transaction.objectStore(config.dbConfig.storeName);
                        // 检查索引是否已存在
                        if (!store.indexNames.contains('appId')) {
                            store.createIndex('appId', 'appId', { unique: false });
                        }
                    }
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`IndexDB打开失败: ${event.target.error}`);
        });
    },

    /**
     * 保存会话到IndexDB
     * @param {Object} session - 会话数据
     * @returns {Promise<void>}
     */
    saveSession: async (session) => {
        const db = await api.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(config.dbConfig.storeName, 'readwrite');
            const store = transaction.objectStore(config.dbConfig.storeName);

            // 补充默认字段
            const sessionData = {
                id: session.id || util.generateUUID(), // 会话ID
                userId: session.userId || 'default_user', // 默认用户ID
                appId: session.appId || null, // 应用ID，用于区分不同app的会话
                title: session.title || '新会话', // 会话标题（首条消息生成）
                messages: session.messages || [], // 聊天消息
                model: session.model || config.defaultModels[0].modelName, // 使用的模型
                createdAt: session.createdAt || new Date().toISOString(), // 创建时间
                updatedAt: session.updatedAt || new Date().toISOString() // 更新时间
            };

            const request = store.put(sessionData); // 新增/更新

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(`保存会话失败: ${e.target.error}`);
            transaction.oncomplete = () => db.close();
        });
    },

    /**
     * 获取用户所有会话
     * @param {string} userId - 用户ID（默认：default_user）
     * @returns {Promise<Array>} 会话列表
     */
    getSessionsByUser: async (userId = 'default_user') => {
        const db = await api.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(config.dbConfig.storeName, 'readonly');
            const store = transaction.objectStore(config.dbConfig.storeName);
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = (e) => {
                // 按更新时间倒序排列
                const sortedSessions = e.target.result.sort((a, b) =>
                    new Date(b.updatedAt) - new Date(a.updatedAt)
                );
                resolve(sortedSessions);
            };
            request.onerror = (e) => reject(`获取会话失败: ${e.target.error}`);
            transaction.oncomplete = () => db.close();
        });
    },

    /**
     * 删除会话
     * @param {string} sessionId - 会话ID
     * @returns {Promise<void>}
     */
    deleteSession: async (sessionId) => {
        const db = await api.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(config.dbConfig.storeName, 'readwrite');
            const store = transaction.objectStore(config.dbConfig.storeName);
            const request = store.delete(sessionId);

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(`删除会话失败: ${e.target.error}`);
            transaction.oncomplete = () => db.close();
        });
    }
};
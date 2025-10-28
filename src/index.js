import 'layer-theme/default/layer.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import kurumiAvatar from '@avatars/kurumi.png';
import { api } from './models/api.js';
import { config } from './models/config.js';
import { util } from './models/util.js';
import 'font-awesome/css/font-awesome.min.css';
import SimpleMDE from 'simplemde/dist/simplemde.min.js';

class KurumiChat {
    constructor(options = {}) {
        // 合并默认配置与用户配置
        const defaults = {
            theme: config.defaultTheme,
            title: config.defaultApps[0].name,
            description: config.defaultApps[0].description,
            userId: 'default_user', // 默认用户ID
            userName: '用户',
            allModels: config.defaultModels,
            currentModel: config.defaultModels[0],
            customApps: config.defaultApps,
            currentApp: config.defaultApps[0],
        };
        this.options = { ...defaults, ...options };

        // 状态管理
        this.state = {
            layerObject: null, // 弹窗实例
            historySessions: [], // 历史会话
            currentSession: null, // 当前会话
            isLoading: false, // 是否加载中
            currentMessageId: '', // 当前生成的消息ID
            showAppMenu: false, // 是否显示app选择菜单
            currentApp: this.options.currentApp // 当前选中的app
        };

        // 初始化样式
        util.injectStyles(this.options.theme);
    }

    // ------------------------------
    // 聊天核心逻辑
    // ------------------------------
    chat = {
        /**
         * 初始化入口
         */
        init: async () => {
            try {
                // 加载历史会话
                await this.chat.loadHistorySessions();
                // 挂载助手按钮
                this.chat.mountAssistantButton();
                // 绑定按钮事件
                document.getElementById('kurumi-chat-open-modal-btn')
                    .addEventListener('click', this.chat.showLayerWindow);
            } catch (error) {
                util.showToast(`初始化失败: ${error.message}`, 'error');
            }
        },
        /**
         * 加载历史会话
         */
        loadHistorySessions: async () => {
            try {
                this.state.historySessions = await api.getSessionsByUser(this.options.userId);

                // 如果有选中的app，优先加载该app的会话
                if (this.state.currentApp && this.state.historySessions.length > 0) {
                    const appSessions = this.state.historySessions.filter(
                        session => session.appId === this.state.currentApp.id
                    );
                    if (appSessions.length > 0) {
                        // 按更新时间排序，取最新的会话
                        appSessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                        this.state.currentSession = appSessions[0];
                    } else {
                        // 没有该app的会话，创建新会话
                        this.chat.createNewSession();
                    }
                } else if (this.state.historySessions.length > 0) {
                    // 没有选中的app，默认选中最新的会话
                    this.state.historySessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    this.state.currentSession = this.state.historySessions[0];
                } else {
                    // 无历史会话，创建新会话
                    this.chat.createNewSession();
                }
            } catch (error) {
                util.showToast(`加载会话失败: ${error.message}`, 'error');
                // 失败时创建临时会话
                this.chat.createNewSession();
            }
        },
        /**
         * 创建新会话
         */
        createNewSession: () => {
            // 为每个app创建独立的会话，通过添加appId进行区分
            this.state.currentSession = {
                id: util.generateUUID(),
                userId: this.options.userId,
                appId: this.state.currentApp ? this.state.currentApp.id : null,
                title: this.state.currentApp ? `${this.state.currentApp.name} - 新会话` : '新会话',
                messages: [],
                model: this.options.currentModel.modelName,
                createdAt: util.getCurrentTime(),
                updatedAt: util.getCurrentTime()
            };
            // 如果有选中的app，添加prompt作为system消息
            if (this.state.currentApp && this.state.currentApp.prompt) {
                this.state.currentSession.messages.push({
                    role: 'system',
                    content: this.state.currentApp.prompt,
                    time: util.getCurrentTime()
                });
            }
            // 添加到历史会话列表
            this.state.historySessions.unshift(this.state.currentSession);
        },
        /**
         * 挂载助手按钮（页面右下角）
         */
        mountAssistantButton: () => {
            // 避免重复创建
            if (document.getElementById('kurumi-chat-open-modal-btn')) return;

            const button = document.createElement('button');
            button.className = 'kurumi-chat-fixed-button';
            button.id = 'kurumi-chat-open-modal-btn';
            button.title = '打开Kurumi';

            const icon = document.createElement('img');
            icon.src = kurumiAvatar;
            icon.alt = '对话助手';
            icon.className = 'kurumi-chat-button-icon';

            button.appendChild(icon);
            document.body.appendChild(button);
        },
        /**
         * 显示对话弹窗
         */
        showLayerWindow: () => {
            // 避免重复打开
            if (this.state.layerObject) return;

            // 创建弹窗（使用layer）
            this.state.layerObject = layer.open({
                type: 1,
                title: this.options.title,
                // offset: 'rt', // 右上位置（不设置则默认居中）
                area: ['1200px', '600px'], // 宽高（可自行设置）
                maxmin: true,
                shade: 0.1,
                success: (layero) => {
                    // 初始化弹窗内组件
                    this.chat.initLayerComponents(layero);
                    // 加载当前会话内容
                    this.chat.renderCurrentSession(true);
                },
                // 弹窗缩放时触发，更新内容区尺寸
                resizing: (layero) => {
                    this.chat.resizingLayerContent(layero);
                },
                full: (layero) => {
                    this.chat.resizingLayerContent(layero);
                },
                restore: (layero) => {
                    this.chat.resizingLayerContent(layero);
                },
                end: () => {
                    // 弹窗关闭时重置状态
                    this.state.layerObject = null;
                },
                content: this.chat.getLayerContent()
            });
        },
        /**
         * 处理消息内容（包括消息中的图片）
         * @param {string} content - 原始消息内容
         * @returns {string} - 处理后的消息内容
         */
        processMessageContent: (content) => {
            if (!content) return '';

            // 匹配base64图片数据URL
            const base64ImageRegex = /data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g;

            // 检查是否包含base64图片
            if (base64ImageRegex.test(content)) {
                // 重置正则表达式的lastIndex，因为上一次test可能改变了它
                base64ImageRegex.lastIndex = 0;

                // 处理内容，确保文字和图片分别在单独的段落中
                let processedContent = content.replace(base64ImageRegex, (match) => {
                    return `\n\n![](${match})\n\n`;
                });

                return processedContent;
            } else {
                // 如果不包含base64图片，返回原内容
                return content;
            }
        },
        /**
         * 调整弹窗内容区尺寸
         * @param {*} layero - 弹窗对象
         */
        resizingLayerContent: (layero) => {
            const $layero = layero;
            const $content = $layero.find('.kurumi-chat-layui-layer-content');
            const $chatContainer = $content.find('.kurumi-chat-container');

            // 计算弹窗内容区的实际宽高（减去标题栏高度）
            const contentHeight = $layero.height() - $layero.find('.kurumi-chat-layui-layer-title').height();
            const contentWidth = $layero.width();

            $content.css({
                height: contentHeight + 'px'
            });

            // 强制设置内容区尺寸
            $chatContainer.css({
                width: contentWidth + 'px',
                height: contentHeight + 'px'
            });

            // 触发聊天内容区滚动条重绘（避免缩放后滚动条异常）
            const $chatContent = $chatContainer.find('#kurumi-chat-content');
            $chatContent.scrollTop($chatContent[0].scrollHeight);
        },
        /**
         * 获取弹窗内容HTML
         * @returns {string} HTML字符串
         */
        getLayerContent: () => {
            return `
                <div class="kurumi-chat-container">
                    <!-- 左侧菜单 -->
                    <div class="kurumi-chat-left-sidebar">
                        <button class="kurumi-chat-new-session-btn" id="kurumi-chat-new-session-btn">
                        <i class="bi bi-plus-circle"></i> 新会话
                        </button>
                        <div class="kurumi-chat-sessions-list" id="kurumi-chat-sessions-list">
                        <!-- 会话列表将动态渲染 -->
                        </div>
                        <div class="kurumi-chat-sidebar-footer">
                        <button class="kurumi-chat-app-switch" id="kurumi-chat-app-switch">
                            <i class="bi bi-grid"></i>
                        </button>
                        <button class="kurumi-chat-theme-switch" id="kurumi-chat-theme-switch">
                            <i class="bi bi-${this.options.theme === 'light' ? 'moon' : 'sun'}"></i>
                        </button>
                        
                        <!-- App选择菜单 -->
                        <div class="kurumi-chat-app-menu" id="kurumi-chat-app-menu" style="display: none;">
                            <div class="kurumi-chat-app-menu-header">
                                <h4>选择应用</h4>
                                <button class="kurumi-chat-app-menu-close">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                            <div class="kurumi-chat-app-menu-list">
                                ${this.options.customApps.map(app => `
                                    <div class="kurumi-chat-app-item ${this.state.currentApp?.id === app.id ? 'active' : ''}" data-app-id="${app.id}">
                                        <img src="${app.img}" alt="${app.name}">
                                        <div class="kurumi-chat-app-info">
                                            <div class="kurumi-chat-app-name">${app.name}</div>
                                            <div class="kurumi-chat-app-description">${app.description}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右侧聊天区域 -->
                <div class="kurumi-chat-main">
                    <!-- 聊天内容区 -->
                    <div class="kurumi-chat-content" id="kurumi-chat-content">
                    <!-- 空状态 -->
                    <div class="kurumi-chat-empty-state" id="kurumi-chat-empty-state">
                        <img src="${this.state.currentApp.img}" alt="${this.state.currentApp.name}">
                        <p>${this.state.currentApp ? this.state.currentApp.description : config.defaultApp.description}</p>
                    </div>
                    <!-- 聊天消息将动态渲染 -->
                    </div>

                    <!-- 图片预览区域 -->
                    <div class="kurumi-chat-image-preview-area" id="kurumi-chat-image-preview-area">
                        <!-- 图片预览将动态添加 -->
                    </div>

                    <!-- 底部输入区 -->
                    <div class="kurumi-chat-input-area">
                    <select class="kurumi-chat-model-select" id="kurumi-chat-model-select">
                        ${this.options.allModels.map(model =>
                `<option value="${model.id}" ${model.id === this.options.currentModel.id ? 'selected' : ''}>
                                    ${model.modelName}
                        </option>`
            ).join('')}
                    </select>
                    <div class="kurumi-chat-input-wrapper">
                        <input 
                            type="text" 
                            id="kurumi-chat-message-input" 
                            class="kurumi-chat-message-input" 
                            placeholder="${this.state.currentApp ? `请输入问题，${this.state.currentApp.name}将为您解答` : config.defaultApp.placeholder}"
                            autocomplete="off"
                        >
                        <button class="kurumi-chat-upload-btn" id="kurumi-chat-upload-btn">
                            <i class="bi bi-image"></i>
                        </button>
                        <input 
                            type="file" 
                            id="kurumi-chat-image-upload" 
                            class="kurumi-chat-image-upload" 
                            accept="image/*" 
                            style="display: none;"
                        >
                    </div>
                    <button class="kurumi-chat-send-btn" id="kurumi-chat-send-btn">
                        <i class="bi bi-send"></i>
                    </button>
                    </div>
                    
                    
                </div>
                </div>
            `;
        },
        /**
         * 初始化弹窗内组件
         * @param {jQuery} layero - layer弹窗元素
         */
        initLayerComponents: (layero) => {
            const $layero = layero;

            // 渲染会话列表
            this.chat.renderSessionsList();

            // 模型选择器事件
            $layero.find('#kurumi-chat-model-select').on('change', (e) => {
                const modelId = e.target.value;
                this.options.currentModel = this.options.allModels.find(m => m.id === modelId);
                util.showToast(`已切换模型: ${this.options.currentModel.modelName}`);
                // 更新当前会话的模型
                if (this.state.currentSession) {
                    this.state.currentSession.model = this.options.currentModel.modelName;
                    api.saveSession(this.state.currentSession).catch(err =>
                        util.showToast(`更新模型失败: ${err.message}`, 'error')
                    );
                }
            });

            // 发送消息事件（按钮+回车）
            const sendMessage = () => this.chat.sendUserMessage();
            $layero.find('#kurumi-chat-send-btn').on('click', sendMessage);
            $layero.find('#kurumi-chat-message-input').on('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // 新建会话事件
            $layero.find('#kurumi-chat-new-session-btn').on('click', () => {
                this.chat.createNewSession();
                this.chat.renderSessionsList();
                this.chat.renderCurrentSession();
                $layero.find('#kurumi-chat-message-input').focus();
            });

            // 主题切换事件
            $layero.find('#kurumi-chat-theme-switch').on('click', () => {
                this.options.theme = this.options.theme === 'light' ? 'dark' : 'light';
                util.injectStyles(this.options.theme);
                // 更新图标
                $layero.find('#kurumi-chat-theme-switch i')
                    .removeClass('bi-moon bi-sun')
                    .addClass(`bi-${this.options.theme === 'light' ? 'moon' : 'sun'}`);
                util.showToast(`已切换至${this.options.theme === 'light' ? '亮色' : '暗色'}主题`);
            });

            // App切换按钮事件
            $layero.find('#kurumi-chat-app-switch').on('click', () => {
                const $appMenu = $layero.find('#kurumi-chat-app-menu');
                this.state.showAppMenu = !this.state.showAppMenu;
                $appMenu.toggle(this.state.showAppMenu);
            });

            // 关闭App菜单
            $layero.find('.kurumi-chat-app-menu-close').on('click', () => {
                this.state.showAppMenu = false;
                $layero.find('#kurumi-chat-app-menu').hide();
            });

            // 图片上传按钮事件
            $layero.find('#kurumi-chat-upload-btn').on('click', () => {
                $layero.find('#kurumi-chat-image-upload').click();
            });

            // 图片文件选择事件
            $layero.find('#kurumi-chat-image-upload').on('change', async (e) => {
                await this.chat.handleImageUpload(e, $layero);
            });

            // App选择事件
            $layero.find('.kurumi-chat-app-item').on('click', (e) => {
                const appId = $(e.currentTarget).data('app-id');
                const selectedApp = this.options.customApps.find(app => app.id === appId);
                if (selectedApp) {

                    this.state.currentApp = selectedApp;
                    util.showToast(`已切换至${selectedApp.name}`);

                    // 更新空状态和占位符
                    $layero.find('#kurumi-chat-empty-state img').attr('src', selectedApp.img);
                    $layero.find('#kurumi-chat-empty-state img').attr('alt', selectedApp.name);
                    $layero.find('#kurumi-chat-empty-state p').text(selectedApp.description);
                    $layero.find('#kurumi-chat-message-input').attr('placeholder', `请输入问题，${selectedApp.name}将为您解答`);

                    layer.title(selectedApp.name, this.state.layerObject);

                    $layero.title = selectedApp.name;

                    // 查找当前app的历史会话
                    const appSessions = this.state.historySessions.filter(
                        session => session.appId === selectedApp.id
                    );

                    if (appSessions.length > 0) {
                        // 如果有该app的会话，加载最新的会话（最近更新的）
                        appSessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                        this.state.currentSession = appSessions[0];
                    } else {
                        // 如果没有该app的会话，创建新会话
                        this.chat.createNewSession();
                    }

                    this.chat.renderSessionsList();
                    this.chat.renderCurrentSession(true);

                    // 关闭app菜单
                    this.state.showAppMenu = false;
                    $layero.find('#kurumi-chat-app-menu').hide();

                    // 更新app选中状态
                    $layero.find('.kurumi-chat-app-item').removeClass('active');
                    $(e.currentTarget).addClass('active');
                }
            });
        },
        /**
         * 渲染会话列表
         */
        renderSessionsList: () => {
            const $list = $('#kurumi-chat-sessions-list');
            $list.empty();

            // 过滤当前app的会话
            const currentAppSessions = this.state.currentApp
                ? this.state.historySessions.filter(session => session.appId === this.state.currentApp.id)
                : this.state.historySessions;

            if (currentAppSessions.length === 0) {
                $list.html('<div class="kurumi-chat-no-sessions">暂无会话</div>');
                return;
            }

            // 按更新时间倒序排列，最新的会话在最上面
            currentAppSessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            // 渲染每个会话项
            currentAppSessions.forEach(session => {
                // 给 messages 加默认值，避免 undefined
                session.messages = session.messages || [];
                const sessionTime = session.updatedAt
                    ? session.updatedAt.split(' ')[1]?.slice(0, 5) || '未知时间'
                    : '未知时间';
                const $item = $(`
                    <div class="kurumi-chat-session-item ${this.state.currentSession.id === session.id ? 'active' : ''}" 
                        data-session-id="${session.id}">
                        <div class="kurumi-chat-session-title" data-session-id="${session.id}">${session.title}</div>
                        <div class="kurumi-chat-session-meta">
                            <span class="kurumi-chat-session-time">${sessionTime}</span>
                            <div class="kurumi-chat-session-button-div">
                                <button class="kurumi-chat-session-edit-btn" data-session-id="${session.id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="kurumi-chat-session-delete-btn" data-session-id="${session.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    `);

                // 会话点击事件
                $item.on('click', (e) => {
                    // 当点击删除按钮、编辑按钮、保存按钮或输入框时，不触发会话切换
                    if (!$(e.target).closest('.kurumi-chat-session-delete-btn, .kurumi-chat-session-edit-btn, .session-save-btn, .kurumi-chat-session-title-input').length) {
                        this.state.currentSession = session;
                        this.chat.renderSessionsList(); // 更新选中状态
                        this.chat.renderCurrentSession(); // 渲染会话内容
                    }
                });

                // 会话修改事件
                $item.find('.kurumi-chat-session-edit-btn').on('click', (e) => {
                    e.stopPropagation();
                    const sessionId = $(e.currentTarget).data('session-id');
                    const $titleDiv = $item.find(`.kurumi-chat-session-title[data-session-id="${sessionId}"]`);
                    const currentTitle = $titleDiv.text().trim();
                    const $editButton = $(e.currentTarget);

                    // 替换标题为文本框
                    $titleDiv.html(`<input type="text" class="kurumi-chat-session-title-input" value="${KurumiChat.escapeHtml(currentTitle)}" />`);
                    const $input = $titleDiv.find('.kurumi-chat-session-title-input');
                    $input.focus();

                    // 回车键保存
                    $input.on('keydown', async (keyEvent) => {
                        if (keyEvent.key === 'Enter') {
                            keyEvent.stopPropagation();
                            await saveSessionTitle(sessionId, $input.val().trim(), $titleDiv, $editButton);
                        }
                    });

                    // 失焦时保存
                    $input.on('blur', async () => {
                        await saveSessionTitle(sessionId, $input.val().trim(), $titleDiv, $editButton);
                    });
                });

                // 保存会话标题的函数
                const saveSessionTitle = async (sessionId, newTitle, $titleDiv, $editButton) => {
                    if (!newTitle.trim()) {
                        // 如果为空，恢复原标题
                        $titleDiv.text(session.title);
                    } else {
                        // 更新标题
                        try {
                            // 找到对应会话并更新标题
                            const targetSession = this.state.historySessions.find(s => s.id === sessionId);
                            if (targetSession) {
                                targetSession.title = newTitle.trim();
                                targetSession.updatedAt = util.getCurrentTime();
                                // 保存到IndexDB
                                await api.saveSession(targetSession);
                                // 更新当前会话（如果是当前会话）
                                if (this.state.currentSession.id === sessionId) {
                                    this.state.currentSession.title = newTitle.trim();
                                }
                                $titleDiv.text(newTitle.trim());
                                util.showToast('标题已更新', 'success');
                            }
                        } catch (error) {
                            util.showToast(`更新标题失败: ${error.message}`, 'error');
                            $titleDiv.text(session.title); // 恢复原标题
                        }
                    }
                };

                // 会话删除事件
                $item.find('.kurumi-chat-session-delete-btn').on('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const confirmed = await util.showConfirm('删除会话', '确定要删除此会话吗？此操作不可恢复。');
                        if (confirmed) {
                            await api.deleteSession(session.id);
                            // 从列表中移除
                            this.state.historySessions = this.state.historySessions.filter(s => s.id !== session.id);
                            // 若删除的是当前会话，切换到第一个或新建
                            if (this.state.currentSession.id === session.id) {
                                if (this.state.historySessions.length > 0) {
                                    this.state.currentSession = this.state.historySessions[0];
                                } else {
                                    this.chat.createNewSession();
                                }
                            }
                            this.chat.renderSessionsList();
                            this.chat.renderCurrentSession();
                            util.showToast('会话已删除', 'success');
                        }
                    } catch (error) {
                        util.showToast(`删除失败: ${error.message}`, 'error');
                    }
                });
                $list.append($item);
            });
        },
        /**
         * 渲染当前会话的聊天内容
         */
        renderCurrentSession: (isToBottom = false) => {
            const $content = $('#kurumi-chat-content');
            const $emptyState = $('#kurumi-chat-empty-state');

            $content.find('.kurumi-chat-message').remove();
            // 过滤掉system消息，只计算用户和助手的消息
            const nonSystemMessages = this.state.currentSession.messages.filter(msg => msg.role !== 'system');
            if (nonSystemMessages.length === 0) {
                $emptyState.show();
                return;
            }
            $emptyState.hide();

            // 遍历messages数组渲染每条消息（跳过system消息）
            this.state.currentSession.messages.forEach(msg => {
                // 跳过system消息的渲染
                if (msg.role === 'system') return;
                let messageHtml = '';
                // 判断是否为加载消息
                if (msg.content === '__loading__') {
                    // 渲染气泡加载动画
                    messageHtml = `
                        <div class="kurumi-chat-message kurumi-chat-message-${msg.role}" id="${msg.id}">
                        <div class="kurumi-chat-message-avatar">
                            <i class="bi bi-robot"></i>
                        </div>
                        <div class="kurumi-chat-message-content">
                            <div class="kurumi-chat-message-nickname">${this.state.currentApp.name}</div>
                            <div class="kurumi-chat-message-text">
                            <div class="kurumi-chat-loading-bubbles">
                                <span class="bubble"></span>
                                <span class="bubble"></span>
                                <span class="bubble"></span>
                            </div>
                            </div>
                            <div class="kurumi-chat-message-time">${msg.time}</div>
                        </div>
                        </div>
                    `;
                } else {
                    // 渲染正常消息（用户/助手）
                    // 使用htmlContent（如果有），否则处理并解析content
                    let parsedContent;
                    if (msg.htmlContent) {
                        parsedContent = msg.htmlContent;
                    } else {
                        if (msg.role === 'user') {
                            // 处理base64图片内容
                            const processedContent = this.chat.processMessageContent(msg.content);
                            parsedContent = marked.parse(processedContent);
                        } else {
                            parsedContent = marked.parse(msg.content);
                        }
                    }
                    const contentHtml = parsedContent;
                    // 为每条消息生成唯一ID
                    const messageId = `msg-${msg.id || util.generateUUID()}`;

                    messageHtml = `
                        <div class="kurumi-chat-message kurumi-chat-message-${msg.role}" data-message-id="${messageId}">
                        <div class="kurumi-chat-message-avatar">
                            <i class="bi ${msg.role === 'user' ? 'bi-person' : 'bi-robot'}"></i>
                        </div>
                        <div class="kurumi-chat-message-content">
                            <div class="kurumi-chat-message-nickname">${msg.role === 'user' ? this.options.userName : this.state.currentApp.name}</div>
                            <div class="kurumi-chat-message-text">
                                <div class="dynamic-content">${contentHtml}</div>
                            </div>
                            <div class="kurumi-chat-message-actions">
                                <button class="kurumi-chat-message-action-btn kurumi-chat-message-edit" title="编辑消息">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="kurumi-chat-message-action-btn kurumi-chat-message-copy" title="复制消息">
                                    <i class="bi bi-copy"></i>
                                </button>
                                <button class="kurumi-chat-message-action-btn kurumi-chat-message-delete" title="删除消息">
                                    <i class="bi bi-trash"></i>
                                </button>
                                ${msg.role === 'assistant' ? `
                                    <button class="kurumi-chat-message-action-btn kurumi-chat-message-regenerate" title="重新生成">
                                        <i class="bi bi-arrow-clockwise"></i>
                                    </button>
                                ` : ''}
                            </div>
                            <div class="kurumi-chat-message-time">${msg.time}</div>
                        </div>
                        </div>
                    `;
                }
                $content.append(messageHtml);
            });

            // 绑定消息操作按钮事件
            this.chat.bindMessageActions();

            if (isToBottom) {
                $content.scrollTop($content[0].scrollHeight);
            }
        },
        /**
         * 处理图片上传
         * @param {Event} e - 文件选择事件
         * @param {jQuery} $layero - layer弹窗元素
         */
        handleImageUpload: async (e, $layero) => {
            const file = e.target.files[0];
            if (!file) return;

            // 验证文件类型
            if (!util.isImageFile(file)) {
                util.showToast('请上传图片文件', 'error');
                e.target.value = ''; // 清空文件选择
                return;
            }

            // 验证文件大小（限制为10MB）
            if (file.size > 10 * 1024 * 1024) {
                util.showToast('图片大小不能超过10MB', 'error');
                e.target.value = ''; // 清空文件选择
                return;
            }

            try {
                // 将图片转换为base64
                const base64 = await util.fileToBase64(file);

                // 显示图片预览
                const previewArea = $layero.find('#kurumi-chat-image-preview-area');
                const previewId = `preview-${util.generateUUID()}`;

                const previewHtml = `
                    <div class="kurumi-chat-image-preview" id="${previewId}" data-base64="${base64}">
                        <img src="${base64}" alt="图片预览" class="kurumi-chat-preview-img">
                        <button class="kurumi-chat-preview-remove" data-preview-id="${previewId}">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                `;

                previewArea.append(previewHtml);
                previewArea.show();

                // 绑定移除预览图的事件
                $layero.find(`.kurumi-chat-preview-remove[data-preview-id="${previewId}"]`).on('click', (e) => {
                    e.stopPropagation();
                    const previewToRemove = $(e.target).closest('.kurumi-chat-image-preview');
                    previewToRemove.remove();

                    // 如果没有预览图了，隐藏预览区域
                    if (previewArea.find('.kurumi-chat-image-preview').length === 0) {
                        previewArea.hide();
                    }
                });

                util.showToast('图片上传成功', 'success');
            } catch (error) {
                util.showToast(`图片上传失败: ${error.message}`, 'error');
            }

            // 清空文件选择，以便可以再次选择同一文件
            e.target.value = '';
        },
        /**
         * 绑定消息操作按钮事件
         */
        bindMessageActions: () => {
            const $content = $('#kurumi-chat-content');

            // 先移除所有已绑定的事件监听器，避免重复绑定
            $content.off('click', '.kurumi-chat-message-edit');
            $content.off('click', '.kurumi-chat-message-copy');
            $content.off('click', '.kurumi-chat-message-delete');
            $content.off('click', '.kurumi-chat-message-regenerate');

            // 编辑消息
            $content.on('click', '.kurumi-chat-message-edit', async (e) => {
                e.stopPropagation();
                const $message = $(e.target).closest('.kurumi-chat-message');
                const messageId = $message.data('message-id');
                // 只通过id查找，确保准确性
                let msgIndex = -1;
                if (messageId && messageId.startsWith('msg-')) {
                    const id = messageId.replace('msg-', '');
                    // 直接查找对应id的消息，不使用DOM索引
                    msgIndex = this.state.currentSession.messages.findIndex(msg => msg.id === id);
                }

                // 如果id查找失败，遍历messages数组检查每个消息的DOM元素
                if (msgIndex === -1) {
                    // 获取当前点击的消息元素的时间戳或其他唯一标识
                    const clickedMessageTime = $message.find('.kurumi-chat-message-time').text().trim();
                    const clickedMessageRole = $message.hasClass('kurumi-chat-message-user') ? 'user' : 'assistant';

                    // 遍历messages数组，找到匹配的消息
                    for (let i = 0; i < this.state.currentSession.messages.length; i++) {
                        const msg = this.state.currentSession.messages[i];
                        if (msg.role !== 'system' && msg.role === clickedMessageRole && msg.time === clickedMessageTime) {
                            msgIndex = i;
                            break;
                        }
                    }
                }

                if (msgIndex >= 0) {
                    const message = this.state.currentSession.messages[msgIndex];
                    const originalContent = message.content;

                    const editorWidth = '1200px';
                    const editorHeight = '500px';

                    let simplemde = null;

                    // 创建编辑弹窗
                    layer.prompt({
                        title: '编辑消息',
                        formType: 2,
                        value: originalContent,
                        area: [editorWidth, editorHeight],
                        maxlength: Number.MAX_SAFE_INTEGER,
                        success: (layero) => {

                            const container = layero[0].querySelector('.kurumi-chat-layui-layer-content');
                            if (container) {
                                container.classList.add('kurumi-chat-simplemde-layui-layer-content');
                            }

                            util.injectKurumiSimplemdeStyles();
                            simplemde = new SimpleMDE({
                                autofocus: true,
                                element: document.querySelector(".kurumi-chat-layui-layer-input"),
                                toolbarTips: true, // 启用提示
                                toolbar: [
                                    {
                                        name: "bold",
                                        action: SimpleMDE.toggleBold,
                                        className: "fa fa-bold",
                                        title: "加粗"
                                    },
                                    {
                                        name: "italic",
                                        action: SimpleMDE.toggleItalic,
                                        className: "fa fa-italic",
                                        title: "斜体"
                                    },
                                    {
                                        name: "heading",
                                        action: SimpleMDE.toggleHeadingSmaller,
                                        className: "fa fa-header",
                                        title: "标题"
                                    },
                                    "|", // 分隔线
                                    {
                                        name: "quote",
                                        action: SimpleMDE.toggleBlockquote,
                                        className: "fa fa-quote-right",
                                        title: "引用"
                                    },
                                    {
                                        name: "code",
                                        action: SimpleMDE.toggleCodeBlock,
                                        className: "fa fa-code",
                                        title: "代码块"
                                    },
                                    {
                                        name: "link",
                                        action: SimpleMDE.drawLink,
                                        className: "fa fa-link",
                                        title: "链接"
                                    },
                                    {
                                        name: "image",
                                        action: SimpleMDE.drawImage,
                                        className: "fa fa-image",
                                        title: "图片"
                                    },
                                    "|",
                                    {
                                        name: "unordered-list",
                                        action: SimpleMDE.toggleUnorderedList,
                                        className: "fa fa-list-ul",
                                        title: "无序列表"
                                    },
                                    {
                                        name: "ordered-list",
                                        action: SimpleMDE.toggleOrderedList,
                                        className: "fa fa-list-ol",
                                        title: "有序列表"
                                    },
                                    "|",
                                    {
                                        name: "preview",
                                        action: SimpleMDE.togglePreview,
                                        className: "fa fa-eye no-disable",
                                        title: "预览"
                                    },
                                    {
                                        name: "side-by-side",
                                        action: SimpleMDE.toggleSideBySide,
                                        className: "fa fa-columns no-disable",
                                        title: "分屏预览"
                                    },
                                    {
                                        name: "fullscreen",
                                        action: SimpleMDE.toggleFullScreen,
                                        className: "fa fa-arrows-alt no-disable",
                                        title: "全屏"
                                    },
                                    "|",
                                    {
                                        name: "guide",
                                        action: function customFunction(editor) {
                                            window.open("https://www.runoob.com/markdown/md-tutorial.html");
                                        },
                                        className: "fa fa-question-circle",
                                        title: "Markdown 帮助"
                                    }
                                ],
                                status: [
                                    {
                                        className: "lines",
                                        defaultValue: function (el) {
                                            el.innerHTML = "0 行";
                                            return el;
                                        },
                                        onUpdate: (el) => {
                                            const lineCount = simplemde.codemirror.lineCount();
                                            el.innerHTML = lineCount + " 行";
                                        }
                                    },
                                    {
                                        className: "words",
                                        defaultValue: function (el) {
                                            el.innerHTML = "0 字";
                                            return el;
                                        },
                                        onUpdate: (el) => {
                                            const wordCount = simplemde.codemirror.getValue().length;
                                            el.innerHTML = wordCount + " 字";
                                        }
                                    },
                                    {
                                        className: "cursor",
                                        defaultValue: function (el) {
                                            el.innerHTML = "行 1, 列 0";
                                            return el;
                                        },
                                        onUpdate: (el) => {
                                            const cursor = simplemde.codemirror.getCursor();
                                            el.innerHTML = `行 ${cursor.line + 1}, 列 ${cursor.ch}`;
                                        }
                                    }
                                ]
                            });

                            const codeMirror = container.querySelector('.CodeMirror');
                            codeMirror.style.setProperty('width', editorWidth, 'important');
                            codeMirror.style.setProperty('height', editorHeight, 'important');

                            const statusbar = container.querySelector('.editor-statusbar');
                            statusbar.style.setProperty('width', editorWidth, 'important');

                        },
                        end: () => {
                            util.removeKurumiSimplemdeStyles();
                        }
                    }, async (value, index) => {
                        if (simplemde.value().trim()) {
                            // 更新消息内容
                            message.content = simplemde.value().trim();
                            message.htmlContent = message.role === 'assistant' ?
                                marked.parse(simplemde.value().trim()) : null;
                            message.time = util.getCurrentTime();

                            // 保存会话
                            await api.saveSession(this.state.currentSession);

                            // 保存当前滚动位置
                            const scrollPosition = $('#kurumi-chat-content').scrollTop();
                            // 重新渲染会话
                            this.chat.renderCurrentSession();
                            // 恢复滚动位置
                            setTimeout(() => {
                                $('#kurumi-chat-content').scrollTop(scrollPosition);
                            }, 0);
                            util.showToast('消息已更新', 'success');
                        }
                        layer.close(index);
                    });
                }
            });

            // 复制消息
            $content.on('click', '.kurumi-chat-message-copy', (e) => {
                e.stopPropagation();
                const $message = $(e.target).closest('.kurumi-chat-message');
                const messageId = $message.data('message-id');
                // 只通过id查找，确保准确性
                let msgIndex = -1;
                if (messageId && messageId.startsWith('msg-')) {
                    const id = messageId.replace('msg-', '');
                    // 直接查找对应id的消息，不使用DOM索引
                    msgIndex = this.state.currentSession.messages.findIndex(msg => msg.id === id);
                }

                // 如果id查找失败，遍历messages数组检查每个消息的DOM元素
                if (msgIndex === -1) {
                    // 获取当前点击的消息元素的时间戳或其他唯一标识
                    const clickedMessageTime = $message.find('.kurumi-chat-message-time').text().trim();
                    const clickedMessageRole = $message.hasClass('kurumi-chat-message-user') ? 'user' : 'assistant';

                    // 遍历messages数组，找到匹配的消息
                    for (let i = 0; i < this.state.currentSession.messages.length; i++) {
                        const msg = this.state.currentSession.messages[i];
                        if (msg.role !== 'system' && msg.role === clickedMessageRole && msg.time === clickedMessageTime) {
                            msgIndex = i;
                            break;
                        }
                    }
                }

                if (msgIndex >= 0) {
                    const message = this.state.currentSession.messages[msgIndex];

                    // 复制到剪贴板
                    navigator.clipboard.writeText(message.content)
                        .then(() => {
                            util.showToast('已复制到剪贴板', 'success');
                        })
                        .catch(() => {
                            util.showToast('复制失败，请手动复制', 'error');
                        });
                }
            });

            // 删除消息
            $content.on('click', '.kurumi-chat-message-delete', async (e) => {
                e.stopPropagation();
                const $message = $(e.target).closest('.kurumi-chat-message');
                const messageId = $message.data('message-id');
                // 只通过id查找，确保准确性
                let msgIndex = -1;
                if (messageId && messageId.startsWith('msg-')) {
                    const id = messageId.replace('msg-', '');
                    // 直接查找对应id的消息，不使用DOM索引
                    msgIndex = this.state.currentSession.messages.findIndex(msg => msg.id === id);
                }

                // 如果id查找失败，遍历messages数组检查每个消息的DOM元素
                if (msgIndex === -1) {
                    // 获取当前点击的消息元素的时间戳或其他唯一标识
                    const clickedMessageTime = $message.find('.kurumi-chat-message-time').text().trim();
                    const clickedMessageRole = $message.hasClass('kurumi-chat-message-user') ? 'user' : 'assistant';

                    // 遍历messages数组，找到匹配的消息
                    for (let i = 0; i < this.state.currentSession.messages.length; i++) {
                        const msg = this.state.currentSession.messages[i];
                        if (msg.role !== 'system' && msg.role === clickedMessageRole && msg.time === clickedMessageTime) {
                            msgIndex = i;
                            break;
                        }
                    }
                }

                if (msgIndex >= 0) {
                    const confirmed = await util.showConfirm('删除消息', '确定要删除此消息吗？此操作不可恢复。');
                    if (confirmed) {
                        // 移除消息
                        this.state.currentSession.messages.splice(msgIndex, 1);

                        // 如果删除的是助手消息，且后面还有消息，需要删除后面的所有消息
                        const deletedMessage = this.state.currentSession.messages[msgIndex - 1];
                        if (deletedMessage && deletedMessage.role === 'user') {
                            // 找到下一条用户消息的索引
                            let nextUserIndex = -1;
                            for (let i = msgIndex; i < this.state.currentSession.messages.length; i++) {
                                if (this.state.currentSession.messages[i].role === 'user') {
                                    nextUserIndex = i;
                                    break;
                                }
                            }

                            // 如果有下一条用户消息，删除当前位置到下一条用户消息之前的所有消息
                            if (nextUserIndex > -1) {
                                this.state.currentSession.messages.splice(msgIndex, nextUserIndex - msgIndex);
                            } else {
                                // 如果没有下一条用户消息，删除当前位置到末尾的所有消息
                                this.state.currentSession.messages.splice(msgIndex);
                            }
                        }

                        // 保存会话
                        this.state.currentSession.updatedAt = util.getCurrentTime();
                        await api.saveSession(this.state.currentSession);

                        // 保存当前滚动位置
                        const scrollPosition = $('#kurumi-chat-content').scrollTop();
                        // 重新渲染会话
                        this.chat.renderCurrentSession();
                        // 恢复滚动位置，但考虑到删除了消息，可能需要适当调整
                        setTimeout(() => {
                            $('#kurumi-chat-content').scrollTop(Math.min(scrollPosition, $('#kurumi-chat-content')[0].scrollHeight));
                        }, 0);
                        util.showToast('消息已删除', 'success');
                    }
                }
            });

            // 重新生成助手消息
            $content.on('click', '.kurumi-chat-message-regenerate', async (e) => {
                e.stopPropagation();
                const $message = $(e.target).closest('.kurumi-chat-message');
                const messageId = $message.data('message-id');
                // 只通过id查找，确保准确性
                let msgIndex = -1;
                if (messageId && messageId.startsWith('msg-')) {
                    const id = messageId.replace('msg-', '');
                    // 直接查找对应id的消息，不使用DOM索引
                    msgIndex = this.state.currentSession.messages.findIndex(msg => msg.id === id);
                }

                // 如果id查找失败，遍历messages数组检查每个消息的DOM元素
                if (msgIndex === -1) {
                    // 获取当前点击的消息元素的时间戳或其他唯一标识
                    const clickedMessageTime = $message.find('.kurumi-chat-message-time').text().trim();
                    const clickedMessageRole = $message.hasClass('kurumi-chat-message-user') ? 'user' : 'assistant';

                    // 遍历messages数组，找到匹配的消息
                    for (let i = 0; i < this.state.currentSession.messages.length; i++) {
                        const msg = this.state.currentSession.messages[i];
                        if (msg.role !== 'system' && msg.role === clickedMessageRole && msg.time === clickedMessageTime) {
                            msgIndex = i;
                            break;
                        }
                    }
                }

                if (msgIndex >= 0 && this.state.currentSession.messages[msgIndex].role === 'assistant') {
                    // 找到对应的用户消息（前面最近的用户消息）
                    let userMsgIndex = -1;
                    for (let i = msgIndex - 1; i >= 0; i--) {
                        if (this.state.currentSession.messages[i].role === 'user') {
                            userMsgIndex = i;
                            break;
                        }
                    }

                    if (userMsgIndex >= 0) {
                        // 删除当前助手消息及其后面的所有消息
                        this.state.currentSession.messages.splice(msgIndex);

                        // 保存会话
                        this.state.currentSession.updatedAt = util.getCurrentTime();
                        await api.saveSession(this.state.currentSession);

                        // 重新生成回答（调用发送消息的逻辑，但不需要重新输入）
                        try {
                            // 生成助手消息占位符（加载动画）
                            this.state.isLoading = true;
                            this.state.currentMessageId = `assist-${util.generateUUID()}`;

                            // 构造加载状态的临时消息
                            const loadingMessage = {
                                role: 'assistant',
                                content: '__loading__',
                                time: util.getCurrentTime(),
                                id: this.state.currentMessageId
                            };

                            // 将加载消息加入messages数组
                            this.state.currentSession.messages.push(loadingMessage);

                            // 渲染
                            this.chat.renderCurrentSession();
                            $('#kurumi-chat-content').scrollTop($('#kurumi-chat-content')[0].scrollHeight);

                            // 准备传给API的对话历史
                            const messagesForApi = [];
                            if (this.state.currentApp && this.state.currentApp.prompt) {
                                messagesForApi.push({
                                    role: 'system',
                                    content: this.state.currentApp.prompt
                                });
                            }

                            // 添加用户消息历史到当前用户消息
                            this.state.currentSession.messages.forEach((msg, index) => {
                                if (msg.role !== 'system' && index <= userMsgIndex) {
                                    messagesForApi.push({
                                        role: msg.role,
                                        content: msg.content
                                    });
                                }
                            });

                            // 调用流式API
                            await api.streamChat(
                                {
                                    serverUrl: this.options.currentModel.serverUrl,
                                    modelName: this.options.currentModel.modelName,
                                    messages: messagesForApi,
                                    apiPath: this.options.currentModel.apiPath
                                },
                                (parsedHtml) => {
                                    const $msgText = $(`#${this.state.currentMessageId} .kurumi-chat-message-text`);
                                    if ($msgText.find('.kurumi-chat-loading-bubbles').length > 0) {
                                        $msgText.html(`<div class="dynamic-content">${parsedHtml}</div>`);
                                    } else {
                                        $msgText.find('.dynamic-content').html(parsedHtml);
                                    }
                                    $('#kurumi-chat-content').scrollTop($('#kurumi-chat-content')[0].scrollHeight);
                                },
                                (finalHtml, fullText) => {
                                    this.state.isLoading = false;
                                    const assistMessage = {
                                        role: 'assistant',
                                        content: fullText,
                                        htmlContent: finalHtml,
                                        time: util.getCurrentTime()
                                    };
                                    this.state.currentSession.messages.pop();
                                    this.state.currentSession.messages.push(assistMessage);
                                    this.state.currentSession.updatedAt = util.getCurrentTime();

                                    api.saveSession(this.state.currentSession).catch(err =>
                                        util.showToast(`保存会话失败: ${err.message}`, 'error')
                                    );

                                    // const $msgText = $(`#${this.state.currentMessageId} .kurumi-chat-message-text`);
                                    // if ($msgText.length > 0) {
                                    //     $msgText.find('.dynamic-content').html(finalHtml);
                                    // } else {
                                    //     this.chat.renderCurrentSession();
                                    // }
                                    this.chat.renderCurrentSession(true);
                                },
                                (error) => {
                                    this.state.isLoading = false;
                                    const $errorMsg = $(`#${this.state.currentMessageId} .kurumi-chat-message-text`);
                                    $errorMsg.html(`
                                        <div class="kurumi-chat-error-message">
                                            <i class="bi bi-exclamation-circle"></i>
                                            生成回答失败: ${error}
                                        </div>
                                    `);
                                    util.showToast(`请求失败: ${error}`, 'error');
                                    this.state.currentSession.messages.pop();
                                }
                            );
                        } catch (error) {
                            this.state.isLoading = false;
                            util.showToast(`重新生成失败: ${error.message}`, 'error');
                        }
                    }
                }
            });
        },
        /**
         * 发送用户消息
         */
        sendUserMessage: async () => {
            const $input = $('#kurumi-chat-message-input');
            const textContent = $input.val().trim();
            const $previewArea = $('#kurumi-chat-image-preview-area');
            const previewImages = $previewArea.find('.kurumi-chat-image-preview');

            // 检查是否有内容（文本或图片）
            if (!textContent && previewImages.length === 0) {
                util.showToast('请输入消息内容或上传图片', 'warning');
                return;
            }

            if (this.state.isLoading) {
                util.showToast('正在生成回答，请稍候', 'info');
                return;
            }

            // 清空输入框
            $input.val('');

            // 构造用户消息内容（文本 + 图片）
            let messageContent = textContent;

            // 如果有图片，将图片的base64数据添加到消息内容中
            if (previewImages.length > 0) {
                previewImages.each((index, element) => {
                    const base64 = $(element).data('base64');
                    messageContent += (messageContent ? ' ' : '') + base64;
                });

                // 清空预览区域
                $previewArea.empty();
                $previewArea.hide();
            }

            // 构造用户消息
            const userMessage = {
                role: 'user',
                content: messageContent,
                time: util.getCurrentTime()
            };

            // 添加用户消息到当前会话 + 更新会话信息
            // 过滤掉system消息，检查是否是第一次提问
            const nonSystemMessages = this.state.currentSession.messages.filter(msg => msg.role !== 'system');
            const isFirstQuestion = nonSystemMessages.length === 0;

            this.state.currentSession.messages.push(userMessage);

            // 如果是第一次提问，更新会话标题（取首条消息前20字）
            if (isFirstQuestion) {
                this.state.currentSession.title = textContent.length > 20
                    ? textContent.slice(0, 20) + '...'
                    : textContent;

                // 如果会话标题包含app名称的前缀，需要先移除
                const appNamePrefix = this.state.currentApp ? `${this.state.currentApp.name} - ` : '';
                if (this.state.currentSession.title.startsWith(appNamePrefix)) {
                    this.state.currentSession.title = this.state.currentSession.title.substring(appNamePrefix.length);
                }
            }
            this.state.currentSession.updatedAt = util.getCurrentTime();

            // 保存用户消息到IndexDB（只需执行一次）
            await api.saveSession(this.state.currentSession);

            // 如果是第一次提问，更新会话标题后需要重新渲染会话列表
            if (isFirstQuestion) {
                this.chat.renderSessionsList();
            }

            // 渲染用户消息（此时页面已能显示用户记录）
            this.chat.renderCurrentSession();

            // 发送新消息后滚动到底部
            const $content = $('#kurumi-chat-content');
            $content.scrollTop($content[0].scrollHeight);

            try {
                // 生成助手消息占位符（加载动画）
                this.state.isLoading = true;
                this.state.currentMessageId = `assist-${util.generateUUID()}`;
                this.state.isLoading = true;
                this.state.currentMessageId = `assist-${util.generateUUID()}`;
                // 构造加载状态的临时消息（role设为assistant，content标记为loading）
                const loadingMessage = {
                    role: 'assistant',
                    content: '__loading__', // 特殊标记，用于渲染加载动画
                    time: util.getCurrentTime(),
                    id: this.state.currentMessageId // 标记唯一ID
                };
                // 将加载消息加入messages数组（此时数组顺序：用户消息 → 加载消息）
                this.state.currentSession.messages.push(loadingMessage);
                // 渲染（此时页面会显示用户消息 + 加载动画）
                this.chat.renderCurrentSession();
                // 滚动到底部
                $('#kurumi-chat-content').scrollTop($('#kurumi-chat-content')[0].scrollHeight);

                // 准备传给VLLM的对话历史
                // 如果有选中的app，添加app的prompt作为system消息
                const messagesForApi = [];
                if (this.state.currentApp && this.state.currentApp.prompt) {
                    messagesForApi.push({
                        role: 'system',
                        content: this.state.currentApp.prompt
                    });
                }
                // 添加用户消息历史
                this.state.currentSession.messages.forEach(msg => {
                    if (msg.role !== 'system') { // 避免重复添加system消息
                        if (msg.content !== '__loading__') { // 避免添加加载消息
                            messagesForApi.push({
                                role: msg.role,
                                content: msg.content
                            });
                        }
                    }
                });

                // 调用VLLM流式API（直接使用现有变量，无重复逻辑）
                // index.js 中调用 api.streamChat 的流式回调部分
                await api.streamChat(
                    {
                        serverUrl: this.options.currentModel.serverUrl,
                        modelName: this.options.currentModel.modelName,
                        messages: messagesForApi,
                        apiPath: this.options.currentModel.apiPath
                    },
                    // 流式消息回调（修改后：直接使用解析好的HTML）
                    (parsedHtml) => {
                        const $msgText = $(`#${this.state.currentMessageId} .kurumi-chat-message-text`);
                        if ($msgText.find('.kurumi-chat-loading-bubbles').length > 0) {
                            // 首次更新：替换加载动画为HTML
                            $msgText.html(`<div class="dynamic-content">${parsedHtml}</div>`);
                        } else {
                            // 后续更新：直接替换HTML内容
                            $msgText.find('.dynamic-content').html(parsedHtml);
                        }
                        $('#kurumi-chat-content').scrollTop($('#kurumi-chat-content')[0].scrollHeight);
                    },
                    // 完成回调（同样直接使用最终HTML）
                    (finalHtml, fullText) => {
                        this.state.isLoading = false;
                        const assistMessage = {
                            role: 'assistant',
                            content: fullText, // 保存原始文本（方便后续编辑/重新渲染）
                            htmlContent: finalHtml, // 保存解析后的HTML，优化加载速度
                            time: util.getCurrentTime()
                        };
                        this.state.currentSession.messages.pop(); // 删除加载消息
                        this.state.currentSession.messages.push(assistMessage);
                        this.state.currentSession.updatedAt = util.getCurrentTime();
                        api.saveSession(this.state.currentSession).catch(err =>
                            util.showToast(`保存会话失败: ${err.message}`, 'error')
                        );

                        this.chat.renderCurrentSession(true);
                    },
                    // 错误回调
                    (error) => {
                        this.state.isLoading = false;
                        const $errorMsg = $(`#${this.state.currentMessageId} .kurumi-chat-message-text`);
                        $errorMsg.html(`
                            <div class="kurumi-chat-error-message">
                                <i class="bi bi-exclamation-circle"></i>
                                生成回答失败: ${error}
                            </div>
                        `);
                        util.showToast(`请求失败: ${error}`, 'error');
                        this.state.currentSession.messages.pop();
                    }
                );
            } catch (error) {
                this.state.isLoading = false;
                util.showToast(`发送消息失败: ${error.message}`, 'error');
            }
        }
    }

    // ------------------------------
    // 静态方法
    // ------------------------------
    static getVersion() {
        return '2.0.0';
    }

    // 辅助函数：HTML转义
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// UMD兼容导出
if (typeof define === 'function' && define.amd) {
    define([], () => KurumiChat);
} else if (typeof module === 'object' && module.exports) {
    module.exports = KurumiChat;
} else {
    window.KurumiChat = KurumiChat;
}

export default KurumiChat;
import lightStyles from '../css/light.css?inline';
import darkStyles from '../css/dark.css?inline';
import simplemdeLightStyles from '../css/simplemde-light.min.css?inline';
import simplemdeDarkStyles from '../css/simplemde-dark.min.css?inline';
import kurumiSimplemdeStyles from '../css/kurumi-simplemde.css?inline';
import { config } from './config.js';

export const util = {
    /**
     * 生成UUID
     * @returns {string} UUID
     */
    generateUUID: () => {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    },

    /**
     * 将图片文件转换为Base64
     * @param {File} file - 图片文件
     * @returns {Promise<string>} Base64字符串
     */
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * 验证文件是否为图片
     * @param {File} file - 文件对象
     * @returns {boolean} 是否为图片
     */
    isImageFile: (file) => {
        return file && file.type && file.type.startsWith('image/');
    },

    /**
     * 格式化时间（YYYY-MM-DD HH:mm:ss）
     * @param {string} dateString - ISO时间字符串
     * @returns {string} 格式化时间
     */
    formatTime: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/\//g, '-');
    },
    /**
    * 注入主题样式
    */
    injectStyles: (theme) => {
        // 移除现有样式
        const existingStyle = document.getElementById('kurumi-chat-styles');
        if (existingStyle) document.head.removeChild(existingStyle);

        // 移除simpleMDE现有样式
        const existingSimplemdeStyle = document.getElementById('kurumi-chat-simplemde-styles');
        if (existingSimplemdeStyle) document.head.removeChild(existingSimplemdeStyle);

        // 创建新样式元素
        const styleElement = document.createElement('style');
        styleElement.id = 'kurumi-chat-styles';
        styleElement.textContent = theme === 'light' ? lightStyles : darkStyles;
        document.head.appendChild(styleElement);

        // 创建simpleMDE新样式元素
        const simplemdeStyleElement = document.createElement('style');
        simplemdeStyleElement.id = 'kurumi-chat-simplemde-styles';
        simplemdeStyleElement.textContent = theme === 'light' ? simplemdeLightStyles : simplemdeDarkStyles;
        document.head.appendChild(simplemdeStyleElement);
    },

    injectKurumiSimplemdeStyles: () => {
        // 移除现有样式
        const existingStyle = document.getElementById('kurumi-chat-custom-simplemde-styles');
        if (existingStyle) document.head.removeChild(existingStyle);

        // 创建新样式元素
        const styleElement = document.createElement('style');
        styleElement.id = 'kurumi-chat-custom-simplemde-styles';
        styleElement.textContent = kurumiSimplemdeStyles;
        document.head.appendChild(styleElement);
    },

    removeKurumiSimplemdeStyles: () => {
        // 移除现有样式
        const existingStyle = document.getElementById('kurumi-chat-custom-simplemde-styles');
        if (existingStyle) document.head.removeChild(existingStyle);
    },

    /**
     * 显示提示消息
     * @param {string} text - 消息内容
     * @param {string} type - 类型（success/error/info）
     */
    showToast: (text, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `kurumi-chat-toast kurumi-chat-toast-${type}`;
        toast.textContent = text;
        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => toast.classList.add('show'), 10);
        // 自动关闭
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, config.messageDuration);
    },

    /**
     * 获取当前时间（格式化）
     * @returns {string} 时间字符串
     */
    getCurrentTime: () => {
        return util.formatTime(new Date().toISOString());
    },

    /**
     * 显示确认对话框
     * @param {string} title - 对话框标题
     * @param {string} message - 对话框消息
     * @returns {Promise<boolean>} - 返回Promise，resolve(true)表示确认，resolve(false)表示取消
     */
    showConfirm: (title = '确认操作', message = '确定要执行此操作吗？') => {
        return new Promise((resolve) => {
            // 创建遮罩层
            const overlay = document.createElement('div');
            overlay.className = 'kurumi-chat-confirm-overlay';

            // 创建确认框容器
            const confirmBox = document.createElement('div');
            confirmBox.className = 'kurumi-chat-confirm-box';

            // 创建确认框内容
            confirmBox.innerHTML = `
                <div class="kurumi-chat-confirm-header">
                    <h3>${title}</h3>
                </div>
                <div class="kurumi-chat-confirm-body">
                    <p>${message}</p>
                </div>
                <div class="kurumi-chat-confirm-footer">
                    <button class="kurumi-chat-confirm-cancel">取消</button>
                    <button class="kurumi-chat-confirm-ok">确认</button>
                </div>
            `;

            // 将确认框添加到遮罩层
            overlay.appendChild(confirmBox);

            // 添加到页面
            document.body.appendChild(overlay);

            // 显示动画
            setTimeout(() => {
                overlay.classList.add('show');
                confirmBox.classList.add('show');
            }, 10);

            // 绑定取消按钮事件
            const cancelBtn = confirmBox.querySelector('.kurumi-chat-confirm-cancel');
            cancelBtn.addEventListener('click', () => {
                closeConfirm(false);
            });

            // 绑定确认按钮事件
            const okBtn = confirmBox.querySelector('.kurumi-chat-confirm-ok');
            okBtn.addEventListener('click', () => {
                closeConfirm(true);
            });

            // 点击遮罩层取消
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeConfirm(false);
                }
            });

            // 按ESC键取消
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    closeConfirm(false);
                }
            };
            document.addEventListener('keydown', handleEsc);

            // 关闭确认框的函数
            const closeConfirm = (result) => {
                overlay.classList.remove('show');
                confirmBox.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    document.removeEventListener('keydown', handleEsc);
                    resolve(result);
                }, 300);
            };
        });
    }
};
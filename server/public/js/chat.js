/**
 * AI聊天前端JS
 * 实现SSE连接与打字效果
 */

document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const statusElement = document.getElementById('status');
    
    // 生成随机UUID作为会话标识
    const uuid = generateUUID();
    
    // 是否正在等待AI响应
    let isWaitingResponse = false;
    
    // 当前打字消息的DOM元素
    let currentTypingMessage = null;
    
    // 发送消息事件监听
    sendButton.addEventListener('click', sendMessage);
    
    // 按下Enter键发送消息（Shift+Enter为换行）
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    /**
     * 发送消息到服务器
     */
    function sendMessage() {
        const message = userInput.value.trim();
        
        if (message === '' || isWaitingResponse) {
            return;
        }
        
        // 添加用户消息到聊天容器
        addMessage(message, 'user');
        
        // 清空输入框
        userInput.value = '';
        
        // 设置状态为等待中
        isWaitingResponse = true;
        sendButton.disabled = true;
        updateStatus('AI正在思考中...');
        
        // 开始SSE连接
        connectSSE(message);
    }
    
    /**
     * 建立SSE连接
     * @param {string} prompt - 用户输入的消息
     */
    function connectSSE(prompt) {
        // 创建响应消息容器
        currentTypingMessage = document.createElement('div');
        currentTypingMessage.className = 'message ai-message typing';
        currentTypingMessage.innerHTML = '<pre></pre>';
        chatContainer.appendChild(currentTypingMessage);
        
        // 滚动到底部
        scrollToBottom();
        
        // 创建一个EventSource对象（SSE连接）
        // 注意：使用POST请求需要通过fetch API手动创建
        fetch('/api/sse?uuid=' + encodeURIComponent(uuid), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            // 读取和处理流数据
            function readStream() {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        processEvent('end', '响应结束');
                        return;
                    }
                    
                    buffer += decoder.decode(value, { stream: true });
                    
                    // 处理事件流
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        const eventMatch = line.match(/^event: (.+)$/m);
                        const dataMatch = line.match(/^data: (.+)$/m);
                        
                        if (eventMatch && dataMatch) {
                            const eventType = eventMatch[1];
                            const eventData = dataMatch[1];
                            processEvent(eventType, eventData);
                        } else if (dataMatch) {
                            // 没有event标签的数据行
                            try {
                                const parsedData = JSON.parse(dataMatch[1]);
                                if (parsedData.text) {
                                    appendToTypingMessage(parsedData.text);
                                }
                            } catch (e) {
                                console.error('解析数据错误:', e);
                            }
                        }
                    }
                    
                    return readStream();
                });
            }
            
            readStream().catch(error => {
                console.error('流读取错误:', error);
                finishTypingAnimation('发生错误，请重试');
            });
        }).catch(error => {
            console.error('连接错误:', error);
            finishTypingAnimation('连接失败，请重试');
            updateStatus('连接错误，请检查网络');
        });
    }
    
    /**
     * 处理SSE事件
     * @param {string} eventType - 事件类型
     * @param {string} eventData - 事件数据
     */
    function processEvent(eventType, eventData) {
        console.log(`事件: ${eventType}, 数据:`, eventData);
        
        switch (eventType) {
            case 'start':
                updateStatus('正在接收响应...');
                break;
                
            case 'end':
                finishTypingAnimation();
                updateStatus('');
                break;
                
            case 'error':
                let errorMessage = '发生错误';
                try {
                    const parsedError = JSON.parse(eventData);
                    errorMessage = parsedError.message || '未知错误';
                } catch (e) {
                    errorMessage = eventData || '未知错误';
                }
                finishTypingAnimation(errorMessage);
                updateStatus('错误: ' + errorMessage);
                break;
        }
    }
    
    /**
     * 追加文本到当前打字消息
     * @param {string} text - 要追加的文本
     */
    function appendToTypingMessage(text) {
        if (currentTypingMessage) {
            const preElement = currentTypingMessage.querySelector('pre');
            preElement.textContent += text;
            scrollToBottom();
        }
    }
    
    /**
     * 结束打字动画
     * @param {string} errorMessage - 可选的错误消息
     */
    function finishTypingAnimation(errorMessage) {
        // 恢复按钮和状态
        isWaitingResponse = false;
        sendButton.disabled = false;
        
        if (currentTypingMessage) {
            // 移除打字动画类
            currentTypingMessage.classList.remove('typing');
            
            // 如果有错误消息，更新内容
            if (errorMessage) {
                const preElement = currentTypingMessage.querySelector('pre');
                preElement.textContent = `错误: ${errorMessage}`;
                currentTypingMessage.classList.add('error');
            }
            
            currentTypingMessage = null;
        }
    }
    
    /**
     * 添加消息到聊天容器
     * @param {string} content - 消息内容
     * @param {string} sender - 发送者（'user' 或 'ai'）
     */
    function addMessage(content, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const preElement = document.createElement('pre');
        preElement.textContent = content;
        
        messageElement.appendChild(preElement);
        chatContainer.appendChild(messageElement);
        
        scrollToBottom();
    }
    
    /**
     * 滚动聊天容器到底部
     */
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    /**
     * 更新状态显示
     * @param {string} message - 状态消息
     */
    function updateStatus(message) {
        statusElement.textContent = message;
    }
    
    /**
     * 生成UUID
     * @returns {string} 生成的UUID
     */
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // 初始消息
    addMessage('你好！我是AI助手，有什么可以帮助您的？', 'ai');
});

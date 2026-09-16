import { useCallback, useEffect, useRef, useState } from 'react';
import { sendPortraitMessage } from '../../../services/portraitChat';

const READY_MESSAGE = '你好，我是这个 3D 作品集的虚拟向导。你可以直接输入文字和我对话。';
const FALLBACK_MESSAGE = '文字消息已收到。当前 AI 接口尚未连接，接入后这里会显示模型生成的真实回复。';

const createMessage = (role, text, id = `${role}-${Date.now()}`) => ({
    id,
    role,
    text
});

const createAbortError = () => {
    const error = new Error('Portrait text reply aborted');
    error.name = 'AbortError';
    return error;
};

const PortraitTextChat = ({
    onClose,
    onSendMessage = sendPortraitMessage,
    onSpeakingChange
}) => {
    const [messages, setMessages] = useState([
        createMessage('assistant', READY_MESSAGE, 'assistant-ready')
    ]);
    const [draft, setDraft] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);
    const [pendingReply, setPendingReply] = useState(null);
    const messageListRef = useRef();
    const mountedRef = useRef(true);
    const requestControllerRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            requestControllerRef.current?.abort();
            onSpeakingChange(false);
        };
    }, [onSpeakingChange]);

    useEffect(() => {
        if (!pendingReply) return undefined;

        const characters = Array.from(pendingReply.text);
        const step = characters.length > 90 ? 2 : 1;
        let visibleCharacters = 0;

        const timer = window.setInterval(() => {
            visibleCharacters = Math.min(visibleCharacters + step, characters.length);
            const visibleText = characters.slice(0, visibleCharacters).join('');

            setMessages((currentMessages) => currentMessages.map((message) => (
                message.id === pendingReply.id
                    ? { ...message, text: visibleText }
                    : message
            )));

            if (visibleCharacters >= characters.length) {
                window.clearInterval(timer);
                setPendingReply(null);
                setIsWaiting(false);
                onSpeakingChange(false);
            }
        }, 38);

        return () => window.clearInterval(timer);
    }, [onSpeakingChange, pendingReply]);

    useEffect(() => {
        const list = messageListRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [messages]);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text || isWaiting) return;

        const userMessage = createMessage('user', text);
        const nextMessages = [...messages, userMessage];
        const history = nextMessages.filter((message) => message.id !== 'assistant-ready');
        setMessages(nextMessages);
        setDraft('');
        setIsWaiting(true);

        let replyText = FALLBACK_MESSAGE;
        if (onSendMessage) {
            const requestController = new AbortController();
            requestControllerRef.current = requestController;
            const timeout = window.setTimeout(() => requestController.abort(), 30000);
            let handleAbort;

            try {
                const abortPromise = new Promise((_, reject) => {
                    handleAbort = () => reject(createAbortError());
                    requestController.signal.addEventListener('abort', handleAbort, { once: true });
                });
                const response = await Promise.race([
                    Promise.resolve(onSendMessage(text, history, {
                        signal: requestController.signal
                    })),
                    abortPromise
                ]);
                const candidate = typeof response === 'string' ? response : response?.text;
                if (String(candidate || '').trim()) replyText = String(candidate).trim();
            } catch (error) {
                replyText = error?.name === 'AbortError'
                    ? '文字回复请求已取消或超时，请重新发送。'
                    : error?.publicMessage || '暂时无法获取文字回复，请稍后再试。';
            } finally {
                window.clearTimeout(timeout);
                if (handleAbort) {
                    requestController.signal.removeEventListener('abort', handleAbort);
                }
                if (requestControllerRef.current === requestController) {
                    requestControllerRef.current = null;
                }
            }
        }

        if (!mountedRef.current) return;
        const replyId = `assistant-${Date.now()}`;
        setMessages((currentMessages) => [
            ...currentMessages,
            createMessage('assistant', '', replyId)
        ]);
        setPendingReply({ id: replyId, text: replyText });
        onSpeakingChange(true);
    }, [draft, isWaiting, messages, onSendMessage, onSpeakingChange]);

    return (
        <section
            className="portrait-chat"
            aria-label="与女性肖像进行文字对话"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
        >
            <header className="portrait-chat__header">
                <div>
                    <strong>文字对话</strong>
                    <span>{isWaiting ? '正在生成文字回复…' : '无语音模式'}</span>
                </div>
                <button type="button" onClick={onClose} aria-label="关闭文字对话">
                    ×
                </button>
            </header>

            <div ref={messageListRef} className="portrait-chat__messages" aria-live="polite">
                {messages.map((message) => (
                    <p
                        key={message.id}
                        className={`portrait-chat__message portrait-chat__message--${message.role}`}
                    >
                        {message.text || '…'}
                    </p>
                ))}
            </div>

            <form className="portrait-chat__form" onSubmit={handleSubmit}>
                <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="输入你想问的问题…"
                    aria-label="文字消息"
                    maxLength={500}
                    disabled={isWaiting}
                />
                <button type="submit" disabled={isWaiting || !draft.trim()}>
                    发送
                </button>
            </form>
        </section>
    );
};

export default PortraitTextChat;

const PORTRAIT_CHAT_ENDPOINT = '/api/portrait-chat';
const GENERIC_ERROR_MESSAGE = '暂时无法获取文字回复，请稍后再试。';

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export async function sendPortraitMessage(message, history, { signal } = {}) {
  const response = await fetch(PORTRAIT_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    signal,
    body: JSON.stringify({
      message,
      history: Array.isArray(history)
        ? history.slice(-12).map(({ role, text }) => ({ role, text }))
        : []
    })
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    const error = new Error(payload?.message || GENERIC_ERROR_MESSAGE);
    error.name = 'PortraitChatError';
    error.publicMessage = payload?.message || GENERIC_ERROR_MESSAGE;
    error.code = payload?.code || 'PORTRAIT_CHAT_FAILED';
    throw error;
  }

  const text = String(payload?.text || '').trim();
  if (!text) {
    const error = new Error(GENERIC_ERROR_MESSAGE);
    error.name = 'PortraitChatError';
    error.publicMessage = GENERIC_ERROR_MESSAGE;
    throw error;
  }

  return { text };
}

export default async function handler(req, res) {
  try {
    const { message, conversationId } = req.body;

    const response = await fetch(
      'https://api.coze.cn/open_api/v2/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.COZE_API_TOKEN}`,
        },
        body: JSON.stringify({
          bot_id: process.env.COZE_BOT_ID,
          user: 'vercel_user',
          query: message,
          conversation_id: conversationId || undefined,
          stream: false,
        }),
      }
    );

    const data = await response.json();
    console.log('Coze response:', JSON.stringify(data, null, 2));

    // 检查 Coze 是否返回错误
    if (data.code && data.code !== 0) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`event: error\ndata: ${JSON.stringify({ message: data.msg || 'Coze API 错误' })}\n\n`);
      res.end();
      return;
    }

    const reply =
      data.messages?.find((m) => m.type === 'answer')?.content ||
      '嗦语暂时没接上，请稍后再试。';

    // 用前端期望的 SSE 格式返回
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 发送 conversation id
    if (data.conversation_id) {
      res.write(`event: meta\ndata: ${JSON.stringify({ conversationId: data.conversation_id })}\n\n`);
    }

    // 发送回复内容
    res.write(`event: delta\ndata: ${JSON.stringify({ content: reply })}\n\n`);
    res.write(`event: done\ndata: ${JSON.stringify({ content: reply })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat error:', err);
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
    res.end();
  }
}

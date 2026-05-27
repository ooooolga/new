import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    const { message, conversationId, sessionId, turnNumber } = req.body;

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

    if (data.code && data.code !== 0) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`event: error\ndata: ${JSON.stringify({ message: data.msg || 'Coze API 错误' })}\n\n`);
      res.end();
      return;
    }

    const reply =
      data.messages?.find((m) => m.type === 'answer')?.content ||
      '嗦语暂时没接上，请稍后再试。';

    // 把对话存进数据库
    try {
      await sql`
        INSERT INTO conversations (session_id, conversation_id, turn_number, user_message, ai_reply)
        VALUES (${sessionId || null}, ${data.conversation_id || conversationId || null}, ${turnNumber || null}, ${message}, ${reply})
      `;
    } catch (dbErr) {
      console.error('DB insert error:', dbErr);
      // 数据库出错不影响用户体验，继续返回回复
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (data.conversation_id) {
      res.write(`event: meta\ndata: ${JSON.stringify({ conversationId: data.conversation_id })}\n\n`);
    }

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

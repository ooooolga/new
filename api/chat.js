export default async function handler(req, res) {
  try {
    const { message } = req.body;

    const response = await fetch(
      'https://api.coze.com/open_api/v2/chat',
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
          stream: false,
        }),
      }
    );

    const data = await response.json();

    const reply =
      data.messages?.find((m) => m.type === 'answer')?.content ||
      '嗦语暂时没接上，请稍后再试。';

    res.status(200).send(reply);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}

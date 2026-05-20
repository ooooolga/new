export default function handler(req, res) {
  res.status(200).json({
    cozeConfigured: true,
    demoMode: false
  });
}

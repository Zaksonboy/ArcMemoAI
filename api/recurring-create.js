import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'Missing address' });

    const ids = await redis.smembers('recurring:index');
    const orders = [];
    for (const id of ids) {
      const raw = await redis.get(`recurring:${id}`);
      if (!raw) continue;
      const order = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (order.walletAddress?.toLowerCase() === address.toLowerCase()) {
        orders.push(order);
      }
    }
    orders.sort((a, b) => b.createdAt - a.createdAt);
    return res.status(200).json({ orders });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, amount, description, intervalDays, walletAddress } = req.body;

  if (!to || !amount || !description || !intervalDays || !walletAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = `recur-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const nextRunAt = Date.now() + Number(intervalDays) * 24 * 60 * 60 * 1000;

  const order = {
    id,
    to,
    amount,
    description,
    intervalDays: Number(intervalDays),
    nextRunAt,
    active: true,
    createdAt: Date.now(),
    walletAddress: walletAddress.toLowerCase(),
  };

  await redis.set(`recurring:${id}`, JSON.stringify(order));
  await redis.sadd('recurring:index', id);

  return res.status(200).json({ success: true, order });
}

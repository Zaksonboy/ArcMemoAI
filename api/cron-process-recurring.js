import { Redis } from '@upstash/redis';
import { ethers } from 'ethers';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const MEMO_CONTRACT_ADDRESS = '0x5294E9927c3306DcBaDb03fe70b92e01cCede505';
const USDC_TOKEN_ADDRESS = '0x3600000000000000000000000000000000000000';
const ARC_RPC = 'https://rpc.testnet.arc.network';

const MEMO_ABI = [
  {
    type: 'function', name: 'memo', stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'memoId', type: 'bytes32' },
      { name: 'memoData', type: 'bytes' },
    ],
    outputs: [],
  },
];
const ERC20_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

export default async function handler(req, res) {
  // Only allow Vercel's own cron trigger to call this
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ids = await redis.smembers('recurring:index');
  const now = Date.now();
  const results = [];

  const provider = new ethers.JsonRpcProvider(ARC_RPC);
  const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);

  const erc20Interface = new ethers.Interface(ERC20_ABI);
  const memoInterface = new ethers.Interface(MEMO_ABI);

  for (const id of ids) {
    const raw = await redis.get(`recurring:${id}`);
    if (!raw) continue;
    const order = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (!order.active || order.nextRunAt > now) continue;

    try {
      const amountUnits = ethers.parseUnits(String(order.amount), 6);
      const transferData = erc20Interface.encodeFunctionData('transfer', [order.to, amountUnits]);

      const uniqueRef = `momoai-recur-${id}-${now}`;
      const memoId = ethers.id(uniqueRef);
      const memoText = `Recurring payment: ${order.description} (auto-sent)`;
      const memoBytes = ethers.toUtf8Bytes(memoText);

      const memoCallData = memoInterface.encodeFunctionData('memo', [
        USDC_TOKEN_ADDRESS,
        transferData,
        memoId,
        memoBytes,
      ]);

      const tx = await wallet.sendTransaction({
        to: MEMO_CONTRACT_ADDRESS,
        data: memoCallData,
      });
      await tx.wait();

      order.nextRunAt = now + order.intervalDays * 24 * 60 * 60 * 1000;
      await redis.set(`recurring:${id}`, JSON.stringify(order));

      results.push({ id, status: 'sent', hash: tx.hash });
    } catch (e) {
      results.push({ id, status: 'failed', error: e.message });
    }
  }

  return res.status(200).json({ processed: results.length, results });
                                                            }

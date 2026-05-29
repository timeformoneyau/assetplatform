import {
  Client,
  PrivateKey,
  AccountId,
  TopicMessageSubmitTransaction,
  TopicId,
} from '@hashgraph/sdk';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { record } = req.body ?? {};
  if (!record) {
    res.status(400).json({ error: 'Missing record' });
    return;
  }

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const topicId = process.env.HEDERA_TOPIC_ID;
  const network = (process.env.HEDERA_NETWORK ?? 'testnet') as 'testnet' | 'mainnet';

  if (!accountId || !privateKey || !topicId) {
    res.status(503).json({ error: 'Hedera not configured' });
    return;
  }

  const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(AccountId.fromString(accountId), PrivateKey.fromStringECDSA(privateKey));
  client.setRequestTimeout(15_000);

  // Only non-sensitive fields go on the public ledger
  const payload = JSON.stringify({
    app: 'vehicle-passport',
    v: '1',
    record_id: record.id,
    vehicle_id: record.vehicle_id,
    type: record.record_type,
    date: record.record_date,
    provider: record.provider_name ?? null,
    summary: record.summary,
    odometer: record.odometer ?? null,
    source: record.source_type,
    confirmed_at: record.confirmed_at,
  });

  const submitTx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(payload)
    .execute(client);

  const receipt = await submitTx.getReceipt(client);

  const transactionId = submitTx.transactionId?.toString() ?? null;
  const sequenceNumber = receipt.topicSequenceNumber
    ? Number(receipt.topicSequenceNumber)
    : null;

  res.status(200).json({
    transaction_id: transactionId,
    sequence_number: sequenceNumber,
    network,
  });
}

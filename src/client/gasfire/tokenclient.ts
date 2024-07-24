import 'server-only'
import axios from 'axios';

export type TokenActivity = {
  sender_address: string,
  gas_used: bigint
}

async function fetchEtherscanTransactions(
    network: string, address: string,
    startblock: string, endblock: string
) {
  const api_key = process.env.ETHERSCAN_API_KEY!!;
  let networkUrlPart;

  if (network === 'mainnet') {
    networkUrlPart = 'api.etherscan.io';
  } else if (network === 'arbitrum') {
    networkUrlPart = 'api.arbiscan.io';
  } else if (network === 'basechain') {
    networkUrlPart = 'api.basescan.org';
  } else {
    networkUrlPart = 'api-' + network + '.etherscan.io';
  }

  const etherscanAPIBaseURL = `https://${networkUrlPart}`;
  const url = `${etherscanAPIBaseURL}/api?module=account&action=txlist&address=${address}&startblock=${startblock}&endblock=${endblock}&sort=desc&apikey=${api_key}`;

  try {
    const response = await axios.get(url);
    return response;
  } catch (error) {
    console.error('Error fetching Etherscan transactions:', error);
    throw error;
  }
}

export type GeneralTxItem = {
  hash: string;
  from: string;
  to: string;
  blockNumber: string;
  methodId?: string; // For Etherscan's transaction data
  isError?: string; // This might be specific to Etherscan
  input?: string; // For Alchemy's transaction data
  gasUsed: string;
};

export async function getTokenActivityBy(address: string): Promise<TokenActivity> {
  const transactions = await getTransactionsOf(address);
  const gasUsed = transactions.reduce((acc, tx) => acc + BigInt(tx.gasUsed), BigInt(0));
  return {sender_address: address, gas_used: gasUsed};
}

async function getTransactionsOf(address: string): Promise<GeneralTxItem[]> {
  const network = 'mainnet';
  const response = await fetchEtherscanTransactions(network, address, '0', 'latest');
  if (response.data.status === '0' && response.data.message === 'No transactions found') {
    return [];
  }

  if (response.data.message !== 'OK') {
    const msg = `${network}scan API error: ${JSON.stringify(response.data)}`;
    throw new Error(`${network}scan API failed: ${msg}`);
  }

  return response.data.result;
}
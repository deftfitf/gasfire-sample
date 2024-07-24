import {NextRequest, NextResponse} from "next/server";
import {getTokenActivityBy} from "@/client/gasfire/tokenclient";
import {create_signature} from "@/utils/signature";

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}

async function handler(req: NextRequest) {
  const {searchParams} = new URL(req.url);
  const address = searchParams.get('address');
  if (!address) {
    // If the address is not provided in the query, throw an error
    throw new Error('Address is required');
  }
  const privateKey = process.env.SIGNER_PRIVATE_KEY;
  if (privateKey === undefined) {
    throw new Error('SIGNER_PRIVATE_KEY is not defined');
  }

  const tokenActivity = await getTokenActivityBy(address);

  // Check credential 0 ('Complete a transaction on Basechain') for the address
  const check_result = tokenActivity.gas_used > 0;
  const counter = String(tokenActivity.gas_used);
  console.log(`Credential check result: ${check_result}, counter: ${counter}`);

  // If the credential check is successful, create a signature using the address, check result, and counter
  const signature = await create_signature(privateKey as `0x${string}`, [address as `0x${string}`, check_result, String(counter)]);
  console.log(`Signature: ${signature}`);
  // Return a success response with the check result, counter, and signature
  return NextResponse.json({mint_eligibility: check_result, data: counter, signature});
}
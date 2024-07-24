import {NextRequest, NextResponse} from 'next/server'
import {createCanvas} from '@napi-rs/canvas';
import {renderImage} from "@/render/gasfire/render";

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url);
  const address = searchParams.get('address');
  const data = BigInt(searchParams.get('data')!!);
  if (!address || !data) {
    return NextResponse.json({error: 'Missing address or data parameter'}, {status: 400});
  }

  const imageSize = 512;
  const canvas = createCanvas(imageSize, imageSize);
  const ctx = canvas.getContext('2d');

  renderImage(ctx, canvas.width, canvas.height, address, data);
  const headers = new Headers();
  headers.set("Content-Type", "image/png");

  const pngBuffer = await canvas.encode('png');
  return new NextResponse(pngBuffer, {status: 200, statusText: "OK", headers});
}

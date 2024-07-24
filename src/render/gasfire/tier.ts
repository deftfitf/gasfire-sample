export type TieredFireColor = {
  outer: string,
  middle: string,
  inner: string,
}

const tierBoundaries: bigint[] =
    [...[50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000].map(BigInt)];

export function checkTierOf(gasUsed: bigint): number {
  let i = 0;
  for (; i < tierBoundaries.length; i++) {
    if (gasUsed < tierBoundaries[i]) {
      break;
    }
  }
  return i + 1;
}

export function getTieredFireColor(tier: number): TieredFireColor {
  const tierFireColor: TieredFireColor[] =
      [
        { outer: '#414141', middle: '#797979', inner: '#ffffff' },
        { outer: '#f86124', middle: '#f6a223', inner: '#f6e989' },
        { outer: '#408600', middle: '#46ff1d', inner: '#afff9f' },
        { outer: '#124d44', middle: '#17a892', inner: '#05ffda' },
        { outer: '#004d8a', middle: '#0c93ff', inner: '#8ee1ff' },
        { outer: '#3d00b0', middle: '#6311ff', inner: '#b28cff' },
        { outer: '#ad0091', middle: '#ff35db', inner: '#ff99ec' },
        { outer: '#8c0000', middle: '#e80d0d', inner: '#ff9898' },
      ];
  return tierFireColor[tier - 1];
}
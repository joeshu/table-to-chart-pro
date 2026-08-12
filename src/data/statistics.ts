export function safeRatio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

export function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) return null;
  const avgX = x.reduce((a, b) => a + b, 0) / x.length;
  const avgY = y.reduce((a, b) => a + b, 0) / y.length;
  let numerator = 0, denX = 0, denY = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - avgX, dy = y[i] - avgY;
    numerator += dx * dy; denX += dx ** 2; denY += dy ** 2;
  }
  const denominator = Math.sqrt(denX * denY);
  return denominator === 0 ? null : numerator / denominator;
}

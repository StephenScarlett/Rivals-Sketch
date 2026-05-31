// Scoring constants
const MAX_GUESSER_POINTS = 500;
const MIN_GUESSER_POINTS = 100;
const DRAWER_POINTS_PER_GUESS = 50;

/**
 * Calculate points for a correct guess based on how quickly they guessed.
 * Faster guesses earn more points (linear decay from MAX to MIN).
 */
export function calculateGuesserPoints(
  elapsedMs: number,
  totalTimeMs: number
): number {
  const fraction = Math.min(elapsedMs / totalTimeMs, 1);
  const points = Math.round(
    MAX_GUESSER_POINTS - fraction * (MAX_GUESSER_POINTS - MIN_GUESSER_POINTS)
  );
  return Math.max(MIN_GUESSER_POINTS, points);
}

/**
 * Calculate drawer bonus points.
 */
export function calculateDrawerPoints(correctGuessCount: number): number {
  return correctGuessCount * DRAWER_POINTS_PER_GUESS;
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Check if a guess is correct (case-insensitive, ignoring extra whitespace).
 */
export function isCorrectGuess(guess: string, answer: string): boolean {
  return normalize(guess) === normalize(answer);
}

/**
 * Check if a guess is close (within Levenshtein threshold).
 * Returns true for "close" guesses that aren't exact matches.
 */
export function isCloseGuess(guess: string, answer: string): boolean {
  const g = normalize(guess);
  const a = normalize(answer);

  if (g === a) return false; // exact match, not "close"
  if (a.length <= 3) return false; // too short for close-guess detection

  const dist = levenshtein(g, a);
  const threshold = a.length <= 6 ? 1 : 2;

  return dist <= threshold;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')           // & → and (Cloak & Dagger = Cloak and Dagger)
    .replace(/\./g, '')             // remove periods (Mr. → Mr)
    .replace(/-/g, ' ')             // hyphens → spaces (Spider-Man → Spider Man)
    .replace(/\bdoctor\b/g, 'dr')   // Doctor → Dr
    .replace(/\bmister\b/g, 'mr')   // Mister → Mr
    .replace(/\bthe\s+/g, '')       // strip "the " (The Punisher → Punisher)
    .replace(/\s+/g, ' ')
    .trim();
}

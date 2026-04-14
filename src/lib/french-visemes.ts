/**
 * French grapheme-to-viseme mapper
 * Creates a lip sync timeline from French text + audio duration
 * 
 * Viseme shapes (Rhubarb standard):
 * X = silence/rest
 * A = bilabial press (M, B, P)
 * B = slight open (D, T, N, K, G, S, Z, consonants)
 * C = open vowel (A, AN, EN)
 * D = very open (AA, stressed A)
 * E = rounded (O, OU, U, EU, ON) — crucial for French
 * F = labiodental (F, V)
 * G = stretched (I, É, EE, IN) — crucial for French  
 * H = L, R sounds
 */

interface VisemeCue {
  start: number;
  end: number;
  value: string;
}

interface Phoneme {
  viseme: string;
  weight: number; // relative duration weight
}

// French grapheme → phoneme/viseme mapping
// Order matters: longer patterns first
const FRENCH_GRAPHEMES: Array<{ pattern: string; viseme: string; weight: number }> = [
  // Multi-char patterns first (longest match)
  // Nasal vowels
  { pattern: 'tion', viseme: 'B', weight: 1.5 },  // -tion = /sjɔ̃/
  { pattern: 'sion', viseme: 'B', weight: 1.5 },
  { pattern: 'ment', viseme: 'C', weight: 1.4 },
  { pattern: 'aint', viseme: 'G', weight: 1.2 },
  { pattern: 'ain', viseme: 'G', weight: 1.2 },
  { pattern: 'ein', viseme: 'G', weight: 1.2 },
  { pattern: 'ien', viseme: 'G', weight: 1.3 },
  { pattern: 'oin', viseme: 'E', weight: 1.3 },
  { pattern: 'eau', viseme: 'E', weight: 1.2 },    // eau → /o/
  { pattern: 'aux', viseme: 'E', weight: 1.2 },
  { pattern: 'eaux', viseme: 'E', weight: 1.3 },
  { pattern: 'eux', viseme: 'E', weight: 1.2 },
  { pattern: 'oeu', viseme: 'E', weight: 1.2 },
  { pattern: 'oui', viseme: 'E', weight: 1.3 },
  { pattern: 'our', viseme: 'E', weight: 1.3 },
  { pattern: 'ous', viseme: 'E', weight: 1.2 },
  { pattern: 'out', viseme: 'E', weight: 1.2 },
  { pattern: 'ou', viseme: 'E', weight: 1.1 },     // ou → /u/ très arrondi
  { pattern: 'an', viseme: 'C', weight: 1.1 },      // nasale ouverte
  { pattern: 'am', viseme: 'C', weight: 1.1 },
  { pattern: 'en', viseme: 'C', weight: 1.1 },
  { pattern: 'em', viseme: 'C', weight: 1.1 },
  { pattern: 'on', viseme: 'E', weight: 1.1 },      // nasale arrondie
  { pattern: 'om', viseme: 'E', weight: 1.1 },
  { pattern: 'in', viseme: 'G', weight: 1.1 },      // nasale étirée
  { pattern: 'im', viseme: 'G', weight: 1.1 },
  { pattern: 'un', viseme: 'E', weight: 1.1 },
  // Diphtongs
  { pattern: 'ai', viseme: 'G', weight: 1.0 },      // /ɛ/
  { pattern: 'ei', viseme: 'G', weight: 1.0 },
  { pattern: 'au', viseme: 'E', weight: 1.1 },
  { pattern: 'eu', viseme: 'E', weight: 1.1 },      // /ø/ arrondi
  { pattern: 'oi', viseme: 'E', weight: 1.2 },      // /wa/ → rounded then open
  { pattern: 'ui', viseme: 'E', weight: 1.1 },
  // Consonant clusters
  { pattern: 'ch', viseme: 'B', weight: 0.8 },
  { pattern: 'ph', viseme: 'F', weight: 0.8 },
  { pattern: 'th', viseme: 'B', weight: 0.7 },
  { pattern: 'gn', viseme: 'B', weight: 0.9 },
  { pattern: 'qu', viseme: 'B', weight: 0.7 },
  { pattern: 'gu', viseme: 'B', weight: 0.7 },
  { pattern: 'll', viseme: 'H', weight: 0.8 },
  { pattern: 'ss', viseme: 'B', weight: 0.7 },
  { pattern: 'mm', viseme: 'A', weight: 0.9 },
  { pattern: 'nn', viseme: 'B', weight: 0.7 },
  { pattern: 'pp', viseme: 'A', weight: 0.7 },
  { pattern: 'bb', viseme: 'A', weight: 0.7 },
  { pattern: 'tt', viseme: 'B', weight: 0.7 },
  { pattern: 'rr', viseme: 'H', weight: 0.8 },
  // Single vowels
  { pattern: 'é', viseme: 'G', weight: 1.0 },       // /e/ étiré
  { pattern: 'è', viseme: 'G', weight: 1.0 },
  { pattern: 'ê', viseme: 'G', weight: 1.0 },
  { pattern: 'ë', viseme: 'G', weight: 1.0 },
  { pattern: 'à', viseme: 'D', weight: 1.1 },       // /a/ ouvert
  { pattern: 'â', viseme: 'D', weight: 1.1 },
  { pattern: 'î', viseme: 'G', weight: 1.0 },
  { pattern: 'ï', viseme: 'G', weight: 1.0 },
  { pattern: 'ô', viseme: 'E', weight: 1.0 },       // /o/ arrondi
  { pattern: 'ù', viseme: 'E', weight: 1.0 },
  { pattern: 'û', viseme: 'E', weight: 1.0 },
  { pattern: 'ü', viseme: 'E', weight: 1.0 },
  { pattern: 'a', viseme: 'C', weight: 1.0 },       // /a/ ouvert
  { pattern: 'e', viseme: 'B', weight: 0.5 },       // e muet = très court
  { pattern: 'i', viseme: 'G', weight: 0.9 },       // /i/ étiré
  { pattern: 'o', viseme: 'E', weight: 1.0 },       // /o/ arrondi
  { pattern: 'u', viseme: 'E', weight: 1.0 },       // /y/ très pincé (français!)
  { pattern: 'y', viseme: 'G', weight: 0.9 },
  // Single consonants
  { pattern: 'b', viseme: 'A', weight: 0.6 },       // bilabiale
  { pattern: 'p', viseme: 'A', weight: 0.6 },
  { pattern: 'm', viseme: 'A', weight: 0.7 },
  { pattern: 'f', viseme: 'F', weight: 0.7 },       // labiodentale
  { pattern: 'v', viseme: 'F', weight: 0.7 },
  { pattern: 'l', viseme: 'H', weight: 0.6 },
  { pattern: 'r', viseme: 'H', weight: 0.6 },       // R uvulaire
  { pattern: 'd', viseme: 'B', weight: 0.5 },
  { pattern: 't', viseme: 'B', weight: 0.5 },
  { pattern: 'n', viseme: 'B', weight: 0.5 },
  { pattern: 'k', viseme: 'B', weight: 0.5 },
  { pattern: 'g', viseme: 'B', weight: 0.5 },
  { pattern: 'c', viseme: 'B', weight: 0.5 },
  { pattern: 's', viseme: 'B', weight: 0.5 },
  { pattern: 'z', viseme: 'B', weight: 0.5 },
  { pattern: 'j', viseme: 'B', weight: 0.5 },
  { pattern: 'x', viseme: 'B', weight: 0.5 },
  { pattern: 'w', viseme: 'E', weight: 0.6 },
  { pattern: 'h', viseme: 'X', weight: 0.2 },       // h muet
];

function textToPhonemes(text: string): Phoneme[] {
  const lower = text.toLowerCase();
  const phonemes: Phoneme[] = [];
  let i = 0;
  
  while (i < lower.length) {
    const ch = lower[i];
    
    // Skip spaces → short silence
    if (ch === ' ' || ch === ',' || ch === '.' || ch === '!' || ch === '?' || ch === ';' || ch === ':') {
      const pauseWeight = (ch === ',' || ch === ';') ? 0.4 : (ch === '.' || ch === '!' || ch === '?') ? 0.6 : 0.15;
      phonemes.push({ viseme: 'X', weight: pauseWeight });
      i++;
      continue;
    }
    
    // Skip non-letter chars
    if (!/[a-zàâäéèêëïîôùûüÿçœæ]/.test(ch)) {
      i++;
      continue;
    }
    
    // Try longest match first
    let matched = false;
    for (const rule of FRENCH_GRAPHEMES) {
      const len = rule.pattern.length;
      if (i + len <= lower.length && lower.substring(i, i + len) === rule.pattern) {
        phonemes.push({ viseme: rule.viseme, weight: rule.weight });
        i += len;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      i++; // skip unknown char
    }
  }
  
  return phonemes;
}

export function generateFrenchVisemes(text: string, audioDuration: number): VisemeCue[] {
  const phonemes = textToPhonemes(text);
  if (phonemes.length === 0) return [];
  
  // Calculate total weight
  const totalWeight = phonemes.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return [];
  
  // Leave ~100ms of silence at start and end (TTS typically has small gaps)
  const startOffset = 0.08;
  const endPadding = 0.15;
  const activeDuration = Math.max(0.5, audioDuration - startOffset - endPadding);
  
  // Distribute time proportionally by weight
  const cues: VisemeCue[] = [];
  let currentTime = startOffset;
  
  for (const phoneme of phonemes) {
    const duration = (phoneme.weight / totalWeight) * activeDuration;
    const end = Math.min(currentTime + duration, audioDuration);
    
    // Merge consecutive same-viseme cues
    if (cues.length > 0 && cues[cues.length - 1].value === phoneme.viseme) {
      cues[cues.length - 1].end = end;
    } else {
      cues.push({
        start: Math.round(currentTime * 1000) / 1000,
        end: Math.round(end * 1000) / 1000,
        value: phoneme.viseme,
      });
    }
    
    currentTime = end;
  }
  
  // Add final silence if needed
  if (currentTime < audioDuration) {
    cues.push({
      start: Math.round(currentTime * 1000) / 1000,
      end: audioDuration,
      value: 'X',
    });
  }
  
  return cues;
}

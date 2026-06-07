import { Injectable, signal, computed } from '@angular/core';
import {
  Politician, GuessComparison, CompareResult,
  PARTY_FAMILY, STATE_REGION, POSITION_LEVEL_GROUP,
  RELIGION_GROUP, BERUF_GROUP, TITEL_GROUP,
} from '../models/politician.model';
import { POLITICIANS } from '../data/politicians';

export const MAX_GUESSES = 8;
export type GameMode = 'daily' | 'endless' | 'photo' | 'quote';

@Injectable({ providedIn: 'root' })
export class GameService {
  readonly allPoliticians = POLITICIANS;

  private readonly _mode = signal<GameMode>('daily');
  private readonly _targetPolitician = signal<Politician>(this.pickDailyPolitician());
  private readonly _guesses = signal<GuessComparison[]>([]);
  private readonly _gameOver = signal(false);
  private readonly _won = signal(false);
  private _lastRandomId: string | null = null;
  private readonly _round = signal(0);

  readonly mode = this._mode.asReadonly();
  readonly targetPolitician = this._targetPolitician.asReadonly();
  readonly guesses = this._guesses.asReadonly();
  readonly gameOver = this._gameOver.asReadonly();
  readonly won = this._won.asReadonly();
  readonly guessCount = computed(() => this._guesses().length);
  readonly remainingGuesses = computed(() => MAX_GUESSES - this._guesses().length);
  readonly endlessRound = this._round.asReadonly();

  readonly photoBlur = computed(() =>
    this._gameOver() ? 0 : Math.max(0, 24 - this._guesses().length * 3)
  );

  readonly nameHint = computed(() => {
    if (this._gameOver() || this.remainingGuesses() > 3) return null;
    const remaining = this.remainingGuesses();
    const words = this._targetPolitician().name.split(' ');
    // Return an array – one string per word – so the template can render
    // each word as a separate element with a clear visual gap between them.
    return words.map((word, wi) => {
      const revealFirst = wi === 0 && remaining <= 2;
      const revealLast  = wi === words.length - 1 && remaining <= 1;
      return word.split('').map((c, ci) =>
        (ci === 0 && (revealFirst || revealLast)) ? c : '_'
      ).join(' ');
    });
  });

  readonly knownAttributes = computed(() => {
    const guesses = this._guesses();
    if (guesses.length === 0) return null;
    const t = this._targetPolitician();
    return {
      party:      guesses.some(g => g.party === 'correct')    ? t.party    : null,
      state:      guesses.some(g => g.state === 'correct')    ? t.state    : null,
      position:   guesses.some(g => g.position === 'correct') ? t.position : null,
      gender:     guesses.some(g => g.gender === 'correct')   ? t.gender   : null,
      religion:   guesses.some(g => g.religion === 'correct') ? t.religion : null,
      beruf:      guesses.some(g => g.beruf === 'correct')    ? t.beruf    : null,
      titel:      guesses.some(g => g.titel === 'correct')    ? t.titel    : null,
      birthYear:  this.yearBounds(guesses, 'birthYear'),
      erstmandat: this.yearBounds(guesses, 'erstmandat'),
    };
  });

  private yearBounds(
    guesses: GuessComparison[],
    field: 'birthYear' | 'erstmandat',
  ): { display: string; isExact: boolean } {
    const dirField = field === 'birthYear' ? 'birthYearDirection' : 'erstmandatDirection';
    let lo = -Infinity, hi = Infinity;

    for (const g of guesses) {
      const result    = g[field];
      const direction = g[dirField];
      const year      = g.politician[field];

      if (result === 'correct') return { display: String(year), isExact: true };

      if (result === 'partial') {
        if (direction === 'higher') { lo = Math.max(lo, year + 1); hi = Math.min(hi, year + 5); }
        else                        { lo = Math.max(lo, year - 5); hi = Math.min(hi, year - 1); }
      } else {
        if (direction === 'higher') lo = Math.max(lo, year + 6);
        else                        hi = Math.min(hi, year - 6);
      }
    }

    let display: string;
    if (lo !== -Infinity && hi !== Infinity) display = `${lo}–${hi}`;
    else if (lo !== -Infinity)               display = `≥${lo}`;
    else if (hi !== Infinity)                display = `≤${hi}`;
    else                                     display = '?';

    return { display, isExact: false };
  }


  private pickDailyPolitician(): Politician {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return POLITICIANS[seed % POLITICIANS.length];
  }

  private pickRandomPolitician(pool: Politician[] = POLITICIANS): Politician {
    const filtered = pool.filter(p => p.id !== this._lastRandomId);
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    this._lastRandomId = pick.id;
    return pick;
  }

  private get quotablePool(): Politician[] {
    return POLITICIANS.filter(p => !!p.quote);
  }

  getFilteredPoliticians(query: string): Politician[] {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const guessedIds = new Set(this._guesses().map(g => g.politician.id));
    return POLITICIANS.filter(p =>
      !guessedIds.has(p.id) &&
      p.name.toLowerCase().includes(q)
    ).slice(0, 8);
  }

  submitGuess(politician: Politician): void {
    if (this._gameOver()) return;
    const comparison = this.compare(politician, this._targetPolitician());
    this._guesses.update(g => [...g, comparison]);

    if (comparison.isCorrect) {
      this._won.set(true);
      this._gameOver.set(true);
    } else if (this._guesses().length >= MAX_GUESSES) {
      this._gameOver.set(true);
    }
  }

  switchToDaily(): void {
    this._mode.set('daily');
    this._round.set(0);
    this.resetState(this.pickDailyPolitician());
  }

  switchToEndless(): void {
    this._mode.set('endless');
    this._lastRandomId = null;
    this._round.set(1);
    this.resetState(this.pickRandomPolitician());
  }

  switchToPhoto(): void {
    this._mode.set('photo');
    this._lastRandomId = null;
    this._round.set(1);
    this.resetState(this.pickRandomPolitician());
  }

  switchToQuote(): void {
    this._mode.set('quote');
    this._lastRandomId = null;
    this._round.set(1);
    this.resetState(this.pickRandomPolitician(this.quotablePool));
  }

  nextRound(): void {
    this._round.update(r => r + 1);
    const pool = this._mode() === 'quote' ? this.quotablePool : POLITICIANS;
    this.resetState(this.pickRandomPolitician(pool));
  }

  private resetState(target: Politician): void {
    this._guesses.set([]);
    this._gameOver.set(false);
    this._won.set(false);
    this._targetPolitician.set(target);
  }

  private compare(guess: Politician, target: Politician): GuessComparison {
    const partyResult: CompareResult =
      guess.party === target.party ? 'correct' :
      PARTY_FAMILY[guess.party] === PARTY_FAMILY[target.party] ? 'partial' : 'wrong';

    const stateResult: CompareResult =
      guess.state === target.state ? 'correct' :
      STATE_REGION[guess.state] === STATE_REGION[target.state] ? 'partial' : 'wrong';

    const positionResult: CompareResult =
      guess.position === target.position ? 'correct' :
      POSITION_LEVEL_GROUP[guess.position] === POSITION_LEVEL_GROUP[target.position] ? 'partial' : 'wrong';

    const yearDiff = guess.birthYear - target.birthYear;
    const birthYearResult: CompareResult =
      yearDiff === 0 ? 'correct' :
      Math.abs(yearDiff) <= 5 ? 'partial' : 'wrong';

    const genderResult: CompareResult = guess.gender === target.gender ? 'correct' : 'wrong';

    const religionResult: CompareResult =
      guess.religion === target.religion ? 'correct' :
      RELIGION_GROUP[guess.religion] === RELIGION_GROUP[target.religion] ? 'partial' : 'wrong';

    const berufResult: CompareResult =
      guess.beruf === target.beruf ? 'correct' :
      BERUF_GROUP[guess.beruf] === BERUF_GROUP[target.beruf] ? 'partial' : 'wrong';

    const titelResult: CompareResult =
      guess.titel === target.titel ? 'correct' :
      TITEL_GROUP[guess.titel] === TITEL_GROUP[target.titel] ? 'partial' : 'wrong';

    const mandatDiff = guess.erstmandat - target.erstmandat;
    const mandatResult: CompareResult =
      mandatDiff === 0 ? 'correct' :
      Math.abs(mandatDiff) <= 5 ? 'partial' : 'wrong';

    return {
      politician: guess,
      party: partyResult,
      state: stateResult,
      stateRegion: STATE_REGION[guess.state],
      position: positionResult,
      birthYear: birthYearResult,
      birthYearDirection: yearDiff === 0 ? 'exact' : yearDiff > 0 ? 'lower' : 'higher',
      birthYearDiff: Math.abs(yearDiff),
      gender: genderResult,
      religion: religionResult,
      beruf: berufResult,
      titel: titelResult,
      erstmandat: mandatResult,
      erstmandatDirection: mandatDiff === 0 ? 'exact' : mandatDiff > 0 ? 'lower' : 'higher',
      erstmandatDiff: Math.abs(mandatDiff),
      isCorrect: guess.id === target.id,
    };
  }
}

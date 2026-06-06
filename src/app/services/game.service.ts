import { Injectable, signal, computed } from '@angular/core';
import {
  Politician, GuessComparison, CompareResult,
  PARTY_FAMILY, STATE_REGION, POSITION_LEVEL_GROUP
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
      isCorrect: guess.id === target.id,
    };
  }
}

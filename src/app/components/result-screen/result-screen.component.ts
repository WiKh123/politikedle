import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-result-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-screen.component.html',
  styleUrls: ['./result-screen.component.scss'],
})
export class ResultScreenComponent {
  gameService = inject(GameService);

  get won() { return this.gameService.won(); }
  get target() { return this.gameService.targetPolitician(); }
  get guessCount() { return this.gameService.guessCount(); }
  get isEndless() { return this.gameService.mode() === 'endless'; }
  get round() { return this.gameService.endlessRound(); }

  nextRound(): void {
    this.gameService.nextEndlessRound();
  }

  shareResult(): void {
    const guesses = this.gameService.guesses();
    const emojiMap = { correct: '🟩', partial: '🟨', wrong: '⬛' };
    const lines = guesses.map(g =>
      [g.party, g.gender, g.state, g.position, g.birthYear]
        .map(r => emojiMap[r])
        .join('')
    );
    const mode = this.isEndless ? `Endlos Runde ${this.round}` : new Date().toLocaleDateString('de-DE');
    const text = `🇩🇪 Politikedle – ${mode}\n${this.won ? `✅ ${this.guessCount}/8` : '❌ X/8'}\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => alert('Ergebnis kopiert!'));
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { PoliticianImageComponent } from '../politician-image/politician-image.component';

@Component({
  selector: 'app-result-screen',
  standalone: true,
  imports: [CommonModule, PoliticianImageComponent],
  templateUrl: './result-screen.component.html',
  styleUrls: ['./result-screen.component.scss'],
})
export class ResultScreenComponent {
  gameService = inject(GameService);

  get won()       { return this.gameService.won(); }
  get target()    { return this.gameService.targetPolitician(); }
  get guessCount(){ return this.gameService.guessCount(); }
  get isEndless() { return this.gameService.mode() !== 'daily'; }
  get round()     { return this.gameService.endlessRound(); }
  get mode()      { return this.gameService.mode(); }

  nextRound(): void { this.gameService.nextRound(); }

  shareResult(): void {
    const guesses = this.gameService.guesses();
    const emojiMap = { correct: '🟩', partial: '🟨', wrong: '⬛' };
    const lines = guesses.map(g =>
      [g.party, g.gender, g.state, g.position, g.birthYear]
        .map(r => emojiMap[r]).join('')
    );
    const modeLabel =
      this.mode === 'daily'   ? new Date().toLocaleDateString('de-DE') :
      this.mode === 'endless' ? `Endlos R.${this.round}` :
      this.mode === 'photo'   ? `Foto R.${this.round}` :
                                `Zitat R.${this.round}`;
    const text = `🇩🇪 Politikedle – ${modeLabel}\n${this.won ? `✅ ${this.guessCount}/8` : '❌ X/8'}\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => alert('Ergebnis kopiert!'));
  }
}

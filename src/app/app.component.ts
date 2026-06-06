import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { SearchComponent } from './components/search/search.component';
import { GuessRowComponent } from './components/guess-row/guess-row.component';
import { ResultScreenComponent } from './components/result-screen/result-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SearchComponent, GuessRowComponent, ResultScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  gameService = inject(GameService);

  get guesses() { return this.gameService.guesses(); }
  get gameOver() { return this.gameService.gameOver(); }
  get mode() { return this.gameService.mode(); }
  get endlessRound() { return this.gameService.endlessRound(); }

  switchToDaily() { this.gameService.switchToDaily(); }
  switchToEndless() { this.gameService.switchToEndless(); }
}

import { Grid } from './Grid';
import { Tile } from './Tile';

export interface GameMetadata {
  score: number;
  over: boolean;
  won: boolean;
  bestScore: number;
  terminated: boolean;
}

export class HTMLActuator {
  tileContainer: Element | null;
  scoreContainer: Element | null;
  bestContainer: Element | null;
  messageContainer: Element | null;
  score: number = 0;

  constructor() {
    this.tileContainer = document.querySelector(".tile-container");
    this.scoreContainer = document.querySelector(".score-container");
    this.bestContainer = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");
  }

  actuate(grid: Grid, metadata: GameMetadata): void {
    if (typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      this.clearContainer(this.tileContainer);

      grid.cells.forEach((column) => {
        column.forEach((cell) => {
          if (cell) {
            this.addTile(cell);
          }
        });
      });

      this.updateScore(metadata.score);
      this.updateBestScore(metadata.bestScore);

      if (metadata.terminated) {
        if (metadata.over) {
          this.message(false); // You lose
        } else if (metadata.won) {
          this.message(true); // You win!
        }
      }
    });
  }

  // Continues the game (both restart and keep playing)
  continueGame(): void {
    this.clearMessage();
  }

  clearContainer(container: Element | null): void {
    if (!container) return;
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  addTile(tile: Tile): void {
    if (!this.tileContainer) return;

    const wrapper = document.createElement("div");
    const inner = document.createElement("div");
    const position = tile.previousPosition || { x: tile.x, y: tile.y };
    const positionClass = this.positionClass(position);

    // We can't use classlist because it somehow glitches when replacing classes
    const classes = ["tile", "tile-" + tile.value, positionClass];

    if (tile.value > 2048) classes.push("tile-super");

    this.applyClasses(wrapper, classes);

    inner.classList.add("tile-inner");

    // Replace text content with an image for specific tile values
    switch (tile.value) {
      case 2: 
        inner.innerHTML = '<img src="/games/2048/media/FeelsWeirdMan-4x.png" alt="2">';
        break;
      case 4:
        inner.innerHTML = '<img src="/games/2048/media/o7-4x.png" alt="4">';
        break;
      case 8:
        inner.innerHTML = '<img src="/games/2048/media/sus-4x.png" alt="8">';
        break;
      case 16:
        inner.innerHTML = '<img src="/games/2048/media/pfft-4x.png" alt="16">';
        break;
      case 32:
        inner.innerHTML = '<img src="/games/2048/media/CAUGHT-4x.png" alt="32">';
        break;
      case 64:
        inner.innerHTML = '<img src="/games/2048/media/MAJ-4x.png" alt="64">';
        break;
      case 128:
        inner.innerHTML = '<img src="/games/2048/media/monkaS-4x.png" alt="128">';
        break;
      case 256:
        inner.innerHTML = '<img src="/games/2048/media/monkaW-4x.png" alt="256">';
        break;
      case 512:
        inner.innerHTML = '<img src="/games/2048/media/ok-4x.png" alt="512">';
        break;
      case 1024:
        inner.innerHTML = '<img src="/games/2048/media/POGGERS-4x.png" alt="1024">';
        break;
      case 2048:
        inner.innerHTML = '<img src="/games/2048/media/OMEGALUL-4x.png" alt="2048">';
        break;
      case 4096:
        inner.innerHTML = '<img src="/games/2048/media/Chadge-4x.png" alt="4096">';
        break;
      case 8192:
        inner.innerHTML = '<img src="/games/2048/media/dosecat-4x.png" alt="8192">';
        break;
      case 16384:
        inner.innerHTML = '<img src="/games/2048/media/Ratge-4x.png" alt="16384">';
        break;
      case 32768:
        inner.innerHTML = '<img src="/games/2048/media/PepeClown-4x.png" alt="32768">';
        break;
      default:
        inner.textContent = tile.value.toString();
    }

    if (tile.previousPosition) {
      // Make sure that the tile gets rendered in the previous position first
      window.requestAnimationFrame(() => {
        classes[2] = this.positionClass({ x: tile.x, y: tile.y });
        this.applyClasses(wrapper, classes); // Update the position
      });
    } else if (tile.mergedFrom) {
      classes.push("tile-merged");
      this.applyClasses(wrapper, classes);

      // Render the tiles that merged
      tile.mergedFrom.forEach((merged) => {
        this.addTile(merged);
      });
    } else {
      classes.push("tile-new");
      this.applyClasses(wrapper, classes);
    }

    // Add the inner part of the tile to the wrapper
    wrapper.appendChild(inner);

    // Put the tile on the board
    this.tileContainer.appendChild(wrapper);
  }

  applyClasses(element: Element, classes: string[]): void {
    element.setAttribute("class", classes.join(" "));
  }

  normalizePosition(position: { x: number; y: number }): { x: number; y: number } {
    return { x: position.x + 1, y: position.y + 1 };
  }

  positionClass(position: { x: number; y: number }): string {
    const normalized = this.normalizePosition(position);
    return "tile-position-" + normalized.x + "-" + normalized.y;
  }

  updateScore(score: number): void {
    if (!this.scoreContainer) return;

    this.clearContainer(this.scoreContainer);

    const difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score.toString();

    if (difference > 0) {
      const addition = document.createElement("div");
      addition.classList.add("score-addition");
      addition.textContent = "+" + difference;

      this.scoreContainer.appendChild(addition);
    }
  }

  updateBestScore(bestScore: number): void {
    if (!this.bestContainer) return;
    this.bestContainer.textContent = bestScore.toString();
  }

  message(won: boolean): void {
    if (!this.messageContainer) return;

    const type = won ? "game-won" : "game-over";
    const message = won ? "Ganaste!" : "Perdiste!";

    this.messageContainer.classList.add(type);
    const pElement = this.messageContainer.getElementsByTagName("p")[0];
    if (pElement) {
      pElement.textContent = message;
    }
  }

  clearMessage(): void {
    if (!this.messageContainer) return;
    
    // IE only takes one value to remove at a time.
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
  }
}

import { Grid } from './Grid';
import { Tile } from './Tile';
import { KeyboardInputManager } from './KeyboardInputManager';
import { HTMLActuator } from './HTMLActuator';
import { LocalStorageManager } from './LocalStorageManager';

export interface GameState {
  grid: any;
  score: number;
  over: boolean;
  won: boolean;
  keepPlaying: boolean;
}

export class GameManager {
  size: number;
  inputManager: KeyboardInputManager;
  storageManager: LocalStorageManager;
  actuator: HTMLActuator;
  startTiles: number = 2;
  grid!: Grid;
  score: number = 0;
  over: boolean = false;
  won: boolean = false;
  keepPlaying: boolean = false;

  constructor(size: number, InputManager: typeof KeyboardInputManager, Actuator: HTMLActuator, StorageManager: typeof LocalStorageManager) {
    this.size = size;
    this.inputManager = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator = Actuator;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.continuePlaying.bind(this));

    this.setup();
  }

  // Reiniciar el juego
  restart(): void {
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Limpia el mensaje de ganar/perder
    this.setup();
  }

  // Seguir jugando tras ganar
  continuePlaying(): void {
    this.keepPlaying = true;
    this.actuator.continueGame(); // Limpia el mensaje de ganar/perder
  }

  // Verifica si el juego está terminado
  isGameTerminated(): boolean {
    return this.over || (this.won && !this.keepPlaying);
  }

  // Configura el juego (cargando estado anterior o iniciando uno nuevo)
  setup(): void {
    const previousState = this.storageManager.getGameState();

    if (previousState) {
      this.grid = new Grid(previousState.grid.size, previousState.grid);
      this.score = previousState.score;
      this.over = previousState.over;
      this.won = previousState.won;
      this.keepPlaying = previousState.keepPlaying;
    } else {
      this.grid = new Grid(this.size);
      this.score = 0;
      this.over = false;
      this.won = false;
      this.keepPlaying = false;
      this.addStartTiles();
    }

    this.actuate();
  }

  // Añade los primeros tiles
  addStartTiles(): void {
    for (let i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  }

  // Añade un tile en una posición aleatoria
  addRandomTile(): void {
    if (this.grid.cellsAvailable()) {
      const value = Math.random() < 0.9 ? 2 : 4;
      const cell = this.grid.randomAvailableCell();
      if (cell) {
        const tile = new Tile(cell, value);
        this.grid.insertTile(tile);
      }
    }
  }

  // Envía el estado actualizado al actuador y guarda el estado en el StorageManager
  actuate(): void {
    const bestScore = this.storageManager.getBestScore();
    
    // Si el juego terminó, se guarda el puntaje y se limpia el estado
    if (this.over || this.won) {
      if (this.storageManager.getBestScore() < this.score) {
        this.storageManager.setBestScore(this.score);
      }
      this.storageManager.clearGameState();
    } else {
      this.storageManager.setGameState(this.serialize());
    }

    this.actuator.actuate(this.grid, {
      score: this.score,
      over: this.over,
      won: this.won,
      bestScore: this.storageManager.getBestScore(),
      terminated: this.isGameTerminated()
    });
  }

  // Representa el estado actual del juego como un objeto
  serialize(): GameState {
    return {
      grid: this.grid.serialize(),
      score: this.score,
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlaying
    };
  }

  // Prepara los tiles, guardando sus posiciones y eliminando información de fusión
  prepareTiles(): void {
    this.grid.eachCell((x, y, tile) => {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }

  // Mueve un tile a una nueva celda y actualiza su posición
  moveTile(tile: Tile, cell: { x: number; y: number }): void {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }

  // Mueve los tiles en la dirección especificada
  move(direction: number): void {
    if (this.isGameTerminated()) return;

    let cell: { x: number; y: number };
    let tile: Tile | null;
    const vector = this.getVector(direction);
    const traversals = this.buildTraversals(vector);
    let moved = false;

    // Guarda las posiciones actuales y elimina información de fusión
    this.prepareTiles();

    // Recorre la grilla en la dirección correcta y mueve los tiles
    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        cell = { x, y };
        tile = this.grid.cellContent(cell);

        if (tile) {
          const positions = this.findFarthestPosition(cell, vector);
          const next = this.grid.cellContent(positions.next);

          // Si se puede fusionar, se crea un nuevo tile con el valor duplicado
          if (next && next.value === tile.value && !next.mergedFrom) {
            const merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];
            this.grid.insertTile(merged);
            this.grid.removeTile(tile);
            tile.updatePosition(positions.next);
            this.score += merged.value;
            if (merged.value === 2048) this.won = true;
          } else {
            this.moveTile(tile, positions.farthest);
          }

          if (!this.positionsEqual(cell, tile)) {
            moved = true;
          }
        }
      });
    });

    if (moved) {
      this.addRandomTile();

      if (!this.movesAvailable()) {
        this.over = true;
      }

      this.actuate();
    }
  }

  // Obtiene el vector de movimiento en función de la dirección
  getVector(direction: number): { x: number; y: number } {
    const map: { [key: number]: { x: number; y: number } } = {
      0: { x: 0, y: -1 }, // Arriba
      1: { x: 1, y: 0 },  // Derecha
      2: { x: 0, y: 1 },  // Abajo
      3: { x: -1, y: 0 }  // Izquierda
    };
    return map[direction];
  }

  // Construye un recorrido de celdas en el orden correcto para mover los tiles
  buildTraversals(vector: { x: number; y: number }): { x: number[]; y: number[] } {
    const traversals = { x: [] as number[], y: [] as number[] };

    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
  }

  // Encuentra la posición más alejada en la dirección dada hasta un obstáculo
  findFarthestPosition(cell: { x: number; y: number }, vector: { x: number; y: number }): { farthest: { x: number; y: number }; next: { x: number; y: number } } {
    let previous: { x: number; y: number };
    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

    return {
      farthest: previous,
      next: cell
    };
  }

  // Comprueba si hay movimientos disponibles
  movesAvailable(): boolean {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }

  // Comprueba si hay tiles que puedan fusionarse
  tileMatchesAvailable(): boolean {
    let tile: Tile | null;

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x, y });

        if (tile) {
          for (let direction = 0; direction < 4; direction++) {
            const vector = this.getVector(direction);
            const cell = { x: x + vector.x, y: y + vector.y };
            const other = this.grid.cellContent(cell);

            if (other && other.value === tile.value) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  // Compara dos posiciones
  positionsEqual(first: { x: number; y: number }, second: Tile): boolean {
    return first.x === second.x && first.y === second.y;
  }

}

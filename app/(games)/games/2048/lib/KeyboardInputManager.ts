export class KeyboardInputManager {
  events: { [key: string]: ((data?: any) => void)[] } = {};
  eventTouchstart: string;
  eventTouchmove: string;
  eventTouchend: string;

  constructor() {
    if (typeof window !== 'undefined' && (window.navigator as any).msPointerEnabled) {
      // Internet Explorer 10 style
      this.eventTouchstart = "MSPointerDown";
      this.eventTouchmove = "MSPointerMove";
      this.eventTouchend = "MSPointerUp";
    } else {
      this.eventTouchstart = "touchstart";
      this.eventTouchmove = "touchmove";
      this.eventTouchend = "touchend";
    }

    this.listen();
  }

  on(event: string, callback: (data?: any) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, data?: any): void {
    const callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data);
      });
    }
  }

  listen(): void {
    if (typeof window === 'undefined') return;

    const map: { [key: number]: number } = {
      38: 0, // Up
      39: 1, // Right
      40: 2, // Down
      37: 3  // Left
    };

    // Respond to direction keys
    document.addEventListener("keydown", (event) => {
      const modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                      event.shiftKey;
      const mapped = map[event.which];

      if (!modifiers) {
        if (mapped !== undefined) {
          event.preventDefault();
          this.emit("move", mapped);
        }
      }
    });

    // Respond to button presses
    this.bindButtonPress(".retry-button", this.restart);
    this.bindButtonPress(".restart-button", this.restart);
    this.bindButtonPress(".keep-playing-button", this.keepPlaying);

    // Respond to swipe events
    let touchStartClientX: number, touchStartClientY: number;
    const gameContainer = document.getElementsByClassName("game-container")[0];

    if (gameContainer) {
      gameContainer.addEventListener(this.eventTouchstart, (event: any) => {
        if ((!(window.navigator as any).msPointerEnabled && event.touches.length > 1) ||
            event.targetTouches.length > 1) {
          return; // Ignore if touching with more than 1 finger
        }

        if ((window.navigator as any).msPointerEnabled) {
          touchStartClientX = event.pageX;
          touchStartClientY = event.pageY;
        } else {
          touchStartClientX = event.touches[0].clientX;
          touchStartClientY = event.touches[0].clientY;
        }

        event.preventDefault();
      });

      gameContainer.addEventListener(this.eventTouchmove, (event: any) => {
        event.preventDefault();
      });

      gameContainer.addEventListener(this.eventTouchend, (event: any) => {
        if ((!(window.navigator as any).msPointerEnabled && event.touches.length > 0) ||
            event.targetTouches.length > 0) {
          return; // Ignore if still touching with one or more fingers
        }

        let touchEndClientX: number, touchEndClientY: number;

        if ((window.navigator as any).msPointerEnabled) {
          touchEndClientX = event.pageX;
          touchEndClientY = event.pageY;
        } else {
          touchEndClientX = event.changedTouches[0].clientX;
          touchEndClientY = event.changedTouches[0].clientY;
        }

        const dx = touchEndClientX - touchStartClientX;
        const absDx = Math.abs(dx);

        const dy = touchEndClientY - touchStartClientY;
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) > 10) {
          // (right : left) : (down : up)
          this.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
        }
      });
    }
  }

  restart = (event: Event): void => {
    event.preventDefault();
    this.emit("restart");
  };

  keepPlaying = (event: Event): void => {
    event.preventDefault();
    this.emit("keepPlaying");
  };

  bindButtonPress(selector: string, fn: (event: Event) => void): void {
    const button = document.querySelector(selector);
    if (button) {
      button.addEventListener("click", fn.bind(this));
      button.addEventListener(this.eventTouchend, fn.bind(this));
    }
  }
}

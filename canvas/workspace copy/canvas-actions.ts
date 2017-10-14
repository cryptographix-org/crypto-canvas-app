import { CanvasElement } from './canvas-element';

export class CanvasActions {
  canvas: CanvasElement;

  constructor(canvas: CanvasElement) {
    this.canvas = canvas;

  }

  unselectAll() {

  }

  selectNodes() {

  }

  selectLinks() {

  }

  selectAll() {

  }

  moveSelection() {

  }

  copySelection() {

  }

  deleteSelection() {

  }

  editSelection() {

  }

  importNodes() {

  }

  zoomViewport(zoom: number) {
    switch (zoom) {
      case -1:
      case 0:
      case +1:
        break;
    }

  }

  toggleShowGrid() {

  }

  toggleSnapGrid() {

  }

  undo() {

  }
}

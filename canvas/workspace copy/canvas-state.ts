import { NodeElement } from './node-element';
import { LinkElement } from './link-element';

export enum CanvasMode {
  IDLE,
  PANNING,
  LASSOING,
  MOVING,
  JOINING,
  MOVING_ACTIVE,
  IMPORT_DRAGGING, QUICK_JOINING,
}

export class CanvasState {
  private canvasMode: CanvasMode = CanvasMode.IDLE;

  get xmode(): CanvasMode {
    return this.canvasMode;
  }

  inMode(mode: CanvasMode) { return this.canvasMode == mode; }

  setMode(newMode: CanvasMode) {
    console.log("Mode <- " + CanvasMode[newMode]);

    this.canvasMode = newMode;
  }

  constructor() {
    this.clearSelection();
    //    this.resetState();
  }

  /**
  *  Selection
  **/
  hasSelection(): boolean {
    return (this.selectedNodes.length + this.selectedLinks.length) > 0;
  }

  selectedNodes: NodeElement[] = [];
  selectedLinks: LinkElement[] = [];
  dragLinks: any[] = [];

  clearSelection() {
    this.deselectNodes();

    this.deselectLinks();
  }

  selectNodes(nodes: NodeElement[]) {
    this.selectedNodes.push(...nodes);

    nodes.forEach((n) => {
      if (n) {
        n.selected = true;
        n.dirty = true;
      }
    });
  }

  deselectNodes(nodes?: any[]) {
    let des: any[] = [];

    if (nodes) {
      nodes.forEach((n) => {
        if (n && n.selected) {
          des.push(n);
        }
      });
    }
    else {
      des.push(...this.selectedNodes);
    }

    des.forEach((n) => {
      if (n) {
        n.selected = false;
        n.dirty = true;

        let i = this.selectedNodes.indexOf(n);

        if (i >= 0)
          this.selectedNodes.splice(i, 1);
      }
    });
  }

  selectLinks(links: LinkElement[]) {
    this.selectedLinks.push(...links);

    links.forEach((l) => {
      if (l) {
        l.selected = true;
      }
    });
  }

  deselectLinks(links?: any[]) {
    let des: any[] = [];

    if (links) {
      links.forEach((l) => {
        if (l && l.selected) {
          des.push(l);
        }
      });
    }
    else {
      des.push(...this.selectedLinks);
    }

    des.forEach((l) => {
      let i = this.selectedLinks.indexOf(l);

      l.selected = false;

      if (i >= 0)
        this.selectedLinks.splice(i, 1);
    });
  }

  setDragLinks(dragLinks) {
    this.dragLinks = dragLinks;
  }


  /**
  *  Mouse and Touch
  **/
  mousePosition: [number, number];
  mouseDownNode: NodeElement;

  mouseDownPoint: [number, number];

  resetMouse() {
    this.mousePosition = undefined;
    this.mouseDownPoint = undefined;
    this.mouseDownNode = undefined;
    /*    this.activeSpliceLink = null;

        this.spliceActive = false;
        d3.select(".link_splice").classed("link_splice", false);
        if (this.spliceTimer) {
          clearTimeout(this.spliceTimer);
          this.spliceTimer = null;
        }
*/
  }

  setMousePosition(point: [number, number]): [number, number] {
    this.mousePosition = point;
    console.log("pos: " + point);

    return point;
  }

  get isMouseDown(): boolean {
    return (this.mouseDownPoint != undefined);
  }
  saveMousePosition(point: [number, number]) {
    this.mouseDownPoint = point;

    console.log("start: " + point);
  }

  private clickElapsed;
  private clickTime;
  private dblClickPrimed;
  nodeMouseDown(node: NodeElement) {
    var now = Date.now();

    this.clickElapsed = now - this.clickTime;
    this.clickTime = now;

    this.dblClickPrimed = (this.mouseDownNode == node);
    this.mouseDownNode = node;
  }

  nodeMouseUp(node: NodeElement): boolean {
    let isDblClick = (this.dblClickPrimed && this.mouseDownNode == node && this.clickElapsed > 0 && this.clickElapsed < 750);

    this.clickElapsed = 0;

    return isDblClick;
  }

  linkMouseDown(d: LinkElement) {

  }

  touchStartTime = 0;
  startTouchDistance;
  startTouchCenter;
  touchLongPressTimeout;
  startTouch(center: any, f: () => void) {
    if (center) {
      this.startTouchCenter = center;
      this.startTouchDistance = 0;
    }

    this.touchStartTime = setTimeout(function() {
      this.touchStartTime = null;
      f();
    }, this.touchLongPressTimeout);
  }

  endTouch() {
    clearTimeout(this.touchStartTime);
    this.touchStartTime = null;
  }

  get touchStarted(): boolean {
    return (this.touchStartTime != 0);
  }

}

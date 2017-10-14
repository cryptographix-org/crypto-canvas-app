import { NodeElement } from './node-element';
import { LinkElement } from './link-element';
import { GraphStore, NodeMap, LinkMap } from './graph-store';

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

  inMode(mode: CanvasMode) { return this.canvasMode == mode; }
  inModes(modes: CanvasMode[]) { return modes.some((m) => { return this.canvasMode == m; }) }

  setMode(newMode: CanvasMode) {
    console.log("Mode <- " + CanvasMode[newMode]);

    this.canvasMode = newMode;
  }

  constructor(public graph: GraphStore) {

    this.clearSelection();
    this.resetMouse();
  }

  /**
  *  Selection
  **/
  hasSelection(): boolean {
    return (this.selectedNodes.size + this.selectedLinks.size) > 0;
  }

  selectedNodes: NodeMap = new Map<string, NodeElement>();
  selectedLinks: LinkMap = new Map<string, LinkElement>();
  dragLinks: any[] = [];

  clearSelection() {
    this.deselectNodes();

    this.deselectLinks();
  }

  selectNodes(nodes: NodeElement[]) {
    nodes.forEach((n) => {
      if (n) {
        this.selectedNodes.set(n.id, n);

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
      des = Array.from(this.selectedNodes.values());
    }

    des.forEach((n) => {
      if (n) {
        n.selected = false;
        n.dirty = true;

        this.selectedNodes.delete(n.id);
      }
    });
  }

  selectLinks(links: LinkElement[]) {
    links.forEach((l) => {
      if (l) {
        l.selected = true;
        this.selectedLinks.set(l.id, l);
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
      des = Array.from(this.selectedLinks.values());
    }

    des.forEach((l) => {
      if (l) {
        l.selected = false;
        this.selectedLinks.delete(l.id);
      }
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
    //    console.log("pos: " + point);

    return point;
  }

  get isMouseDown(): boolean {
    return (this.mouseDownPoint != undefined);
  }
  saveMousePosition(point: [number, number]) {
    this.mouseDownPoint = point;

    //    console.log("start: " + point);
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

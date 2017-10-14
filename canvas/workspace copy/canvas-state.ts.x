import { NodeElement, NodeInfo } from './node';
import { LinkInfo } from './link';
import * as d3 from 'd3';

export enum MODE {
  DEFAULT,
  MOVING,
  MOVING_ACTIVE,
  IMPORT_DRAGGING,
  JOINING,
  QUICK_JOINING,
}

export class CanvasState {
  _mouseMode: MODE = MODE.DEFAULT;
  get mouseMode(): MODE { return this._mouseMode };
  setMouseMode(mouseMode: MODE) {
    this._mouseMode = mouseMode;
  }

  private lastClickNode = null;
  private dblClickPrimed = null;
  private clickTime = 0;
  private clickElapsed = 0;


  touchLongPressTimeout = 1000;
  startTouchDistance = 0;
  startTouchCenter = [];
  moveTouchCenter = [];
  touchStartTime = 0;

  mousedown_node = null;
  selected_link = null;
  mousedown_link = null;
  mousedown_port_type = null;
  mousedown_port_index = 0;
  moving_set = [];

  nodeMouseDown(d: NodeInfo) {
    var now = Date.now();

    this.mousedown_node = d;

    this.clickElapsed = now - this.clickTime;
    this.clickTime = now;

    this.dblClickPrimed = (this.lastClickNode == this.mousedown_node);
    this.lastClickNode = this.mousedown_node;
  }

  nodeMouseUp(d: NodeInfo): boolean {
    let isDblClick = (this.dblClickPrimed && this.mousedown_node == d && this.clickElapsed > 0 && this.clickElapsed < 750);

    this.clickElapsed = 0;

    return isDblClick;
  }

  linkMouseDown(d: LinkInfo) {

  }

  touchStarted(): boolean {
    return (this.touchStartTime != 0);
  }

  private mouse_position: number[] = null;
  get mousePosition(): number[] {
    return this.mouse_position;
  }
  set mousePosition(p: number[]) {
    this.mouse_position = p;
  }

  private mouse_offset: number[] = [0, 0];
  get mouseOffset(): number[] {
    return this.mouse_offset;
  }
  set mouseOffset(p: number[]) {
    this.mouse_offset = p;
  }

  activeSpliceLink;
  spliceActive = false;
  spliceTimer;


  resetMouseVars() {
    this.mousedown_node = null;
    this.mousedown_link = null;
    this.setMouseMode(MODE.DEFAULT);
    //    this.mousedown_port_type = PORT_TYPE_OUTPUT;
    this.activeSpliceLink = null;

    this.spliceActive = false;
    d3.select(".link_splice").classed("link_splice", false);
    if (this.spliceTimer) {
      clearTimeout(this.spliceTimer);
      this.spliceTimer = null;
    }
  }

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
}

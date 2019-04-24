import { NodeElement } from "./node-element";
import { LinkElement } from "./link-element";

import * as d3 from "d3";

type Point = [number, number];

/**
 * Mouse and Touch
 **/
export class PointerHelper {
  constructor() {
    this.resetPointer();
  }

  eventToPoint(event): Point {
    return d3.touches(event)[0] || d3.mouse(event);
  }

  mousePosition: Point;
  mouseDownNode: NodeElement;

  originPoint: Point;

  resetPointer() {
    this.mousePosition = undefined;
    this.originPoint = undefined;
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

  setMousePosition(point: Point): Point {
    this.mousePosition = point;
    //    console.log("pos: " + point);

    return point;
  }

  get hasOriginPoint(): boolean {
    return this.originPoint != undefined;
  }

  setOriginPoint(point: Point) {
    this.originPoint = point;

    //    console.log("start: " + point);
  }

  distanceFromOrigin(point: Point): number {
    return (
      (this.originPoint[0] - point[0]) * (this.originPoint[0] - point[0]) +
      (this.originPoint[1] - point[1]) * (this.originPoint[1] - point[1])
    );
  }

  private clickElapsed;
  private clickTime;
  private dblClickPrimed;
  nodeMouseDown(node: NodeElement) {
    var now = Date.now();

    this.clickElapsed = now - this.clickTime;
    this.clickTime = now;

    this.dblClickPrimed = this.mouseDownNode == node;
    this.mouseDownNode = node;
  }

  nodeMouseUp(node: NodeElement): boolean {
    let isDblClick =
      this.dblClickPrimed &&
      this.mouseDownNode == node &&
      this.clickElapsed > 0 &&
      this.clickElapsed < 750;

    this.clickElapsed = 0;

    return isDblClick;
  }

  linkMouseDown(d: LinkElement) {}

  touchStartTime = null;
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
    return this.touchStartTime != 0;
  }
}

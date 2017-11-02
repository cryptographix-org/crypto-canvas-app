import { Workspace } from '.';
import { PointerHelper } from './pointer-helper';
import { CanvasState, CanvasMode, getTestGraph } from './canvas-state';
import { CanvasActions } from './canvas-actions';
import { NodeElement, NodeInfo, PORT_TYPE_OUTPUT, PORT_TYPE_INPUT, node_width, node_height } from './node-element';
import { LinkElement, LinkInfo } from './link-element';

import * as d3 from 'd3';
import * as $ from 'jquery';

export interface D3Selection extends d3.Selection<SVGElement, any, any, any> { };

const space_width = 5000,
  space_height = 5000,
  lineCurveScale = 0.75,
  scaleFactor = 1;

export class CanvasElement {
  private element: HTMLElement;

  private outer: D3Selection;
  public vis: D3Selection;
  private outer_background: D3Selection;
  private grid: D3Selection;
  private dragGroup: D3Selection;

  public readonly state: CanvasState;
  public readonly pointer: PointerHelper = new PointerHelper();

  public snapGrid: boolean = false;
  public gridSize: number = 20;

  public showNodeStatus: boolean;

  renderCanvas() {
    let svg = this.outer = d3.select(this.element)
      .append<SVGElement>("svg:svg")
      .attr("width", space_width)
      .attr("height", space_height)
      .attr("pointer-events", "all")
      .style("cursor", "crosshair")
      .on("mousedown", () => this.focusView());

    let vis = this.vis = svg
      .append<SVGElement>("svg:g")
      .on("dblclick.zoom", null)
      .append<SVGElement>("svg:g")
      .attr('class', 'innerCanvas')
      .on("mousemove", () => this.mouseMove(d3.event.currentTarget))
      .on("mousedown", () => this.mouseDown(d3.event.currentTarget))
      .on("mouseup", () => this.mouseUp(d3.event.currentTarget))
      .on("dropped", () => { this.dropNode(d3.event.currentTarget) })

    this.outer_background = vis.append<SVGElement>("svg:rect")
      .attr("width", space_width)
      .attr("height", space_height)
      .attr("fill", "#fff");

    this.grid = vis.append("g");

    this.dragGroup = vis.append("g");
  }

  dropHelper: HTMLElement;
  saveDropHelper(helper: HTMLElement) {
    // Save drag origem
    this.dropHelper = helper;
    let data = $(this.dropHelper).data('component-id');
    console.log(data);
  }

  dropNode(target) {
    let evt = d3.event;

    let type = $(evt.relatedTarget).find('.palette-node-name').text();
    if (!type)
      type = $(evt.fromElement).find('.palette-node-name').text();

    let data = $(this.dropHelper).data('component-id');
    console.log(data);

    let defn = this.workspace.registry.getByID(data);

    var nn = this.state.addNode(defn);

    var helperOffset = this.pointer.eventToPoint(this.dropHelper);
    var mousePos = this.pointer.eventToPoint(target);

    mousePos[1] += target.scrollTop + ((nn.h / 2) - helperOffset[1]);
    mousePos[0] += target.scrollLeft + ((nn.w / 2) - helperOffset[0]);
    mousePos[1] /= this.scaleFactor;
    mousePos[0] /= this.scaleFactor;

    if (this.snapGrid) {
      mousePos[0] = this.gridSize * (Math.ceil(mousePos[0] / this.gridSize));
      mousePos[1] = this.gridSize * (Math.ceil(mousePos[1] / this.gridSize));
    }
    nn.x = mousePos[0];
    nn.y = mousePos[1];

    if (nn._def.button)
      nn.x += 20;

    // auto select dropped node - so info shows (if visible)
    this.state.clearSelection();
    nn.selected = true;
    this.state.selectNodes([nn]);
    this.redraw();
  }

  constructor(public workspace: Workspace, element: HTMLElement) {
    this.element = element;

    this.state = new CanvasState(this, getTestGraph());

    this.actions = new CanvasActions(this);

    this.renderCanvas();

    this.updateGrid();
    this.grid.style("visibility", "visible");

    this.redraw();

    // Handle nodes dragged from the palette
    let canvas = this;
    $(this.element).droppable({
      accept: ".palette-node",
      drop: function(event, ui: JQueryUI.DroppableEventUIParam) {
        let me = ((event as any).originalEvent).originalEvent as MouseEvent;

        let p: MouseEventInit = Object.assign({}, {
          clientX: ui.position.left,
          clientY: ui.position.top,
          relatedTarget: ui.draggable.get(0),
        } as {});

        canvas.saveDropHelper(ui.helper.get(0));

        // Send me a 'dropped' event, so that D3 can handle mouse position
        let evt = new MouseEvent('dropped', p);
        d3.select(canvas.element).select<HTMLElement>('.innerCanvas').node().dispatchEvent(evt);

        return true;
      }
    });
  }

  public actions: CanvasActions;

  focusView() {
    try {
      // Workaround for browser unexpectedly scrolling iframe into full
      // view - record the parent scroll position and restore it after
      // setting the focus
      var scrollX = window.parent.window.scrollX;
      var scrollY = window.parent.window.scrollY;
      $(this.element).focus();
      window.parent.window.scrollTo(scrollX, scrollY);
    } catch (err) {
      // In case we're iframed into a page of a different origin, just focus
      // the view following the inevitable DOMException
      $(this.element).focus();
    }
  }

  touchStart() {

  }
  touchEnd() {

  }

  mouseDown(target: d3.ContainerElement) {
    let pointer = this.pointer;

    var point = this.pointer.eventToPoint(target);

    let state = this.state;

    // Remove existing lasso
    if (state.inMode(CanvasMode.LASSOING)) {
      this.endLasso(true);
    }

    if (state.inMode(CanvasMode.IDLE) && !(d3.event.metaKey || d3.event.ctrlKey)) {
      if (!pointer.touchStarted) {
        pointer.setOriginPoint(point);

        this.beginLasso(point);
        d3.event.preventDefault();

        return;
      }
    }

    state.setMode(CanvasMode.IDLE);

    this.redraw();
  }

  mouseMove(target: d3.ContainerElement) {
    var point = this.pointer.eventToPoint(target);

    var node;

    let state = this.state;

    let mousePos = this.pointer.setMousePosition(point);

    //console.log(point);
    // Prevent touch scrolling...
    //if (d3.touches(this)[0]) {
    //    d3.event.preventDefault();
    //}

    // TODO: auto scroll the container
    //var point = d3.mouse(this);
    //if (point[0]-container.scrollLeft < 30 && container.scrollLeft > 0) { container.scrollLeft -= 15; }
    //console.log(d3.mouse(this),container.offsetWidth,container.offsetHeight,container.scrollLeft,container.scrollTop);

    if (state.inMode(CanvasMode.LASSOING)) {

      this.updateLasso(mousePos);
      return;
    }

    if (state.inMode(CanvasMode.JOINING) && this.pointer.mouseDownNode) {

      if (state.dragLinks.length === 0) {
        this.beginJoin();
      }

      this.updateDragLines(mousePos);

      d3.event.preventDefault();
    }

    if (!state.hasSelection()) {
      return;
    }

    if (this.state.inMode(CanvasMode.MOVING)) {

      if (!this.pointer.hasOriginPoint)
        this.pointer.setOriginPoint(mousePos);

      // let mousePos = d3.mouse(document.body);
      // if (isNaN(mousePos[0])) {
      //   mousePos = d3.touches(document.body)[0];
      // }

      let d = this.pointer.distanceFromOrigin(mousePos);

      console.log(mousePos);
      console.log(this.pointer.originPoint);

      if (d > 3) {
        state.setMode(CanvasMode.MOVING_ACTIVE);
        //@SMW state.clickElapsed = 0;
      }
    }
    else if (state.inModes([CanvasMode.MOVING_ACTIVE, CanvasMode.IMPORT_DRAGGING])) {
      let mousePos = this.pointer.mousePosition;

      var minX = 0;
      var minY = 0;
      var maxX = space_width;
      var maxY = space_height;

      // find max and min { x,y }
      state.selectedNodes.forEach((node) => {

        if (d3.event.shiftKey) {
          node.ox = node.x;
          node.oy = node.y;
        }

        node.x = mousePos[0] + node.dx;
        node.y = mousePos[1] + node.dy;
        node.dirty = true;

        minX = Math.min(node.x - node.w / 2 - 5, minX);
        minY = Math.min(node.y - node.h / 2 - 5, minY);
        maxX = Math.max(node.x + node.w / 2 + 5, maxX);
        maxY = Math.max(node.y + node.h / 2 + 5, maxY);
      });

      if (minX !== 0 || minY !== 0) {
        state.selectedNodes.forEach((node) => {
          node.x -= minX;
          node.y -= minY;
        });
      }

      if (maxX !== space_width || maxY !== space_height) {
        state.selectedNodes.forEach((node) => {
          node.x -= (maxX - space_width);
          node.y -= (maxY - space_height);
        });
      }

      if (this.snapGrid != d3.event.shiftKey && state.selectedNodes.size > 0) {
        var gridOffset = [0, 0];

        node = state.selectedNodes[0];

        gridOffset[0] = node.x - (this.gridSize * Math.floor((node.x - node.w / 2) / this.gridSize) + node.w / 2);
        gridOffset[1] = node.y - (this.gridSize * Math.floor(node.y / this.gridSize));

        if (gridOffset[0] !== 0 || gridOffset[1] !== 0) {
          state.selectedNodes.forEach((node) => {
            node.x -= gridOffset[0];
            node.y -= gridOffset[1];

            if (node.x == node.ox && node.y == node.oy) {
              node.dirty = false;
            }
          });
        }
      }
    }

    if (!state.inMode(CanvasMode.IDLE)) {
      this.redraw();
    }
  }

  mouseUp(target: d3.ContainerElement) {
    let state = this.state;

    // cleanup Joining, Lassoing and Selecting
    if (state.inMode(CanvasMode.JOINING)) {
      this.endJoin(true);
    }
    else if (state.inMode(CanvasMode.LASSOING)) {
      this.endLasso(false);
    }
    else if (state.inMode(CanvasMode.IDLE) && state.hasSelection() && !d3.event.ctrlKey && !d3.event.metaKey) {
      state.clearSelection();
    }

    // Move selected nodes
    if (state.inModes([CanvasMode.MOVING_ACTIVE, CanvasMode.IMPORT_DRAGGING])) {
      var ns = [];

      state.selectedNodes.forEach((n) => {
        if (n.ox !== n.x || n.oy !== n.y) {
          ns.push({ n: n, ox: n.ox, oy: n.oy, moved: n.moved });
          n.dirty = true;
          n.moved = true;
        }
      });

      if (ns.length > 0) {
        //        RED.nodes.dirty(true);
      }
    }

    this.pointer.resetPointer();
    this.redraw();
  }

  showDragLines(dragLines: any[]) {
    this.state.clearSelection();

    for (let i = 0; i < dragLines.length; i++) {
      var dragLine = dragLines[i];

      dragLine.el = this.dragGroup.append("svg:path").attr("class", "drag_line");
    }

    this.state.setDragLinks(dragLines);
  }

  updateDragLines(mousePos) {
    let state = this.state;

    for (let i = 0; i < state.dragLinks.length; i++) {
      var drag_line = state.dragLinks[i];
      var numOutputs = (drag_line.portType === PORT_TYPE_OUTPUT) ? (drag_line.node.outputs || 1) : 1;
      var sourcePort = drag_line.portIndex;
      var portY = -((numOutputs - 1) / 2) * 13 + 13 * sourcePort;

      var sc = (drag_line.portType === PORT_TYPE_OUTPUT) ? 1 : -1;

      var dy = mousePos[1] - (drag_line.node.y + portY);
      var dx = mousePos[0] - (drag_line.node.x + sc * drag_line.node.w / 2);
      var delta = Math.sqrt(dy * dy + dx * dx);
      var scale = lineCurveScale;
      var scaleY = 0;

      if (delta < node_width) {
        scale = 0.75 - 0.75 * ((node_width - delta) / node_width);
      }
      if (dx * sc < 0) {
        scale += 2 * (Math.min(5 * node_width, Math.abs(dx)) / (5 * node_width));
        if (Math.abs(dy) < 3 * node_height) {
          scaleY = ((dy > 0) ? 0.5 : -0.5) * (((3 * node_height) - Math.abs(dy)) / (3 * node_height)) * (Math.min(node_width, Math.abs(dx)) / (node_width));
        }
      }

      drag_line.el.attr("d",
        "M " + (drag_line.node.x + sc * drag_line.node.w / 2) + " " + (drag_line.node.y + portY) +
        " C " + (drag_line.node.x + sc * (drag_line.node.w / 2 + node_width * scale)) + " " + (drag_line.node.y + portY + scaleY * node_height) + " " +
        (mousePos[0] - sc * (scale) * node_width) + " " + (mousePos[1] - scaleY * node_height) + " " +
        mousePos[0] + " " + mousePos[1]
      );
    }
  }
  hideDragLines() {
    let links = this.state.dragLinks;

    while (links.length) {
      var line = links.pop();
      if (line.el) {
        line.el.remove();
      }
    }
  }

  beginJoin() {
    let state = this.state;

    let downNode = this.pointer.mouseDownNode;

    // detach wires?
    if (d3.event.shiftKey) {
      var existingLinks: LinkElement[] = [];
      var lines = [];

      // Get all the wires we need to detach.

      // Scope search to ALL or SELECTED
      let links = state.links;
      if (state.selectedLinks.size)
        links = Array.from(state.selectedLinks.values());

      links.forEach((link) => {
        let ok = false;

        if (downNode.downPortType === PORT_TYPE_OUTPUT) {
          ok = (link.source == downNode) && (link.sourcePort == downNode.downPortIndex);
        } else {
          ok = (link.target == downNode);// && (link.sourcePort == downNode.downPortIndex);
        }

        if (ok)
          existingLinks.push(link);
      })

      for (let i = 0; i < existingLinks.length; i++) {
        let link = existingLinks[i];

        state.deleteLinks([link]);

        lines.push({
          link: link,
          node: (downNode.downPortType === PORT_TYPE_OUTPUT) ? link.target : link.source,
          portIndex: (downNode.downPortType === PORT_TYPE_OUTPUT) ? 0 : link.sourcePort,
          portType: (downNode.downPortType === PORT_TYPE_OUTPUT) ? PORT_TYPE_INPUT : PORT_TYPE_OUTPUT
        })
      }

      if (links.length === 0) {
        this.pointer.resetPointer();
        this.redraw();
      } else {
        this.showDragLines(lines);

        state.setMode(CanvasMode.IDLE);
        this.redraw();
        state.setMode(CanvasMode.JOINING);
      }
    }
    else if (downNode) {
      this.showDragLines([{ node: downNode, portType: downNode.downPortType, portIndex: downNode.downPortIndex }]);
    }

    state.deselectLinks();
  }

  endJoin(cancel: boolean) {
    var removedLinks = [];

    for (let i = 0; i < this.state.dragLinks.length; i++) {
      if (this.state.dragLinks[i].link) {
        removedLinks.push(this.state.dragLinks[i].link)
      }
    }

    this.hideDragLines();
    this.state.clearSelection();

    this.state.setMode(CanvasMode.IDLE);
  }

  private _lasso: D3Selection;
  beginLasso(point) {
    let lasso = this._lasso = this.vis.append<SVGElement>("rect")
      .attr("ox", point[0])
      .attr("oy", point[1])
      .attr("rx", 1)
      .attr("ry", 1)
      .attr("x", point[0])
      .attr("y", point[1])
      .attr("width", 0)
      .attr("height", 0)
      .attr("class", "lasso");

    this.state.setMode(CanvasMode.LASSOING);
  }

  updateLasso(mousePos) {
    let lasso = this._lasso;

    var ox = parseInt(lasso.attr("ox"));
    var oy = parseInt(lasso.attr("oy"));
    var x = parseInt(lasso.attr("x"));
    var y = parseInt(lasso.attr("y"));
    var w;
    var h;

    if (mousePos[0] < ox) {
      x = mousePos[0];
      w = ox - x;
    } else {
      w = mousePos[0] - x;
    }

    if (mousePos[1] < oy) {
      y = mousePos[1];
      h = oy - y;
    } else {
      h = mousePos[1] - y;
    }

    lasso
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h);
  }

  endLasso(cancel: boolean) {
    let lasso = this._lasso;
    let state = this.state;

    if (!cancel) {

      var x = parseInt(lasso.attr("x"));
      var y = parseInt(lasso.attr("y"));
      var x2 = x + parseInt(lasso.attr("width"));
      var y2 = y + parseInt(lasso.attr("height"));
      if (!d3.event.ctrlKey) {
        state.clearSelection();
      }

      let nodes = this.vis.selectAll<SVGElement, NodeElement>(".nodegroup")
        .filter((n: NodeElement, i) => {
          return !n.selected && (n.x > x && n.x < x2 && n.y > y && n.y < y2);
        });

      state.selectNodes(nodes.data());
    }

    lasso.remove();
    this._lasso = null;

    state.setMode(CanvasMode.IDLE);
  }

  scaleFactor = 1;

  redraw() {
    function isButtonEnabled(d: NodeInfo) { return false; }

    this.vis.attr("transform", "scale(" + this.scaleFactor + ")");
    this.outer.attr("width", space_width * this.scaleFactor).attr("height", space_height * this.scaleFactor);

    if (!this.state.inMode(CanvasMode.JOINING)) {

      let nodes = this.vis.selectAll<SVGElement, NodeElement>(".nodegroup")
        .data(this.state.nodes, (d) => d ? d.id : null);

      var dirtyNodes = {};

      // Delete the missing ones
      nodes.exit().remove();

      if (!nodes.enter().empty()) {
        let newNodes = nodes.enter()
          .insert<SVGElement>("svg:g")
          .attr("class", "node nodegroup");

        newNodes.each(function(d, i) {
          d.renderElement(this)
        });

        nodes = newNodes.merge(nodes);
      }

      // and update all nodes
      nodes.each(function(node, i) {

        if (node.dirty) {
          dirtyNodes[node.id] = node;
        }

        node.updateElement(this);

        node.dirty = false;
      });

      var links = this.vis.selectAll<SVGElement, LinkInfo>(".link")
        .data(this.state.links, (link) => link ? link.id : null);

      // Delete the missing ones
      links.exit().remove();

      if (!links.enter().empty()) {
        let newLinks = links.enter()
          .insert<SVGElement>("svg:g", ".node")
          .attr("class", "link");

        // Map 'link-info' data into new LinkElements
        newLinks.each(function(link, i) {
          link.renderElement(this);
        });

        links = newLinks.merge(links);
      }

      links.each(function(d: LinkElement) {

        d.updateLink(this, dirtyNodes[d.source.id] || dirtyNodes[d.target.id]);
      });
    }
    else {
      // JOINING - unselect any selected links

      //this.vis.selectAll(".link_selected").classed("link_selected", false);
    }

    if (d3.event) {
      d3.event.preventDefault();
    }
  }

  updateGrid() {
    let grid = this.grid;

    var gridTicks = [];
    for (var i = 0; i < space_width; i += +this.gridSize) {
      gridTicks.push(i);
    }
    grid.selectAll("line.horizontal").remove();
    grid.selectAll("line.horizontal").data(gridTicks).enter()
      .append("line")
      .attr("class", "horizontal")
      .attr("x1", 0)
      .attr("x2", space_width)
      .attr("y1", (d: number) => d)
      .attr("y2", (d: number) => d)
      .attr("fill", "none")
      .attr("shape-rendering", "crispEdges")
      .attr("stroke", "#eee")
      .attr("stroke-width", "1px");
    grid.selectAll("line.vertical").remove();
    grid.selectAll("line.vertical").data(gridTicks).enter()
      .append("line")
      .attr("class", "vertical")
      .attr("x1", (d: number) => d)
      .attr("x2", (d: number) => d)
      .attr("y1", 0)
      .attr("y2", space_width)
      .attr("fill", "none")
      .attr("shape-rendering", "crispEdges")
      .attr("stroke", "#eee")
      .attr("stroke-width", "1px");
  }

  zoomViewport(zoom: number) {
    switch (zoom) {
      case -1:
        if (this.scaleFactor > 0.3) {
          this.scaleFactor -= 0.1;
        }
        break;

      case 0:
        this.scaleFactor = 1;
        break;

      case 1:
        if (this.scaleFactor < 2) {
          this.scaleFactor += 0.1;
        }
        break;
    }
    this.redraw();
  }

  static calcMinMaxForNodeset(nodes: NodeElement[], mousePos) {
    var minX = 0;
    var minY = 0;
    var maxX = space_width;
    var maxY = space_height;

    // find max and min { x,y }
    nodes.forEach((node) => {

      if (d3.event.shiftKey) {
        node.ox = node.x;
        node.oy = node.y;
      }

      node.x = mousePos[0] + (node.dx || 0);
      node.y = mousePos[1] + (node.dy || 0);
      node.dirty = true;

      minX = Math.min(node.x - node.w / 2 - 5, minX);
      minY = Math.min(node.y - node.h / 2 - 5, minY);
      maxX = Math.max(node.x + node.w / 2 + 5, maxX);
      maxY = Math.max(node.y + node.h / 2 + 5, maxY);
    });

    return {
      minX, minY, maxX, maxY
    };
  }

}

/*        .on("touchend", function() {
          clearTimeout(touchStartTime);
          touchStartTime = null;
          if (lasso) {
            outer_background.attr("fill", "#fff");
          }
          canvasMouseUp.call(this);
        })
        .on("touchcancel", canvasMouseUp)
        .on("touchstart", function() {
          var touch0;
          if (d3.event.touches.length > 1) {
            clearTimeout(touchStartTime);
            touchStartTime = null;
            d3.event.preventDefault();
            touch0 = d3.event.touches.item(0);
            var touch1 = d3.event.touches.item(1);
            var a = touch0["pageY"] - touch1["pageY"];
            var b = touch0["pageX"] - touch1["pageX"];

            var offset = $("#chart").offset();
            var scrollPos = [$("#chart").scrollLeft(), $("#chart").scrollTop()];
            startTouchCenter = [
              (touch1["pageX"] + (b / 2) - offset.left + scrollPos[0]) / scaleFactor,
              (touch1["pageY"] + (a / 2) - offset.top + scrollPos[1]) / scaleFactor
            ];
            moveTouchCenter = [
              touch1["pageX"] + (b / 2),
              touch1["pageY"] + (a / 2)
            ]
            startTouchDistance = Math.sqrt((a * a) + (b * b));
          } else {
            var obj = d3.select(document.body);
            touch0 = d3.event.touches.item(0);
            var pos = [touch0.pageX, touch0.pageY];
            startTouchCenter = [touch0.pageX, touch0.pageY];
            startTouchDistance = 0;
            var point = d3.touches(this)[0];
            touchStartTime = setTimeout(function() {
              touchStartTime = null;
              showTouchMenu(obj, pos);
              //lasso = vis.append("rect")
              //    .attr("ox",point[0])
              //    .attr("oy",point[1])
              //    .attr("rx",2)
              //    .attr("ry",2)
              //    .attr("x",point[0])
              //    .attr("y",point[1])
              //    .attr("width",0)
              //    .attr("height",0)
              //    .attr("class","lasso");
              //outer_background.attr("fill","#e3e3f3");
            }, touchLongPressTimeout);
          }
        })
        .on("touchmove", function() {
          var touch0;
          if (d3.event.touches.length < 2) {
            if (touchStartTime) {
              touch0 = d3.event.touches.item(0);
              var dx = (touch0.pageX - startTouchCenter[0]);
              var dy = (touch0.pageY - startTouchCenter[1]);
              var d = Math.abs(dx * dx + dy * dy);
              if (d > 64) {
                clearTimeout(touchStartTime);
                touchStartTime = null;
              }
            } else if (lasso) {
              d3.event.preventDefault();
            }
            canvasMouseMove.call(this);
          } else {
            touch0 = d3.event.touches.item(0);
            var touch1 = d3.event.touches.item(1);
            var a = touch0["pageY"] - touch1["pageY"];
            var b = touch0["pageX"] - touch1["pageX"];
            var offset = $("#chart").offset();
            var scrollPos = [$("#chart").scrollLeft(), $("#chart").scrollTop()];
            var moveTouchDistance = Math.sqrt((a * a) + (b * b));
            var touchCenter = [
              touch1["pageX"] + (b / 2),
              touch1["pageY"] + (a / 2)
            ];

            if (!isNaN(moveTouchDistance)) {
              var oldScaleFactor = scaleFactor;
              scaleFactor = Math.min(2, Math.max(0.3, scaleFactor + (Math.floor(((moveTouchDistance * 100) - (startTouchDistance * 100))) / 10000)));

              var deltaTouchCenter = [                             // Try to pan whilst zooming - not 100%
                startTouchCenter[0] * (scaleFactor - oldScaleFactor),//-(touchCenter[0]-moveTouchCenter[0]),
                startTouchCenter[1] * (scaleFactor - oldScaleFactor) //-(touchCenter[1]-moveTouchCenter[1])
              ];

              startTouchDistance = moveTouchDistance;
              moveTouchCenter = touchCenter;

              $("#chart").scrollLeft(scrollPos[0] + deltaTouchCenter[0]);
              $("#chart").scrollTop(scrollPos[1] + deltaTouchCenter[1]);
              redraw();
            }
          }
        })*/;

import { CanvasState, CanvasMode } from './canvas-state';
import { CanvasActions } from './canvas-actions';
import { NodeElement, NodeInfo, PORT_TYPE_OUTPUT, PORT_TYPE_INPUT, node_width, node_height } from './node-element';
import { LinkElement, LinkInfo } from './link-element';

import * as d3 from 'd3';
import * as $ from 'jquery';

let testNodes: NodeInfo[] = [
  {
    id: 'node-1111',
    x: 220, y: 185,
    w: 180, h: 30,
    icon_url: 'icons/node-red/inject.png',
    description: 'Fire every 5 seconds ↻',
    inputs: 1,
    outputs: 5,
    _def: {
      inputs: 1,
      outputs: 5,
      button: false,
      color: "#53A3F3",
    },
    dirty: true,
  },
  {
    id: 'node-2222',
    x: 500, y: 185,
    w: 200, h: 30,
    icon_url: 'icons/node-red/inject.png',
    description: 'Test Node 2',
    inputs: 1,
    outputs: 5,
    _def: {
      inputs: 1,
      outputs: 5,
      button: false,
      color: "#898989",
    },
    dirty: true,
  }
];

const testLinks: LinkInfo[] = [
  new LinkInfo({
    link: '',
    source: testNodes[0],
    sourcePort: 0,
    target: testNodes[1],
    targetPort: 0,

    added: true,
  })
];

export class NodeStore {
  nodes: NodeInfo[] = testNodes;

  links: LinkInfo[] = testLinks;
}

export interface D3Selection extends d3.Selection<SVGElement, any, any, any> { };

const space_width = 5000,
  space_height = 5000,
  lineCurveScale = 0.75,
  scaleFactor = 1;

export class CanvasElement {
  private element: HTMLElement;

  private nodes: NodeStore = new NodeStore();

  private outer: D3Selection;
  public vis: D3Selection;
  private outer_background: D3Selection;
  private grid: D3Selection;
  private dragGroup: D3Selection;

  public readonly state: CanvasState;

  private snapGrid: boolean = false;
  private gridSize: number = 20;

  public showNodeStatus: boolean;

  constructor(me: HTMLElement) {
    this.element = me;

    var state = this.state = new CanvasState();

    this.outer = d3.select(me)
      .append<SVGElement>("svg:svg")
      .attr("width", space_width)
      .attr("height", space_height)
      .attr("pointer-events", "all")
      .style("cursor", "crosshair")
      .on("mousedown", () => this.focusView());

    this.createInnerCanvas(this.outer);

    this.updateGrid();
    this.grid.style("visibility", "visible");

    this.vis.selectAll<SVGElement, NodeElement>(".nodegroup")
      .each((n) => { n.dirty = true; });

    this.redraw();
  }

  public actions: CanvasActions;

  private createInnerCanvas(svg: D3Selection) {
    let vis = this.vis = svg
      .append<SVGElement>("svg:g")
      .on("dblclick.zoom", null)
      .append<SVGElement>("svg:g")
      .attr('class', 'innerCanvas')
      .on("mousemove", () => this.mouseMove(d3.event.currentTarget))
      .on("mousedown", () => this.mouseDown(d3.event.currentTarget))
      .on("mouseup", () => this.mouseUp(d3.event.currentTarget))

    this.outer_background = vis.append<SVGElement>("svg:rect")
      .attr("width", space_width)
      .attr("height", space_height)
      .attr("fill", "#fff");

    this.grid = vis.append("g");

    this.dragGroup = vis.append("g");
  }

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
    var point = d3.mouse(target);

    let state = this.state;

    // Remove existing lasso
    if (state.inMode(CanvasMode.LASSOING)) {
      this.endLasso(true);
    }

    if (state.inMode(CanvasMode.IDLE) && !(d3.event.metaKey || d3.event.ctrlKey)) {
      if (!state.touchStarted) {
        state.saveMousePosition(point);

        this.beginLasso(point);
        d3.event.preventDefault();

        return;
      }
    }

    state.setMode(CanvasMode.IDLE);

    this.redraw();
  }

  mouseMove(target: d3.ContainerElement) {
    var point = d3.touches(target)[0] || d3.mouse(target);

    var node;

    let state = this.state;

    let mousePos = state.setMousePosition(point);
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

    if (this.state.inMode(CanvasMode.JOINING) && state.mouseDownNode) {
      /*let mousePos = d3.mouse(document.body);
      if (isNaN(mousePos[0])) {
        mousePos = d3.touches(document.body)[0];
      }
      console.log("doc: " + mousePos);*/

      if (state.dragLinks.length === 0) {
      /*  if (d3.event.shiftKey) {
          // Get all the wires we need to detach.
          var links = [];
          var existingLinks = [];
          if (state.selectLinks.length &&
            ((mousedown_port_type === PORT_TYPE_OUTPUT &&
              selected_link.source === mousedown_node &&
              selected_link.sourcePort === mousedown_port_index
            ) ||
              (mousedown_port_type === PORT_TYPE_INPUT &&
                selected_link.target === mousedown_node
              ))
          ) {
            existingLinks = [selected_link];
          } else {
            var filter;
            if (mousedown_port_type === PORT_TYPE_OUTPUT) {
              filter = {
                source: mousedown_node,
                sourcePort: mousedown_port_index
              }
            } else {
              filter = {
                target: mousedown_node
              }
            }
            existingLinks = RED.nodes.filterLinks(filter);
          }
          for (i = 0; i < existingLinks.length; i++) {
            var link = existingLinks[i];
            RED.nodes.removeLink(link);
            links.push({
              link: link,
              node: (mousedown_port_type === PORT_TYPE_OUTPUT) ? link.target : link.source,
              port: (mousedown_port_type === PORT_TYPE_OUTPUT) ? 0 : link.sourcePort,
              portType: (mousedown_port_type === PORT_TYPE_OUTPUT) ? PORT_TYPE_INPUT : PORT_TYPE_OUTPUT
            })
          }
          if (links.length === 0) {
            resetMouseVars();
            redraw();
          } else {
            showDragLines(links);
            mouse_mode = 0;
            updateActiveNodes();
            redraw();
            mouse_mode = RED.state.JOINING;
          }
        }
        else */if (state.mouseDownNode) {
          this.showDragLines([{ node: state.mouseDownNode, portType: state.mouseDownNode.downPortType, portIndex: state.mouseDownNode.downPortIndex }]);
        }

        state.deselectLinks();
      }

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

      d3.event.preventDefault();
    }

    if (!state.hasSelection()) {
      return;
    }

    if (this.state.inMode(CanvasMode.MOVING)) {
      // let mousePos = d3.mouse(document.body);
      // if (isNaN(mousePos[0])) {
      //   mousePos = d3.touches(document.body)[0];
      // }

      var d = (state.mouseDownPoint[0] - mousePos[0]) * (state.mouseDownPoint[0] - mousePos[0])
        + (state.mouseDownPoint[1] - mousePos[1]) * (state.mouseDownPoint[1] - mousePos[1]);

      console.log(mousePos);
      console.log(state.mouseDownPoint);

      if (d > 3) {
        state.setMode(CanvasMode.MOVING_ACTIVE);
        //@SMW state.clickElapsed = 0;
      }
    }
    else if (state.inMode(CanvasMode.MOVING_ACTIVE) || state.inMode(CanvasMode.IMPORT_DRAGGING)) {
      let mousePos = state.mousePosition;

      var minX = 0;
      var minY = 0;
      var maxX = space_width;
      var maxY = space_height;

      // find max and min { x,y }
      for (let n = 0; n < state.selectedNodes.length; n++) {
        let node = state.selectedNodes[n];

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
      }

      if (minX !== 0 || minY !== 0) {
        for (let i = 0; i < state.selectedNodes.length; i++) {
          node = state.selectedNodes[i];
          node.x -= minX;
          node.y -= minY;
        }
      }

      if (maxX !== space_width || maxY !== space_height) {
        for (let i = 0; i < state.selectedNodes.length; i++) {
          node = state.selectedNodes[i];
          node.x -= (maxX - space_width);
          node.y -= (maxY - space_height);
        }
      }

      if (this.snapGrid != d3.event.shiftKey && state.selectedNodes.length > 0) {
        var gridOffset = [0, 0];

        node = state.selectedNodes[0];

        gridOffset[0] = node.x - (this.gridSize * Math.floor((node.x - node.w / 2) / this.gridSize) + node.w / 2);
        gridOffset[1] = node.y - (this.gridSize * Math.floor(node.y / this.gridSize));

        if (gridOffset[0] !== 0 || gridOffset[1] !== 0) {
          for (let i = 0; i < state.selectedNodes.length; i++) {
            node = state.selectedNodes[i];
            node.x -= gridOffset[0];
            node.y -= gridOffset[1];

            if (node.x == node.ox && node.y == node.oy) {
              node.dirty = false;
            }
          }
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
    if (state.inMode(CanvasMode.MOVING_ACTIVE)) {
      if (state.selectedNodes.length > 0) {
        var ns = [];
        for (var j = 0; j < state.selectedNodes.length; j++) {
          var n = state.selectedNodes[j];
          if (n.ox !== n.x || n.oy !== n.y) {
            ns.push({ n: n, ox: n.ox, oy: n.oy, moved: n.moved });
            n.dirty = true;
            n.moved = true;
          }
        }
        if (ns.length > 0) {
          //        RED.nodes.dirty(true);
        }
      }
    }

    this.state.resetMouse();
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
  }

  endJoin(cancel: boolean) {
    var removedLinks = [];

    for (let i = 0; i < this.state.dragLinks.length; i++) {
      if (this.state.dragLinks[i].link) {
        removedLinks.push(this.state.dragLinks[i].link)
      }
    }

    this.hideDragLines();

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
        .filter((n: NodeElement, i) => { return !n.selected && (n.x > x && n.x < x2 && n.y > y && n.y < y2); });

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

      let nodes = this.vis.selectAll<SVGElement, NodeElement>(".nodegroup");
      let nodeEls = nodes.data();

      var dirtyNodes = {};

      // Rebind selection to 'nodes'
      var xnodes = nodes.data(this.nodes.nodes, (d) => d ? d.id : null);

      // Delete the missing ones
      xnodes.exit().remove();

      if (!xnodes.enter().empty()) {
        let els = xnodes.enter()
          .insert<SVGElement>("svg:g")
          .attr("class", "node nodegroup");

        // Map 'node-info' data into new NodeElements
        let canvas = this;
        els.each(function(d, i) {
          let newEl = new NodeElement(this, canvas, d);

          d3.select(this).datum(newEl);

          nodeEls.push(newEl);
        });
      }

      /// and rebind ...
      nodes = this.vis.selectAll<SVGElement, NodeElement>(".nodegroup");
      nodes.data(nodeEls, (node) => node.id);

      nodes.each(function(node, i) {

        if (node.dirty) {
          dirtyNodes[node.id] = node;
        }

        node.updateElement(this);

        node.dirty = false;
      });
    }

    var links = this.vis.selectAll<SVGElement, LinkInfo>(".link");
    let linkEls = links.data();

    // Rebind selection to 'nodes'
    var xlinks = links.data(this.nodes.links, (link) => link ? link.id : null);

    // Delete the missing ones
    xnodes.exit().remove();

    if (!xlinks.enter().empty()) {
      let els = xlinks.enter()
        .insert<SVGElement>("svg:g", ".node")
        .attr("class", "link");

      // Map 'link-info' data into new LinkElements
      let canvas = this;
      els.each(function(d, i) {
        let newEl = new LinkElement(this, canvas, d);

        d3.select(this).datum(newEl);

        linkEls.push(newEl);
      });
    }

    /// and rebind ...
    links = this.vis.selectAll<SVGElement, LinkElement>(".link");
    links.data(linkEls, (link) => link.id);

    let me = this;

    links = this.vis.selectAll<SVGElement, LinkElement>(".link");
    links.each(function(d: LinkElement) {

      d.updateLink(this, dirtyNodes[d.source.id] || dirtyNodes[d.target.id]);
    });


    //    else {
    /*      // JOINING - unselect any selected links
          this.vis.selectAll(".link_selected").data(
            this.activeLinks,
            function(d: LinkInfo) {
              return d.source.id + ":" + d.sourcePort + ":" + d.target.id + ":" //+ d.target.i;
            }
          ).classed("link_selected", false);*/
    //  }


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

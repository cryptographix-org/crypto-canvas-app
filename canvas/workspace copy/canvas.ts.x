import { Panel } from '../core'
import { NodeElement, NodeInfo } from './node-element';
import { LinkInfo } from './link-element';
import { CanvasElement } from './canvas-element';

import * as d3 from 'd3';
import * as $ from 'jquery';

import { MODE as CANVAS_STATE, CanvasState } from './canvas-state';
export { CANVAS_STATE };

var nodes: any[];

const space_width = 5000,
  space_height = 5000,
  lineCurveScale = 0.75,
  scaleFactor = 1,
  node_width = 100,
  node_height = 30;

var status_colours = {
  "red": "#c00",
  "green": "#5a8",
  "yellow": "#F9DF31",
  "blue": "#53A3F3",
  "grey": "#d3d3d3"
}

var PORT_TYPE_INPUT = 1;
var PORT_TYPE_OUTPUT = 0;

interface D3Selection extends d3.Selection<any, any, any, any> { };

var vis: D3Selection;
var outer: D3Selection;
var outer_background: D3Selection;
var grid: D3Selection;
var dragGroup: D3Selection;
var drag_lines = [];

export class Canvas extends Panel {
  public innerCanvas: HTMLElement;

  public state: CanvasState = new CanvasState();

  workspaceScrollPositions = {};

  gridSize = 20;
  snapGrid = false;

  activeSubflow = null;
  activeNodes: NodeInfo[] = [];
  activeLinks = [];
  activeFlowLinks = [];

  showStatus = false;
  drag_lines = [];

  clipboard = "";


  constructor(me: HTMLElement) {
    super(me);

    outer = d3.select(me)
      .append("svg:svg")
      .attr("width", space_width)
      .attr("height", space_height)
      .attr("pointer-events", "all")
      .style("cursor", "crosshair")
      .on("mousedown", () => this.focusView());

    vis = outer
      .append("svg:g")
      .on("dblclick.zoom", null)
      .append("svg:g")
      .attr('class', 'innerCanvas')
      .on("mousemove", () => this.mouseMove(d3.event.currentTarget))
      .on("mousedown", () => this.mouseDown(d3.event.currentTarget))
      .on("mouseup", () => this.mouseUp(d3.event.currentTarget))
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

    vis.insert("svg:g")
      .attr("class", "node nodegroup");

    outer_background = vis.append("svg:rect")
      .attr("width", space_width)
      .attr("height", space_height)
      .attr("fill", "#fff");

    grid = vis.append("g");
    this.updateGrid();
    grid.style("visibility", "visible");

    dragGroup = vis.append("g");

    this.innerCanvas = $(me).find('.innerCanvas')[0];

    this.activeNodes = [{
      id: 'node-1111',
      x: 100, y: 185,
      w: 200, h: 30,
      icon_url: 'icons/node-red/inject.png',
      description: 'Fire every 5 seconds ↻',
      _def: {
        inputs: 1,
        button: true,
        color: status_colours.red
      },
      dirty: true,
    }];

    //    for (let i in activeNodes) {
    //      let n = NodeElement.insertNode(this, activeNodes[i]);
    //    }

    this.redraw();
    this.redraw();
  }

  getTemplate() {
    return '';
  }

  scaleFactor: number = 1;
  zoomIn() {
    if (this.scaleFactor < 2) {
      this.scaleFactor += 0.1;
      this.redraw();
    }
  }

  zoomOut() {
    if (this.scaleFactor > 0.3) {
      this.scaleFactor -= 0.1;
      this.redraw();
    }
  }

  zoomZero() {
    this.scaleFactor = 1;
    this.redraw();
  }

  lasso = null;

  mouseDown(target: d3.ContainerElement) {
    var point;

    if (!this.state.mousedown_node && !this.state.mousedown_link) {
      this.state.selected_link = null;
      this.updateSelection();
    }

    if (this.state.mouseMode === 0 && !(d3.event.metaKey || d3.event.ctrlKey)) {
      if (!this.state.touchStarted()) {
        point = d3.mouse(target);

        this.lasso = vis.append("rect")
          .attr("ox", point[0])
          .attr("oy", point[1])
          .attr("rx", 1)
          .attr("ry", 1)
          .attr("x", point[0])
          .attr("y", point[1])
          .attr("width", 0)
          .attr("height", 0)
          .attr("class", "lasso");

        d3.event.preventDefault();
      }
    }
  }

  mouseMove(target: d3.ContainerElement) {
    var i;
    var node;

    let state = this.state;

    state.mousePosition = d3.touches(target)[0] || d3.mouse(target);
    // Prevent touch scrolling...
    //if (d3.touches(this)[0]) {
    //    d3.event.preventDefault();
    //}

    // TODO: auto scroll the container
    //var point = d3.mouse(this);
    //if (point[0]-container.scrollLeft < 30 && container.scrollLeft > 0) { container.scrollLeft -= 15; }
    //console.log(d3.mouse(this),container.offsetWidth,container.offsetHeight,container.scrollLeft,container.scrollTop);

    if (this.lasso) {
      var ox = parseInt(this.lasso.attr("ox"));
      var oy = parseInt(this.lasso.attr("oy"));
      var x = parseInt(this.lasso.attr("x"));
      var y = parseInt(this.lasso.attr("y"));
      var w;
      var h;

      if (state.mousePosition[0] < ox) {
        x = state.mousePosition[0];
        w = ox - x;
      } else {
        w = state.mousePosition[0] - x;
      }

      if (state.mousePosition[1] < oy) {
        y = state.mousePosition[1];
        h = oy - y;
      } else {
        h = state.mousePosition[1] - y;
      }

      this.lasso
        .attr("x", x)
        .attr("y", y)
        .attr("width", w)
        .attr("height", h);

      return;
    }

    if (!this.state.mousedown_node && this.state.selected_link == null) {
      return;
    }

    var mousePos;
    if (this.state.mouseMode == CANVAS_STATE.MOVING) {
      mousePos = d3.mouse(document.body);
      if (isNaN(mousePos[0])) {
        mousePos = d3.touches(document.body)[0];
      }

      var d = (state.mouseOffset[0] - mousePos[0]) * (state.mouseOffset[0] - mousePos[0])
        + (state.mouseOffset[1] - mousePos[1]) * (state.mouseOffset[1] - mousePos[1]);

      if (d > 3) {
        this.state.setMouseMode(CANVAS_STATE.MOVING_ACTIVE);
        //@SMW state.clickElapsed = 0;
        //@SMWthis.spliceActive = false;
        /*if (moving_set.length === 1) {
          node = moving_set[0];
          spliceActive = node.n.hasOwnProperty("_def") &&
            node.n._def.inputs > 0 &&
            node.n._def.outputs > 0 &&
            RED.nodes.filterLinks({ source: node.n }).length === 0 &&
            RED.nodes.filterLinks({ target: node.n }).length === 0;
        }*/
      }
    }
    else if (this.state.mouseMode == CANVAS_STATE.MOVING_ACTIVE || this.state.mouseMode == CANVAS_STATE.IMPORT_DRAGGING) {
      mousePos = this.state.mousePosition;
      var minX = 0;
      var minY = 0;
      var maxX = space_width;
      var maxY = space_height;

      for (var n = 0; n < state.moving_set.length; n++) {
        let node = state.moving_set[n];
        if (d3.event.shiftKey) {
          node.n.ox = node.n.x;
          node.n.oy = node.n.y;
        }

        node.n.x = mousePos[0] + node.dx;
        node.n.y = mousePos[1] + node.dy;
        node.n.dirty = true;

        minX = Math.min(node.n.x - node.n.w / 2 - 5, minX);
        minY = Math.min(node.n.y - node.n.h / 2 - 5, minY);
        maxX = Math.max(node.n.x + node.n.w / 2 + 5, maxX);
        maxY = Math.max(node.n.y + node.n.h / 2 + 5, maxY);
      }

      if (minX !== 0 || minY !== 0) {
        for (i = 0; i < state.moving_set.length; i++) {
          node = state.moving_set[i];
          node.n.x -= minX;
          node.n.y -= minY;
        }
      }

      if (maxX !== space_width || maxY !== space_height) {
        for (i = 0; i < state.moving_set.length; i++) {
          node = state.moving_set[i];
          node.n.x -= (maxX - space_width);
          node.n.y -= (maxY - space_height);
        }
      }

      if (this.snapGrid != d3.event.shiftKey && state.moving_set.length > 0) {
        var gridOffset = [0, 0];

        node = state.moving_set[0];

        gridOffset[0] = node.n.x - (this.gridSize * Math.floor((node.n.x - node.n.w / 2) / this.gridSize) + node.n.w / 2);
        gridOffset[1] = node.n.y - (this.gridSize * Math.floor(node.n.y / this.gridSize));

        if (gridOffset[0] !== 0 || gridOffset[1] !== 0) {
          for (i = 0; i < state.moving_set.length; i++) {
            node = state.moving_set[i];
            node.n.x -= gridOffset[0];
            node.n.y -= gridOffset[1];

            if (node.n.x == node.n.ox && node.n.y == node.n.oy) {
              node.dirty = false;
            }
          }
        }
      }

      if ((this.state.mouseMode == CANVAS_STATE.MOVING_ACTIVE || this.state.mouseMode == CANVAS_STATE.IMPORT_DRAGGING) && state.moving_set.length === 1) {
        node = state.moving_set[0];

        if (this.state.spliceActive) {
          if (!this.state.spliceTimer) {
            this.state.spliceTimer = setTimeout(function() {
              var nodes = [];
              var bestDistance = Infinity;
              var bestLink = null;
              var mouseX = node.n.x;
              var mouseY = node.n.y;

              if (outer[0][0].getIntersectionList) {
                var svgRect = outer[0][0].createSVGRect();
                svgRect.x = mouseX;
                svgRect.y = mouseY;
                svgRect.width = 1;
                svgRect.height = 1;
                nodes = outer[0][0].getIntersectionList(svgRect, outer[0][0]);
              } /*else {
                // Firefox doesn"t do getIntersectionList and that
                // makes us sad
                nodes = RED.view.getLinksAtPoint(mouseX, mouseY);
              }*/

              for (var i = 0; i < nodes.length; i++) {
                if (d3.select(nodes[i]).classed("link_background")) {
                  var length = nodes[i].getTotalLength();
                  for (var j = 0; j < length; j += 10) {
                    var p = nodes[i].getPointAtLength(j);
                    var d2 = ((p.x - mouseX) * (p.x - mouseX)) + ((p.y - mouseY) * (p.y - mouseY));
                    if (d2 < 200 && d2 < bestDistance) {
                      bestDistance = d2;
                      bestLink = nodes[i];
                    }
                  }
                }
              }

              if (this.activeSpliceLink && this.activeSpliceLink !== bestLink) {
                d3.select(this.activeSpliceLink.parentNode).classed("link_splice", false);
              }

              if (bestLink) {
                d3.select(bestLink.parentNode).classed("link_splice", true)
              } else {
                d3.select(".link_splice").classed("link_splice", false);
              }

              this.activeSpliceLink = bestLink;
              this.spliceTimer = null;
            }, 100);
          }
        }
      }


    }
    if (this.state.mouseMode !== 0) {
      this.redraw();
    }
  }

  mouseUp(target: d3.ContainerElement) {
    var i;
    var historyEvent;

    if (this.state.mousedown_node && this.state.mouseMode == CANVAS_STATE.JOINING) {
      var removedLinks = [];
      for (i = 0; i < drag_lines.length; i++) {
        if (drag_lines[i].link) {
          removedLinks.push(drag_lines[i].link)
        }
      }
      this.hideDragLines();
    }

    if (this.lasso) {
      var x = parseInt(this.lasso.attr("x"));
      var y = parseInt(this.lasso.attr("y"));
      var x2 = x + parseInt(this.lasso.attr("width"));
      var y2 = y + parseInt(this.lasso.attr("height"));
      if (!d3.event.ctrlKey) {
        this.clearSelection();
      }

      /*    RED.nodes.eachNode(function(n) {
            if (n.z == RED.workspaces.active() && !n.selected) {
              n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
              if (n.selected) {
                n.dirty = true;
                moving_set.push({ n: n });
              }
            }
          });

          if (activeSubflow) {
            activeSubflow.in.forEach(function(n) {
              n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
              if (n.selected) {
                n.dirty = true;
                moving_set.push({ n: n });
              }
            });

            activeSubflow.out.forEach(function(n) {
              n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
              if (n.selected) {
                n.dirty = true;
                moving_set.push({ n: n });
              }
            });
          }*/
      this.updateSelection();
      this.lasso.remove();
      this.lasso = null;
    }
    else if (this.state.mouseMode == CANVAS_STATE.DEFAULT && this.state.mousedown_link == null && !d3.event.ctrlKey && !d3.event.metaKey) {
      this.clearSelection();
      this.updateSelection();
    }

    if (this.state.mouseMode == CANVAS_STATE.MOVING_ACTIVE) {
      if (this.state.moving_set.length > 0) {
        var ns = [];
        for (var j = 0; j < this.state.moving_set.length; j++) {
          var n = this.state.moving_set[j];
          if (n.ox !== n.n.x || n.oy !== n.n.y) {
            ns.push({ n: n.n, ox: n.ox, oy: n.oy, moved: n.n.moved });
            n.n.dirty = true;
            n.n.moved = true;
          }
        }
        if (ns.length > 0) {
          //        RED.nodes.dirty(true);
        }
      }
    }

    if (this.state.mouseMode == CANVAS_STATE.MOVING || this.state.mouseMode == CANVAS_STATE.MOVING_ACTIVE) {
      for (i = 0; i < this.state.moving_set.length; i++) {
        delete this.state.moving_set[i].ox;
        delete this.state.moving_set[i].oy;
      }
    }

    if (this.state.mouseMode == CANVAS_STATE.IMPORT_DRAGGING) {
      //this.updateActiveNodes();
      //    RED.nodes.dirty(true);
    }

    this.state.resetMouseVars();
    this.redraw();
  }

  updateSelection() { }
  clearSelection() { }

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

  updateGrid() {
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

  showDragLines(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      node.el = dragGroup.append("svg:path").attr("class", "drag_line");
      drag_lines.push(node);
    }
  }

  hideDragLines() {
    while (drag_lines.length) {
      var line = drag_lines.pop();
      if (line.el) {
        line.el.remove();
      }
    }
  }

  drawNode() {
  }

  redraw() {
    vis.attr("transform", "scale(" + this.scaleFactor + ")");
    outer.attr("width", space_width * this.scaleFactor).attr("height", space_height * this.scaleFactor);

    function isButtonEnabled(d: NodeInfo) { return false; }

    if (this.state.mouseMode != CANVAS_STATE.JOINING) {

      var dirtyNodes = {};

      var nodes = vis.selectAll(".nodegroup").data(this.activeNodes,
        (d: NodeInfo) =>
          d ? d.id : null);
      nodes.exit().remove();

      let canvas = this;

      var nodeEnter = CanvasElement.createElements(this, nodes.enter());

      nodes = vis.selectAll(".nodegroup");

      nodes.each(function(d, i) {
        if (d.dirty) {
          var isLink = d.type === "link in" || d.type === "link out";
          dirtyNodes[d.id] = d;
          //if (d.x < -50) deleteSelection();  // Delete nodes if dragged back to palette
          if (!isLink && d.resize) {
            var l = d.description; // RED.utils.getNodeLabel(d:NodeInfo);
            var ow = d.w;
            d.w = Math.max(node_width, 20 * (Math.ceil((calculateTextWidth(l, "node_label", 50) + (d._def.inputs > 0 ? 7 : 0)) / 20)));
            d.h = Math.max(node_height, (d.outputs || 0) * 15);
            d.x += (d.w - ow) / 2;
            d.resize = false;
          }
          var thisNode = d3.select(this);
          //thisNode.selectAll(".centerDot").attr({"cx":function(d:NodeInfo) { return d.w/2;},"cy":function(d:NodeInfo){return d.h/2}});
          thisNode.attr("transform", function(d: NodeInfo) { return "translate(" + (d.x - d.w / 2) + "," + (d.y - d.h / 2) + ")"; });

          if (canvas.state.mouseMode != CANVAS_STATE.MOVING_ACTIVE) {
            thisNode.selectAll(".node")
              .attr("width", function(d: NodeInfo) { return d.w })
              .attr("height", function(d: NodeInfo) { return d.h })
              .classed("node_selected", function(d: NodeInfo) { return d.selected; })
              .classed("node_highlighted", function(d: NodeInfo) { return d.highlighted; })
              ;
            //thisNode.selectAll(".node-gradient-top").attr("width",function(d:NodeInfo){return d.w});
            //thisNode.selectAll(".node-gradient-bottom").attr("width",function(d:NodeInfo){return d.w}).attr("y",function(d:NodeInfo){return d.h-30});

            thisNode.selectAll(".node_icon_group_right").attr("transform", function(d: NodeInfo) { return "translate(" + (d.w - 30) + ",0)" });
            thisNode.selectAll(".node_label_right").attr("x", function(d: NodeInfo) { return d.w - 38 });
            //thisNode.selectAll(".node_icon_right").attr("x",function(d:NodeInfo){return d.w-d3.select(this).attr("width")-1-(d.outputs>0?5:0);});
            //thisNode.selectAll(".node_icon_shade_right").attr("x",function(d:NodeInfo){return d.w-30;});
            //thisNode.selectAll(".node_icon_shade_border_right").attr("d",function(d:NodeInfo){return "M "+(d.w-30)+" 1 l 0 "+(d.h-2)});

            var inputPorts = thisNode.selectAll(".port_input");
            if (d.inputs === 0 && !inputPorts.empty()) {
              inputPorts.remove();
              //nodeLabel.attr("x",30);
            } else if (d.inputs === 1 && inputPorts.empty()) {
              var inputGroup = thisNode.append("g").attr("class", "port_input");
              inputGroup.append("rect").attr("class", "port").attr("rx", 3).attr("ry", 3).attr("width", 10).attr("height", 10)
                .on("mousedown", function(d: NodeInfo) { portMouseDown(d, PORT_TYPE_INPUT, 0); })
                .on("touchstart", function(d: NodeInfo) { portMouseDown(d, PORT_TYPE_INPUT, 0); })
                .on("mouseup", function(d: NodeInfo) { portMouseUp(d, PORT_TYPE_INPUT, 0); })
                .on("touchend", function(d: NodeInfo) { portMouseUp(d, PORT_TYPE_INPUT, 0); })
                .on("mouseover", function(d: NodeInfo) { portMouseOver(d3.select(this), d, PORT_TYPE_INPUT, 0); })
                .on("mouseout", function(d: NodeInfo) { portMouseOut(d3.select(this), d, PORT_TYPE_INPUT, 0); });
            }

            var numOutputs = d.outputs;
            var y = (d.h / 2) - ((numOutputs - 1) / 2) * 13;
            d.ports = d.ports || d3.range(numOutputs);
            d._ports = thisNode.selectAll(".port_output").data(d.ports);
            var output_group = d._ports.enter().append("g").attr("class", "port_output");

            output_group.append("rect").attr("class", "port").attr("rx", 3).attr("ry", 3).attr("width", 10).attr("height", 10)
              .on("mousedown", (function() { var node = d; return function(d: NodeInfo, i) { portMouseDown(node, PORT_TYPE_OUTPUT, i); } })())
              .on("touchstart", (function() { var node = d; return function(d: NodeInfo, i) { portMouseDown(node, PORT_TYPE_OUTPUT, i); } })())
              .on("mouseup", (function() { var node = d; return function(d: NodeInfo, i) { portMouseUp(node, PORT_TYPE_OUTPUT, i); } })())
              .on("touchend", (function() { var node = d; return function(d: NodeInfo, i) { portMouseUp(node, PORT_TYPE_OUTPUT, i); } })())
              .on("mouseover", (function() { var node = d; return function(d: NodeInfo, i) { portMouseOver(d3.select(this), node, PORT_TYPE_OUTPUT, i); } })())
              .on("mouseout", (function() { var node = d; return function(d: NodeInfo, i) { portMouseOut(d3.select(this), node, PORT_TYPE_OUTPUT, i); } })());

            d._ports.exit().remove();
            if (d._ports) {
              numOutputs = d.outputs || 1;
              y = (d.h / 2) - ((numOutputs - 1) / 2) * 13;
              var x = d.w - 5;
              d._ports.each(function(d, i) {
                var port = d3.select(this);
                //port.attr("y",(y+13*i)-5).attr("x",x);
                port.attr("transform", function(d: NodeInfo) { return "translate(" + x + "," + ((y + 13 * i) - 5) + ")"; });
              });
            }
            thisNode.selectAll("text.node_label").text(function(d: NodeInfo, i) {
              var l = "";
              /*if (d._def.label) {
                l = d._def.label;
                try {
                  l = (typeof l === "function" ? l.call(d:NodeInfo) : l) || "";
                  //                  l = RED.text.bidi.enforceTextDirectionWithUCC(l);
                } catch (err) {
                  console.log("Definition error: " + d.type + ".label", err);
                  l = d.type;
                }
              }*/
              return l;
            })
              .attr("y", function(d: NodeInfo) { return (d.h / 2) - 1; })
              .attr("class", function(d: NodeInfo) {
                var s = "";
                /*if (d._def.labelStyle) {
                  s = d._def.labelStyle;
                  try {
                    s = (typeof s === "function" ? s.call(d) : s) || "";
                  } catch (err) {
                    console.log("Definition error: " + d.type + ".labelStyle", err);
                    s = "";
                  }
                s = " " + s;
              }*/
                return "node_label" +
                  (d._def.align ? " node_label_" + d._def.align : "") + s;
              });

            /*            if (d._def.icon) {
                          icon_url = thisNode.select(".node_icon");
                          var current_url = icon.attr("xlink:href");
                          var new_url = RED.utils.getNodeIcon(d._def, d);
                          if (new_url !== current_url) {
                            icon.attr("xlink:href", new_url);
                            var img = new Image();
                            img.src = new_url;
                            img.onload = function() {
                              icon.attr("width", Math.min(img.width, 30));
                              icon.attr("height", Math.min(img.height, 30));
                              icon.attr("x", 15 - Math.min(img.width, 30) / 2);
                            }
                          }
                        }*/


            thisNode.selectAll(".node_tools").attr("x", function(d: NodeInfo) { return d.w - 35; }).attr("y", function(d: NodeInfo) { return d.h - 20; });

            thisNode.selectAll(".node_changed")
              .attr("x", function(d: NodeInfo) { return d.w - 10 })
              .classed("hidden", function(d: NodeInfo) { return !(d.changed || d.moved); });

            thisNode.selectAll(".node_error")
              .attr("x", function(d: NodeInfo) { return d.w - 10 - ((d.changed || d.moved) ? 13 : 0) })
              .classed("hidden", function(d: NodeInfo) { return d.valid; });

            thisNode.selectAll(".port_input").each(function(d, i) {
              var port = d3.select(this);
              port.attr("transform", function(d: NodeInfo) { return "translate(-5," + ((d.h / 2) - 5) + ")"; })
            });

            thisNode.selectAll(".node_icon").attr("y", function(d: NodeInfo) { return (d.h - +d3.select(this).attr("height")) / 2; });
            thisNode.selectAll(".node_icon_shade").attr("height", function(d: NodeInfo) { return d.h; });
            thisNode.selectAll(".node_icon_shade_border").attr("d", function(d: NodeInfo) { return "M " + (("right" == d._def.align) ? 0 : 30) + " 1 l 0 " + (d.h - 2) });

            thisNode.selectAll(".node_button").attr("opacity", function(d: NodeInfo) {
              return (canvas.activeSubflow || !isButtonEnabled(d)) ? 0.4 : 1
            });
            thisNode.selectAll(".node_button_button").attr("cursor", function(d: NodeInfo) {
              return (canvas.activeSubflow || !isButtonEnabled(d)) ? "" : "pointer";
            });
            thisNode.selectAll(".node_right_button").attr("transform", function(d: NodeInfo) {
              var x = d.w - 6;
              if (d._def.button.toggle && !d[d._def.button.toggle]) {
                x = x - 8;
              }
              return "translate(" + x + ",2)";
            });
            thisNode.selectAll(".node_right_button rect").attr("fill-opacity", function(d: NodeInfo) {
              if (d._def.button.toggle) {
                return d[d._def.button.toggle] ? 1 : 0.2;
              }
              return 1;
            });

            //thisNode.selectAll(".node_right_button").attr("transform",function(d:NodeInfo){return "translate("+(d.w - d._def.button.width.call(d:NodeInfo))+","+0+")";}).attr("fill",function(d:NodeInfo) {
            //         return typeof d._def.button.color  === "function" ? d._def.button.color.call(d:NodeInfo):(d._def.button.color != null ? d._def.button.color : d._def.color)
            //});

            thisNode.selectAll(".node_badge_group").attr("transform", function(d: NodeInfo) { return "translate(" + (d.w - 40) + "," + (d.h + 3) + ")"; });
            thisNode.selectAll("text.node_badge_label").text(function(d: NodeInfo, i) {
              if (d._def.badge) {
                if (typeof d._def.badge == "function") {
                  try {
                    return d._def.badge.call(d);
                  } catch (err) {
                    console.log("Definition error: " + d.type + ".badge", err);
                    return "";
                  }
                } else {
                  return d._def.badge;
                }
              }
              return "";
            });
          }

          if (!canvas.showStatus || !d.status) {
            thisNode.selectAll(".node_status_group").style("display", "none");
          } else {
            thisNode.selectAll(".node_status_group").style("display", "inline").attr("transform", "translate(3," + (d.h + 3) + ")");
            var fill = status_colours[d.status.fill]; // Only allow our colours for now
            if (d.status.shape == null && fill == null) {
              thisNode.selectAll(".node_status").style("display", "none");
            } else {
              var style;
              if (d.status.shape == null || d.status.shape == "dot") {
                style = {
                  display: "inline",
                  fill: fill,
                  stroke: fill
                };
              } else if (d.status.shape == "ring") {
                style = {
                  display: "inline",
                  fill: "#fff",
                  stroke: fill
                }
              }
              thisNode.selectAll(".node_status").style(style);
            }
            if (d.status.text) {
              thisNode.selectAll(".node_status_label").text(d.status.text);
            } else {
              thisNode.selectAll(".node_status_label").text("");
            }
          }

          d.dirty = false;
        }
      });

      var link = vis.selectAll(".link").data(
        canvas.activeLinks,
        function(d: LinkInfo) {
          return d.source.id + ":" + d.sourcePort + ":" + d.target.id + ":" //+ d.target.i;
        }
      );
      var linkEnter = link.enter().insert("g", ".node").attr("class", "link");

      linkEnter.each((d: LinkInfo, i) => {
        var l = d3.select(linkEnter[i]);
        d.added = true;
        l.append("svg:path").attr("class", "link_background link_path")
          .on("mousedown", (d: NodeInfo) => {
            canvas.state.mousedown_link = d;
            this.clearSelection();
            canvas.state.selected_link = canvas.state.mousedown_link;
            this.updateSelection();
            this.redraw();
            this.focusView();
            d3.event.stopPropagation();
          })
          .on("touchstart", (d: LinkInfo) => {
            canvas.state.mousedown_link = d;
            this.clearSelection();
            canvas.state.selected_link = canvas.state.mousedown_link;
            this.updateSelection();
            this.redraw();
            this.focusView();
            d3.event.stopPropagation();

            var obj = d3.select(document.body);
            var touch0 = d3.event.touches.item(0);
            var pos = [touch0.pageX, touch0.pageY];

            this.state.startTouch(undefined, () => {
              //showTouchMenu(obj, pos);
            });
          })
        l.append("svg:path").attr("class", "link_outline link_path");
        l.append("svg:path").attr("class", "link_line link_path")
          .classed("link_link", function(d: LinkInfo) { return d.link })
          .classed("link_subflow", function(d: LinkInfo) { return !d.link && canvas.activeSubflow });
      });

      link.exit().remove();
      var links = vis.selectAll(".link_path");
      links.each(function(d: LinkInfo) {
        var link = d3.select(this);
        if (d.added || d === canvas.state.selected_link || d.selected || dirtyNodes[d.source.id] || dirtyNodes[d.target.id]) {
          link.attr("d", function(d: LinkInfo) {
            var numOutputs = d.source.outputs || 1;
            var sourcePort = d.sourcePort || 0;
            var y = -((numOutputs - 1) / 2) * 13 + 13 * sourcePort;

            var dy = d.target.y - (d.source.y + y);
            var dx = (d.target.x - d.target.w / 2) - (d.source.x + d.source.w / 2);
            var delta = Math.sqrt(dy * dy + dx * dx);
            var scale = lineCurveScale;
            var scaleY = 0;
            if (delta < node_width) {
              scale = 0.75 - 0.75 * ((node_width - delta) / node_width);
            }

            if (dx < 0) {
              scale += 2 * (Math.min(5 * node_width, Math.abs(dx)) / (5 * node_width));
              if (Math.abs(dy) < 3 * node_height) {
                scaleY = ((dy > 0) ? 0.5 : -0.5) * (((3 * node_height) - Math.abs(dy)) / (3 * node_height)) * (Math.min(node_width, Math.abs(dx)) / (node_width));
              }
            }

            d.x1 = d.source.x + d.source.w / 2;
            d.y1 = d.source.y + y;
            d.x2 = d.target.x - d.target.w / 2;
            d.y2 = d.target.y;

            return "M " + d.x1 + " " + d.y1 +
              " C " + (d.x1 + scale * node_width) + " " + (d.y1 + scaleY * node_height) + " " +
              (d.x2 - scale * node_width) + " " + (d.y2 - scaleY * node_height) + " " +
              d.x2 + " " + d.y2;
          });
        }
      })

      link.classed("link_selected", function(d: LinkInfo) { return d === canvas.state.selected_link || d.selected; });

      /*      link.classed("link_unknown", function(d: LinkInfo) {
              delete d.added;
              return d.target.type == "unknown" || d.source.type == "unknown"
            });
            var offLinks = vis.selectAll(".link_flow_link_g").data(
              activeFlowLinks,
              function(d: LinkInfo) {
                return d.node.id + ":" + d.refresh
              }
            );

      var offLinksEnter = offLinks.enter().insert("g", ".node").attr("class", "link_flow_link_g");
      offLinksEnter.each(function(d, i) {
        var g = d3.select(this);
        var s = 1;
        var labelAnchor = "start";
        if (d.node.type === "link in") {
          s = -1;
          labelAnchor = "end";
        }
        var stemLength = s * 30;
        var branchLength = s * 20;
        var l = g.append("svg:path").attr("class", "link_flow_link")
          .attr("class", "link_link").attr("d", "M 0 0 h " + stemLength);
        var links = d.links;
        var flows = Object.keys(links);
        var tabOrder = RED.nodes.getWorkspaceOrder();
        flows.sort(function(A, B) {
          return tabOrder.indexOf(A) - tabOrder.indexOf(B);
        });
        var linkWidth = 10;
        var h = node_height;
        var y = -(flows.length - 1) * h / 2;
        var linkGroups = g.selectAll(".link_group").data(flows);
        var enterLinkGroups = linkGroups.enter().append("g").attr("class", "link_group")
          .on('mouseover', function() { d3.select(this).classed('link_group_active', true) })
          .on('mouseout', function() { d3.select(this).classed('link_group_active', false) })
          .on('mousedown', function() { d3.event.preventDefault(); d3.event.stopPropagation(); })
          .on('mouseup', function(f) {
            d3.event.stopPropagation();
            var targets = d.links[f];
            RED.workspaces.show(f);
            targets.forEach(function(n) {
              n.selected = true;
              n.dirty = true;
              moving_set.push({ n: n });
            });
            updateSelection();
            redraw();
          });
        enterLinkGroups.each(function(f) {
          var linkG = d3.select(this);
          linkG.append("svg:path").attr("class", "link_flow_link")
            .attr("class", "link_link")
            .attr("d",
            "M " + stemLength + " 0 " +
            "C " + (stemLength + (1.7 * branchLength)) + " " + 0 +
            " " + (stemLength + (0.1 * branchLength)) + " " + y + " " +
            (stemLength + branchLength * 1.5) + " " + y + " "
            );
          linkG.append("svg:path")
            .attr("class", "link_port")
            .attr("d",
            "M " + (stemLength + branchLength * 1.5 + s * (linkWidth + 7)) + " " + (y - 12) + " " +
            "h " + (-s * linkWidth) + " " +
            "a 3 3 45 0 " + (s === 1 ? "0" : "1") + " " + (s * -3) + " 3 " +
            "v 18 " +
            "a 3 3 45 0 " + (s === 1 ? "0" : "1") + " " + (s * 3) + " 3 " +
            "h " + (s * linkWidth)
            );
          linkG.append("svg:path")
            .attr("class", "link_port")
            .attr("d",
            "M " + (stemLength + branchLength * 1.5 + s * (linkWidth + 10)) + " " + (y - 12) + " " +
            "h " + (s * (linkWidth * 3)) + " " +
            "M " + (stemLength + branchLength * 1.5 + s * (linkWidth + 10)) + " " + (y + 12) + " " +
            "h " + (s * (linkWidth * 3))
            ).style("stroke-dasharray", "12 3 8 4 3");
          linkG.append("rect").attr("class", "port link_port")
            .attr("x", stemLength + branchLength * 1.5 - 4 + (s * 4))
            .attr("y", y - 4)
            .attr("rx", 2)
            .attr("ry", 2)
            .attr("width", 8)
            .attr("height", 8);
          linkG.append("rect")
            .attr("x", stemLength + branchLength * 1.5 - (s === -1 ? node_width : 0))
            .attr("y", y - 12)
            .attr("width", node_width)
            .attr("height", 24)
            .style("stroke", "none")
            .style("fill", "transparent")
          var tab = RED.nodes.workspace(f);
          var label;
          if (tab) {
            label = tab.label || tab.id;
          }
          linkG.append("svg:text")
            .attr("class", "port_label")
            .attr("x", stemLength + branchLength * 1.5 + (s * 15))
            .attr("y", y + 1)
            .style("font-size", "10px")
            .style("text-anchor", labelAnchor)
            .text(label);

          y += h;
        });
        linkGroups.exit().remove();
      });
      offLinks.exit().remove();
      offLinks = vis.selectAll(".link_flow_link_g");
      offLinks.each(function(d: NodeInfo) {
        var s = 1;
        if (d.node.type === "link in") {
          s = -1;
        }
        var link = d3.select(this);
        link.attr("transform", function(d: NodeInfo) { return "translate(" + (d.node.x + (s * d.node.w / 2)) + "," + (d.node.y) + ")"; });

      })*/

    } else {
      // JOINING - unselect any selected links
      vis.selectAll(".link_selected").data(
        this.activeLinks,
        function(d: LinkInfo) {
          return d.source.id + ":" + d.sourcePort + ":" + d.target.id + ":" //+ d.target.i;
        }
      ).classed("link_selected", false);
    }

    if (d3.event) {
      d3.event.preventDefault();
    }

  }

  startTouch() {
    var obj = d3.select(d3.event.target);
    var touch0 = d3.event.touches.item(0);
    var pos = [touch0.pageX, touch0.pageY];

    this.state.startTouch([touch0.pageX, touch0.pageY],
      () => {
        //showTouchMenu(obj, pos);
      });

  }


}

function portMouseDown(node, io, i) {

}
function portMouseUp(node, io, i) {
}
function portMouseOut(d, node, io, i) {

}
function portMouseOver(d, node, io, i) {

}


function calculateTextWidth(str, className, offset) {
  return calculateTextDimensions(str, className, offset, 0)[0];
}

function calculateTextDimensions(str, className, offsetW, offsetH) {
  var sp = document.createElement("span");
  sp.className = className;
  sp.style.position = "absolute";
  sp.style.top = "-1000px";
  sp.textContent = (str || "");
  document.body.appendChild(sp);
  var w = sp.offsetWidth;
  var h = sp.offsetHeight;
  document.body.removeChild(sp);
  return [offsetW + w, offsetH + h];
}

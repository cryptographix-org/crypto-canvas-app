import { CanvasMode } from './canvas-state';
import { CanvasElement, D3Selection } from './canvas-element';
import * as d3 from 'd3';

export const PORT_TYPE_INPUT = 1;
export const PORT_TYPE_OUTPUT = 0;

export interface NodeSelector extends d3.Selection<SVGElement, NodeElement, any, any> { }

export const
  node_width = 100,
  node_height = 30;

const status_colours = {
  "red": "#c00",
  "green": "#5a8",
  "yellow": "#F9DF31",
  "blue": "#53A3F3",
  "grey": "#d3d3d3"
}

export interface PortSelector extends d3.Selection<SVGElement, number, any, any> { };

export class NodeInfo {
  type?: string;

  id: string;
  x: number;
  y: number;

  icon_url: string;
  description: string;

  _def?: any;

  outputs?: number;
  inputs?: number;

  constructor(info?: NodeInfo) {
    if (info) Object.assign(this, info)
  }
}

export class NodeElement extends NodeInfo {
  w: number;
  h: number;

  resize?: boolean;
  dirty?: boolean;
  changed?: boolean;
  moved?: boolean;
  valid?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  status?: any;
  ports?: any;

  // Original X,Y in moves
  ox: number;
  oy: number;
  // Delta X,Y in moves
  dx: number;
  dy: number;

  calculateSize(isLink, label) {

    if (isLink) {
      this.w = node_height;
    }
    else {
      this.w = Math.max(node_width, 20 * (Math.ceil((calculateTextWidth(label, "node_label", 50) + (this._def.inputs > 0 ? 7 : 0)) / 20)));
    }

    this.h = Math.max(node_height, (this.outputs || 0) * 2 * 15);
  }

  renderButton(nodeSelector: NodeSelector) {
    let canvas = this.canvas;
    let state = canvas.state;

    var nodeButtonGroup = nodeSelector.append("svg:g")
      .attr("transform", () => { return "translate(" + ((this._def.align == "right") ? 94 : -25) + ",2)"; })
      .attr("class", () => { return "node_button " + ((this._def.align == "right") ? "node_right_button" : "node_left_button"); });

    nodeButtonGroup.append("rect")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("width", 32)
      .attr("height", node_height - 4)
      .attr("fill", "#eee");//function(d:NodeElement) { return this._def.colour;})

    nodeButtonGroup.append("rect")
      .attr("class", "node_button_button")
      .attr("x", () => { return this._def.align == "right" ? 11 : 5 })
      .attr("y", 4)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", 16)
      .attr("height", node_height - 12)
      .attr("fill", () => { return this._def.colour; })
      .attr("cursor", "pointer")
      .on("mousedown", () => { if (!state.inMode(CanvasMode.LASSOING) && this.isButtonEnabled()) { canvas.focusView(); nodeSelector.attr("fill-opacity", 0.2); d3.event.preventDefault(); d3.event.stopPropagation(); } })
      .on("mouseup", () => { if (!state.inMode(CanvasMode.LASSOING) && this.isButtonEnabled()) { nodeSelector.attr("fill-opacity", 0.4); d3.event.preventDefault(); d3.event.stopPropagation(); } })
      .on("mouseover", () => { if (!state.inMode(CanvasMode.LASSOING) && this.isButtonEnabled()) { nodeSelector.attr("fill-opacity", 0.4); } })
      .on("mouseout", () => {
        if (!state.inMode(CanvasMode.LASSOING) && this.isButtonEnabled()) {
          var op = 1;
          if (this._def.button.toggle) {
            op = this[this._def.button.toggle] ? 1 : 0.2;
          }
          nodeSelector.attr("fill-opacity", op);
        }
      })
      .on("click", () => this.nodeButtonClicked())
      .on("touchstart", () => this.nodeButtonClicked())
  }

  /**
   Render main component
  **/
  renderMain(nodeSelector: NodeSelector) {
    let canvas = this.canvas;
    let state = canvas.state;

    var mainRect = nodeSelector.append("rect")
      .attr("class", "node")
      .classed("node_unknown", () => { return this.type == "unknown"; })
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("fill", () => { return this._def.colour; })
      .on("mousedown", () => { this.nodeMouseDown(); })
      .on("mouseup", () => { this.nodeMouseUp(); })
      .on("touchstart", () => {
        canvas.touchStart();
        this.nodeMouseDown()
      })
      .on("touchend", (d: NodeElement) => {
        canvas.touchEnd();
        this.nodeMouseUp();
      })
      .on("mouseover", () => {
        if (state.inMode(CanvasMode.IDLE)) {
          nodeSelector.classed("node_hovered", true);
        }
      })
      .on("mouseout", () => {
        nodeSelector.classed("node_hovered", false);
      });
  }

  renderIcon(nodeSelector: NodeSelector) {
    let info: NodeElement = this;

    var icon_group = nodeSelector.append("g")
      .attr("class", "node_icon_group")
      .attr("x", 0).attr("y", 0);

    var icon_shade = icon_group.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("class", "node_icon_shade")
      .attr("width", "30")
      .attr("stroke", "none")
      .attr("fill", "#000")
      .attr("fill-opacity", "0.05")
      .attr("height", () => { return Math.min(50, this.h - 4); });

    var icon = icon_group.append("image")
      .attr("xlink:href", "")
      .attr("class", "node_icon")
      .attr("x", 0)
      .attr("width", "30")
      .attr("height", "30");

    var icon_shade_border = icon_group.append("path")
      .attr("d", () => { return "M 30 1 l 0 " + (this.h - 2) })
      .attr("class", "node_icon_shade_border")
      .attr("stroke-opacity", "0.1")
      .attr("stroke", "#000")
      .attr("stroke-width", "1");

    if ("right" == info._def.align) {
      icon_group.attr("class", "node_icon_group node_icon_group_" + info._def.align);
      icon_shade_border.attr("d", () => { return "M 0 1 l 0 " + (this.h - 2) })
    }

    this.updateIcon(nodeSelector);

    icon_group.style("pointer-events", "none");
  }

  updateIcon(nodeSelector: NodeSelector) {

    var icon = nodeSelector.select(".node_icon");
    var current_url = icon.attr("xlink:href");
    var icon_url = this.icon_url;  // utils.getNodeIcon(this._def, d);

    if (icon_url !== current_url) {
      icon.attr("xlink:href", icon_url);
      var img = new Image();
      img.src = icon_url;
      img.onload = function() {
        icon.attr("width", Math.min(img.width, 30));
        icon.attr("height", Math.min(img.height, 30));
        icon.attr("x", 15 - Math.min(img.width, 30) / 2);
      }
    }
  }

  updateInputPorts(nodeSelector: NodeSelector) {

    var inputPorts = nodeSelector.selectAll(".port_input");

    if (this.inputs === 0 && !inputPorts.empty()) {
      inputPorts.remove();
    }
    else if (this.inputs === 1 && inputPorts.empty()) {
      var inputGroup = nodeSelector.append("g").attr("class", "port_input");

      inputGroup.append("rect")
        .attr("class", "port")
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("width", 10)
        .attr("height", 10)
        .on("mousedown", (d, i) => { this.portMouseDown(PORT_TYPE_INPUT, 0); })
        .on("touchstart", (d, i) => { this.portMouseDown(PORT_TYPE_INPUT, 0); })
        .on("mouseup", (d, i) => { this.portMouseUp(PORT_TYPE_INPUT, 0); })
        .on("touchend", (d, i) => { this.portMouseUp(PORT_TYPE_INPUT, 0); })
        .on("mouseover", () => { this.portMouseOver(PORT_TYPE_INPUT, 0); })
        .on("mouseout", () => { this.portMouseOut(PORT_TYPE_INPUT, 0); });
    }
  }

  updateOutputPorts(nodeSelector: NodeSelector) {
    var numOutputs = this.outputs || 0;
    var y = (this.h / 2) - ((numOutputs - 1) / 2) * 13;
    this.ports = this.ports || d3.range(numOutputs);

    let _ports: PortSelector = nodeSelector.selectAll<SVGElement, number>(".port_output")
      .data(this.ports);

    _ports.exit().remove();

    let output_group = _ports.enter()
      .append<SVGElement>("g");

    output_group.attr("class", "port_output")
      .append("rect")
      .attr("class", "port")
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("width", 10)
      .attr("height", 10)
      .on("mousedown", (d, i) => { this.portMouseDown(PORT_TYPE_OUTPUT, i); })
      .on("touchstart", (d, i) => { this.portMouseDown(PORT_TYPE_OUTPUT, i); })
      .on("mouseup", (d, i) => { this.portMouseUp(PORT_TYPE_OUTPUT, i); })
      .on("touchend", (d, i) => { this.portMouseUp(PORT_TYPE_OUTPUT, i); })
      .on("mouseover", (d, i) => { this.portMouseOver(PORT_TYPE_INPUT, i); })
      .on("mouseout", (d, i) => { this.portMouseOut(PORT_TYPE_INPUT, i); });

    _ports = output_group.merge(_ports);

    if (!_ports.empty()) {
      numOutputs = this.outputs || 1;
      y = (this.h / 2) - ((numOutputs - 1) / 2) * 13;
      var x = this.w - 5;
      _ports.each(function(d, i) {
        var port = d3.select(this);
        //port.attr("y",(y+13*i)-5).attr("x",x);
        port.attr("transform", () => { return "translate(" + x + "," + ((y + 13 * i) - 5) + ")"; });
      });
    }
  }

  updateStatus(nodeSelector: NodeSelector) {

    if (!this.canvas.showNodeStatus || !this.status) {
      nodeSelector.selectAll(".node_status_group")
        .style("display", "none");
    } else {
      nodeSelector.selectAll(".node_status_group")
        .style("display", "inline")
        .attr("transform", "translate(3," + (this.h + 3) + ")");

      var fill = status_colours[this.status.fill]; // Only allow our colours for now

      if (this.status.shape == null && fill == null) {
        nodeSelector.selectAll(".node_status")
          .style("display", "none");
      } else {
        var style;

        if (this.status.shape == null || this.status.shape == "dot") {
          style = {
            display: "inline",
            fill: fill,
            stroke: fill
          };
        }
        else if (this.status.shape == "ring") {
          style = {
            display: "inline",
            fill: "#fff",
            stroke: fill
          }
        }

        nodeSelector.selectAll(".node_status")
          .style(style);
      }

      nodeSelector.selectAll(".node_status_label")
        .text(this.status.text ? this.status.text : "");
    }
  }

  constructor(public canvas: CanvasElement, info: NodeInfo) {
    super(info);

    this.dirty = true;
  }

  renderElement(el: SVGElement) {
    let nodeSelector = d3.select<SVGElement, NodeElement>(el);

    var isLink = (this.type === "link in" || this.type === "link out");

    nodeSelector.attr("id", this.id);
    var l = this.description; //REthis.utils.getNodeLabel(d:NodeElement);

    this.calculateSize(isLink, l);

    /*      if (this._def.badge) {
            var badge = node.append("svg:g").attr("class", "node_badge_group");
            var badgeRect = badge.append("rect").attr("class", "node_badge").attr("rx", 5).attr("ry", 5).attr("width", 40).attr("height", 15);
            badge.append("svg:text").attr("class", "node_badge_label").attr("x", 35).attr("y", 11).attr("text-anchor", "end").text(this._def.badge());
            if (this._def.onbadgeclick) {
              badgeRect.attr("cursor", "pointer")
                .on("click", function(d:NodeElement) { this._def.onbadgeclick.call(d:NodeElement); d3.event.preventDefault(); });
            }
          }*/

    /**
     Render button
    **/
    if (this._def.button) {
      this.renderButton(nodeSelector);
    }

    this.renderMain(nodeSelector);

    /**
     * Render icon
    **/
    if (this._def.icon) {
      this.renderIcon(nodeSelector);
    }

    if (!isLink) {
      var text = nodeSelector.append("svg:text").attr("class", "node_label").attr("x", 38).attr("dy", ".35em").attr("text-anchor", "start");
      if (this._def.align) {
        text.attr("class", "node_label node_label_" + this._def.align);
        if (this._def.align === "right") {
          text.attr("text-anchor", "end");
        }
      }

      var status = nodeSelector.append("svg:g").attr("class", "node_status_group").style("display", "none");

      var statusRect = status.append("rect").attr("class", "node_status")
        .attr("x", 6).attr("y", 1).attr("width", 9).attr("height", 9)
        .attr("rx", 2).attr("ry", 2).attr("stroke-width", "3");

      var statusLabel = status.append("svg:text")
        .attr("class", "node_status_label")
        .attr("x", 20).attr("y", 9);
    }

    //TODO: these ought to be SVG
    //    nodeSelector.append("image").attr("class", "node_error hidden").attr("xlink:href", "icons/node-red/node-error.png").attr("x", 0).attr("y", -6).attr("width", 10).attr("height", 9);
    //    nodeSelector.append("image").attr("class", "node_changed hidden").attr("xlink:href", "icons/node-red/node-changethis.png").attr("x", 12).attr("y", -6).attr("width", 10).attr("height", 10);
  }

  updateElement(thisElement: SVGElement) {
    let meNode = this;
    let nodeSelector = d3.select<SVGElement, NodeElement>(thisElement);

    if (this.dirty || this.selected) {
      var isLink = this.type === "link in" || this.type === "link out";

      // Resize node ?
      if (!isLink && this.resize) {
        var ow = this.w;

        this.calculateSize(isLink, this.description);
        this.x += (this.w - ow) / 2;
        this.resize = false;
      }

      // reposition
      nodeSelector.attr("transform", "translate(" + (this.x - this.w / 2) + "," + (this.y - this.h / 2) + ")");
      console.log("Node(" + this.x + ',' + this.y + ',' + this.w + ',' + this.h + ')');

      if (!this.canvas.state.inMode(CanvasMode.MOVING_ACTIVE)) {

        // resize and highlights
        nodeSelector.selectAll(".node")
          .attr("width", this.w)
          .attr("height", this.h)
          .classed("node_selected", this.selected)
          .classed("node_highlighted", this.highlighted);

        nodeSelector.selectAll(".node_icon_group_right")
          .attr("transform", () => { return "translate(" + (this.w - 30) + ",0)" });
        nodeSelector.selectAll(".node_label_right")
          .attr("x", () => { return this.w - 38 });

        this.updateInputPorts(nodeSelector);
        this.updateOutputPorts(nodeSelector);

        nodeSelector.selectAll("text.node_label")
          .text(this.description)
          .attr("y", () => { return (this.h / 2) - 1; })
          .attr("class", "node_label" + (this._def.align ? " node_label_" + this._def.align : ""));

        if (this._def.icon) {
          this.updateIcon(nodeSelector);
        }

        nodeSelector.selectAll(".node_tools")
          .attr("x", () => { return this.w - 35; })
          .attr("y", () => { return this.h - 20; });

        nodeSelector.selectAll(".node_changed")
          .attr("x", () => { return this.w - 10 })
          .classed("hidden", () => { return !(this.changed || this.moved); });

        nodeSelector.selectAll(".node_error")
          .attr("x", () => { return this.w - 10 - ((this.changed || this.moved) ? 13 : 0) })
          .classed("hidden", () => { return this.valid; });

        nodeSelector.selectAll(".port_input").each(function() {
          var port = d3.select<SVGElement, NodeElement>(this as SVGElement);
          var nel = port.datum();
          port.attr("transform", () => { return "translate(-5," + ((nel.h / 2) - 5) + ")"; })
        });

        nodeSelector.selectAll(".node_icon")
          .attr("y", () => { return (this.h - +nodeSelector.attr("height")) / 2; });
        nodeSelector.selectAll(".node_icon_shade")
          .attr("height", () => { return this.h; });
        nodeSelector.selectAll(".node_icon_shade_border")
          .attr("d", () => { return "M " + (("right" == this._def.align) ? 0 : 30) + " 1 l 0 " + (this.h - 2) });

        nodeSelector.selectAll(".node_button").attr("opacity", () => {
          return (!this.isButtonEnabled()) ? 0.4 : 1
        });
        nodeSelector.selectAll(".node_button_button").attr("cursor", () => {
          return (!this.isButtonEnabled()) ? "" : "pointer";
        });

        nodeSelector.selectAll(".node_right_button").attr("transform", () => {
          var x = this.w - 6;
          if (this._def.button.toggle && !this[this._def.button.toggle]) {
            x = x - 8;
          }
          return "translate(" + x + ",2)";
        });
        nodeSelector.selectAll(".node_right_button rect").attr("fill-opacity", () => {
          if (this._def.button.toggle) {
            return this[this._def.button.toggle] ? 1 : 0.2;
          }
          return 1;
        });

        nodeSelector.selectAll(".node_right_button")
          .attr("transform", () => {
            return "translate(" + (this.w - this._def.button.width.call(this)) + "," + 0 + ")";
          })
          .attr("fill", () => {
            return typeof this._def.button.colour === "function" ? this._def.button.colour.call(this) : (this._def.button.colour != null ? this._def.button.colour : this._def.colour)
          });

        nodeSelector.selectAll(".node_badge_group")
          .attr("transform", () => { return "translate(" + (this.w - 40) + "," + (this.h + 3) + ")"; });
        nodeSelector.selectAll("text.node_badge_label")
          .text(() => {
            if (this._def.badge) {
              if (typeof this._def.badge == "function") {
                try {
                  return this._def.badge.call(this);
                } catch (err) {
                  console.log("Definition error: " + this.type + ".badge", err);
                  return "";
                }
              } else {
                return this._def.badge;
              }
            }
            return "";
          });
      }

      this.updateStatus(nodeSelector);

      if (!this.canvas.showNodeStatus || !this.status) {
        nodeSelector.selectAll(".node_status_group")
          .style("display", "none");
      } else {
        nodeSelector.selectAll(".node_status_group")
          .style("display", "inline")
          .attr("transform", "translate(3," + (this.h + 3) + ")");

        var fill = status_colours[this.status.fill]; // Only allow our colours for now

        if (this.status.shape == null && fill == null) {
          nodeSelector.selectAll(".node_status")
            .style("display", "none");
        } else {
          var style;

          if (this.status.shape == null || this.status.shape == "dot") {
            style = {
              display: "inline",
              fill: fill,
              stroke: fill
            };
          }
          else if (this.status.shape == "ring") {
            style = {
              display: "inline",
              fill: "#fff",
              stroke: fill
            }
          }

          nodeSelector.selectAll(".node_status")
            .style(style);
        }

        nodeSelector.selectAll(".node_status_label")
          .text(this.status.text ? this.status.text : "");
      }

      this.dirty = false;
    }

  }

  nodeMouseDown() {
    let canvas = this.canvas;

    canvas.focusView();

    canvas.pointer.nodeMouseDown(this);

    if (this.selected && (d3.event.ctrlKey || d3.event.metaKey)) {
      // Deselect Node
      canvas.state.deselectNodes([this]);
    }
    else {
      // Select FLOW ... ?
      if (d3.event.shiftKey) {
        var cnodes: NodeElement[] = []; //getAllFlowNodes(this.canvas.state.mouseDownNode);

        canvas.state.clearSelection();
        canvas.state.selectNodes(cnodes);
      }
      else if (!this.selected) {
        if (!d3.event.ctrlKey && !d3.event.metaKey) {
          this.canvas.state.clearSelection();
        }

        canvas.state.selectNodes([this]);
      }

      canvas.state.deselectLinks();

      // Setup MOVING state ...
      if (d3.event.button != 2) {
        this.canvas.state.setMode(CanvasMode.MOVING);

        var mouse = canvas.pointer.eventToPoint(d3.event.target);

        // calculate mid-point, offset by touch/down position
        mouse[0] += this.x - this.w / 2;
        mouse[1] += this.y - this.h / 2;

        this.canvas.state.selectedNodes.forEach((node) => {
          // save original pos
          node.ox = node.x;
          node.oy = node.y;

          // dx,dy are delta relative to start position
          node.dx = node.x - mouse[0];
          node.dy = node.y - mouse[1];
        });

        canvas.pointer.setOriginPoint(mouse);
      }
    }

    this.dirty = true;
    this.canvas.redraw();

    d3.event.stopPropagation();
  }

  nodeMouseUp() {
    let canvas = this.canvas;

    if (canvas.pointer.nodeMouseUp(this)) {
      // Double click detected ... s
      this.canvas.state.setMode(CanvasMode.IDLE);

      // edit me
      //editor.edit(d);

      d3.event.stopPropagation();
      return;
    }

    let direction = 0//this._def ? (this.inputs > 0 ? 1 : 0) : (this.direction == "in" ? 0 : 1)
    this.portMouseUp(direction, 0);

    canvas.state.setMode(CanvasMode.IDLE);
    d3.event.stopPropagation();
  }

  isButtonEnabled() {
    var buttonEnabled = true;
    if (this._def.button.hasOwnProperty('enabled')) {
      if (typeof this._def.button.enabled === "function") {
        buttonEnabled = this._def.button.enablethis.call(this);
      } else {
        buttonEnabled = this._def.button.enabled;
      }
    }

    return buttonEnabled;
  }

  nodeButtonClicked() {
    if (this._def.button.toggle) {
      this[this._def.button.toggle] = !this[this._def.button.toggle];
      this.dirty = true;
    }

    if (this._def.button.onclick) {
      try {
        this._def.button.onclick.call(this);
      } catch (err) {
        console.log("Definition error: " + this.type + ".onclick", err);
      }
    }

    if (this.dirty) {
      this.canvas.redraw();
    }

    d3.event.preventDefault();
  }

  downPortType;
  downPortIndex;

  portMouseDown(portType, portIndex) {
    let canvas = this.canvas;
    let state = canvas.state;

    canvas.pointer.nodeMouseDown(this);
    this.downPortType = portType;
    this.downPortIndex = portIndex || 0;

    if (!state.inMode(CanvasMode.QUICK_JOINING)) {
      state.setMode(CanvasMode.JOINING);
      document.body.style.cursor = "crosshair";
      if (d3.event.ctrlKey || d3.event.metaKey) {
        state.setMode(CanvasMode.QUICK_JOINING);

        canvas.showDragLines([{ node: this, portType: this.downPortType, portIndex: this.downPortIndex }]);
        //        $(window).on('keyup', disableQuickJoinEventHandler);
      }
    }

    d3.event.stopPropagation();
    d3.event.preventDefault();
  }

  portMouseUp(portType, portIndex) {
    let canvas = this.canvas;
    let state = canvas.state;

    if (state.inMode(CanvasMode.QUICK_JOINING)) {
      if (state.dragLinks[0].node === this) {
        return;
      }
    }

    document.body.style.cursor = "";
    if (state.inModes([CanvasMode.JOINING, CanvasMode.QUICK_JOINING])) {
      let mouseUpNode: NodeElement = this;

      if (typeof TouchEvent != "undefined" && d3.event instanceof TouchEvent) {
        let nodes = canvas.vis.selectAll<SVGElement, NodeElement>(".nodegroup")
          .filter((n) => {
            var hw = n.w / 2;
            var hh = n.h / 2;

            return (n.x - hw < canvas.pointer.mousePosition[0] && n.x + hw > canvas.pointer.mousePosition[0] &&
              n.y - hh < canvas.pointer.mousePosition[1] && n.y + hh > canvas.pointer.mousePosition[1]);
          });

        nodes.each((n) => {
          mouseUpNode = n;
          this.downPortType = mouseUpNode.inputs > 0 ? PORT_TYPE_INPUT : PORT_TYPE_OUTPUT;
          this.downPortIndex = 0;
        });
      }

      var i;
      var addedLinks = [];
      var removedLinks = [];

      for (i = 0; i < state.dragLinks.length; i++) {
        if (state.dragLinks[i].link) {
          removedLinks.push(state.dragLinks[i].link)
        }
      }

      for (i = 0; i < state.dragLinks.length; i++) {
        if (portType != state.dragLinks[i].portType && mouseUpNode !== state.dragLinks[i].node) {
          var drag_line = state.dragLinks[i];
          var src, dst, src_port, dst_port;
          if (drag_line.portType === PORT_TYPE_OUTPUT) {
            src = drag_line.node;
            src_port = drag_line.portIndex;
            dst = mouseUpNode;
            dst_port = portIndex
          } else if (drag_line.portType === PORT_TYPE_INPUT) {
            src = mouseUpNode;
            dst = drag_line.node;
            src_port = portIndex;
            dst_port = drag_line.portIndex;
          }

          let existingLink = state.links.some((link) => {
            return (link.source == src) && (link.target == dst) && (link.sourcePort == src_port);
          });

          if (!existingLink) {
            let link = canvas.state.addLink(src, src_port, dst, dst_port);

            canvas.state.selectLinks([link]);
          }
        }
      }

      if (canvas.state.inMode(CanvasMode.QUICK_JOINING)) {
        if (addedLinks.length > 0) {
          canvas.hideDragLines();
          if (portType === PORT_TYPE_INPUT && this.outputs > 0) {
            canvas.showDragLines([{ node: this, port: 0, portType: PORT_TYPE_OUTPUT }]);
          } else if (portType === PORT_TYPE_OUTPUT && this.inputs > 0) {
            canvas.showDragLines([{ node: this, port: 0, portType: PORT_TYPE_INPUT }]);
          } else {
            canvas.pointer.resetPointer();
          }
        }
        canvas.redraw();
        return;
      }

      canvas.pointer.resetPointer();
      canvas.hideDragLines();
      canvas.redraw();
    }
  }

  portMouseOver(type, index) {

  }
  portMouseOut(type, index) {

  }
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

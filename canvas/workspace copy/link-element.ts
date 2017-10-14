import { CanvasElement } from './canvas-element';
import { NodeInfo, node_width, node_height } from './node-element';

import * as d3 from 'd3';

const space_width = 5000,
  space_height = 5000,
  lineCurveScale = 0.75,
  scaleFactor = 1;

export class LinkInfo {
  source: NodeInfo;
  sourcePort: any;
  target: NodeInfo;
  targetPort: any;

  added?: boolean;
  link: any;
  selected?: boolean;
  x1?;
  x2?;
  y1?;
  y2?;

  constructor(info?: any) {
    if (info) Object.assign(this, info)
  }

  get id(): string {
    return this.source.id + ":" + this.sourcePort + ":" + this.target.id + ":" + this.targetPort;
  }
}

export interface LinkSelector extends d3.Selection<SVGElement, LinkElement, any, any> { }

export class LinkElement extends LinkInfo {
  linkSelector: LinkSelector;

  constructor(el: SVGElement, public canvas: CanvasElement, info: LinkInfo) {
    super(info);

    let linkSelector = this.linkSelector = d3.select<SVGElement, LinkElement>(el);

    this.added = true;
    linkSelector.append("svg:path").attr("class", "link_background link_path")
      .on("mousedown", (d: LinkInfo) => {
        canvas.state.clearSelection();
        canvas.state.selectLinks([this]);

        canvas.redraw();
        canvas.focusView();
        d3.event.stopPropagation();
      })
      .on("touchstart", (d: LinkInfo) => {
        canvas.state.clearSelection();
        canvas.state.selectLinks([this]);

        canvas.redraw();
        canvas.focusView();
        d3.event.stopPropagation();

        var obj = d3.select(document.body);
        var touch0 = d3.event.touches.item(0);
        var pos = [touch0.pageX, touch0.pageY];

        canvas.state.startTouch(undefined, () => {
          //showTouchMenu(obj, pos);
        });
      });

    linkSelector.append("svg:path").attr("class", "link_outline link_path");

    linkSelector.append("svg:path").attr("class", "link_line link_path")
      .classed("link_link", function(d: LinkInfo) { return d.link });
  }

  updateLink(thisElement: SVGElement, dirtyNode: boolean) {
    let d = this;

    var link = d3.select<SVGElement, LinkElement>(thisElement);

    let links = link.selectAll<SVGElement, LinkElement>('.link_path');
    links.each(function(d) {
      let link = d3.select(this);

      if (d.added /*|| d === this.state.selected_link*/ || d.selected || dirtyNode) {
        link.attr("d", (d: LinkInfo) => {
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

          console.log("Link(" + d.x1 + ',' + d.y1 + ',' + d.x2 + ',' + d.y2 + ')');

          return "M " + d.x1 + " " + d.y1 +
            " C " + (d.x1 + scale * node_width) + " " + (d.y1 + scaleY * node_height) + " " +
            (d.x2 - scale * node_width) + " " + (d.y2 - scaleY * node_height) + " " +
            d.x2 + " " + d.y2;
        });
      }

      link.classed("link_selected", (d: LinkInfo) => { return /*d === this.state.selected_link ||*/ d.selected; });

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

    });
  }
}

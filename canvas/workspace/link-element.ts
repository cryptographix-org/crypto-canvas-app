import { CanvasElement } from './canvas-element';
import { NodeElement, NodeInfo, node_width, node_height } from './node-element';

import * as d3 from 'd3';

const space_width = 5000,
  space_height = 5000,
  lineCurveScale = 0.75,
  scaleFactor = 1;

export class LinkInfo {
  id: string;
  source: NodeElement;
  sourcePort: any;
  target: NodeElement;
  targetPort: any;

  constructor(info?: any) {
    if (info) Object.assign(this, info)
  }
}

export interface LinkSelector extends d3.Selection<SVGElement, LinkElement, any, any> { }

export class LinkElement extends LinkInfo {
  x1?;
  x2?;
  y1?;
  y2?;

  added?: boolean;
  link: any;
  selected?: boolean;

  constructor(public canvas: CanvasElement, info: LinkInfo) {
    super(info);

    this.added = true;
  }

  renderElement(el: SVGElement) {
    let linkSelector = d3.select<SVGElement, LinkElement>(el);
    let canvas = this.canvas;

    linkSelector.append("svg:path").attr("class", "link_background link_path")
      .on("mousedown", (link) => {
        canvas.state.clearSelection();
        canvas.state.selectLinks([link]);

        canvas.redraw();
        canvas.focusView();
        d3.event.stopPropagation();
      })
      .on("mouseup", (link) => {
        if (link.selected) {
          d3.event.stopPropagation();
        }
      })
      .on("touchstart", (link) => {
        canvas.state.clearSelection();
        canvas.state.selectLinks([link]);

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

    linkSelector.append<SVGElement>("svg:path").attr("class", "link_line link_path")
      .classed("link_link", function(d) { return !d.link });
  }

  updateLink(thisElement: SVGElement, dirtyNode: boolean) {
    let linkSelector = d3.select<SVGElement, LinkElement>(thisElement);

    var links = linkSelector.selectAll<SVGElement, LinkElement>('.link_path');

    links.each(function(link) {
      let linkPath = d3.select<SVGElement, LinkElement>(this);

      if (link.added || link.selected || dirtyNode) {
        linkPath.attr("d", (d) => {
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
    });

    linkSelector.classed("link_selected", (link) => {
      return link.selected;
    });
  }
}

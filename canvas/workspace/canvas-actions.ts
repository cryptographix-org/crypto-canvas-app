import { CanvasElement } from './canvas-element';
import { CanvasMode } from './canvas-state';
import { NodeElement } from './node-element';
import { LinkElement } from './link-element';
import { NodeMap, LinkMap } from './canvas-state';

export class CanvasActions {
  canvas: CanvasElement;

  constructor(canvas: CanvasElement) {
    this.canvas = canvas;

  }

  unselectAll() {

  }

  selectNodes() {

  }

  selectLinks() {

  }

  selectAll() {

  }

  moveSelection() {

  }

  clipLinks: LinkElement[] = [];
  clipNodes: NodeMap = new Map<string, NodeElement>();
  copySelection() {
    let state = this.canvas.state;

    this.clipNodes.clear();
    this.clipLinks = [];

    if (state.selectedNodes.size) {
      state.selectedNodes.forEach((node) => {
        this.clipNodes.set(node.id, new NodeElement(this.canvas, node));
      });

      let nodes = Array.from<NodeElement>(this.clipNodes.values());

      state.getLinksForNodes(nodes).forEach((link) => {
        link = new LinkElement(this.canvas, link);

        if (this.clipNodes.get(link.source.id))
          link.source = this.clipNodes.get(link.source.id);
        if (this.clipNodes.get(link.target.id))
          link.target = this.clipNodes.get(link.target.id);

        this.clipLinks.push(link);
      })
    }

    state.selectedLinks.forEach((link) => {
      this.clipLinks.push(new LinkElement(this.canvas, link));
    });
  }

  pasteSelection() {
    let state = this.canvas.state;

    state.clearSelection();

    let nodes = Array.from<NodeElement>(this.clipNodes.values());
    let links = this.clipLinks;

    state.importNodes(nodes, links);
    state.selectNodes(nodes);

    if (this.clipNodes.size > 0)
      state.selectLinks(this.clipLinks);

    state.setMode(CanvasMode.IMPORT_DRAGGING);
    if (!this.canvas.pointer.hasOriginPoint)
      this.canvas.pointer.setOriginPoint([0, 0]);

    this.canvas.redraw();
  }

  deleteSelection() {
    let state = this.canvas.state;

    let selNodes = state.selectedNodes;
    if (selNodes.size) {
      let nodes = Array.from<NodeElement>(selNodes.values());

      state.deleteNodes(nodes);

      state.deselectNodes();
    }

    let selLinks = state.selectedLinks;
    if (selLinks.size) {
      let links = Array.from<LinkElement>(selLinks.values());

      state.deleteLinks(links);

      state.deselectLinks();
    }

    this.canvas.redraw();
  }

  editSelection() {

  }

  importNodes() {

  }

  zoomViewport(zoom: number) {
    this.canvas.zoomViewport(zoom);
  }

  toggleShowGrid() {

  }

  toggleSnapGrid() {

  }

  undo() {

  }
  repeat() {

  }
}

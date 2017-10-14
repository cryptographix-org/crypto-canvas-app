import { Panel } from '../core';
import { CanvasElement } from './canvas-element';
import { NodeElement, NodeInfo } from './node-element';
import { LinkElement, LinkInfo } from './link-element';
import * as $ from 'jquery';

declare function require(name: string): string;
require('./workspace.scss');

export class Workspace extends Panel {
  canvas: CanvasElement;

  constructor(me: HTMLElement) {
    super(me);

    var canvas = this.canvas = new CanvasElement($(me).find('#workspace-canvas')[0]);

    let actions = canvas.actions;


    $("#btn-zoom-out").click(function() { actions.zoomViewport(+1); });
    $("#btn-zoom-zero").click(function() { actions.zoomViewport(0); });
    $("#btn-zoom-in").click(function() { actions.zoomViewport(-1); });

  }

  getTemplate(): string {
    return `
    <div id='workspace-header' style='background-color: #AC57A0;'><span style='height:100%;'>&nbsp;**&nbsp;</span></div>
    <div id='workspace-canvas' style='background-color: #0E1331;'>
    </div>
    <div id='workspace-footer' style='background-color: #0E1331;'>
      <a class="workspace-footer-button" id="btn-zoom-out" href="#">
        <i class="fa fa-minus"></i>
      </a>
      <a class="workspace-footer-button" id="btn-zoom-zero" href="#">
          <i class="fa fa-circle-o"></i>
      </a>
      <a class="workspace-footer-button" id="btn-zoom-in" href="#"><i class="fa fa-plus"></i>
      </a>
    </div>
    <div id='workspace-toolbar' style='background-color: #D9BB25;'></div>`;
  }
}

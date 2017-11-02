require('./canvas-app.scss');

import { Header } from './header';
import { Workspace } from './workspace';
import { Palette } from './palette';
import { Sidebar } from './sidebar';
import { Separator } from './separator';
import { ComponentRegistry } from '@shared';

declare function require(name: string): string;

import * as $ from 'jquery';

export class CanvasApp {
  private header: Header;
  private workspace: Workspace;
  private palette: Palette;
  private sidebar: Sidebar;
  private separator: Separator;

  public registry: ComponentRegistry = new ComponentRegistry();

  constructor(body: JQuery) {
    this.header = new Header(body.find('#header')[0]);
    this.workspace = new Workspace(this.registry, body.find('#workspace')[0]);
    this.palette = new Palette(body.find('#palette')[0], this.registry);
    this.sidebar = new Sidebar(body.find('#sidebar')[0]);
    this.separator = new Separator(body.find('#sidebar-separator')[0], this.workspace, this.sidebar);

    $('#btn-palette-toggle').click(() => {
      $("body").toggleClass("palette-hidden");
      //Cookies.set(x, $("body").hasClass("sidebar-hidden"), { expires: 30 });
    });
    $('#btn-sidebar-toggle').click(() => {
      $("body").toggleClass("sidebar-hidden");
      //Cookies.set(x, $("body").hasClass("sidebar-hidden"), { expires: 30 });
    });
  }
}

declare function require(name: string): string;
require('./core.scss');

import * as $ from 'jquery';

export abstract class Panel {
  constructor(public element: HTMLElement) {

    let tmpl = this.getTemplate();
    if (tmpl.length)
      $(element).html(tmpl);

  }

  abstract getTemplate(): string;
}

export class Element {
  constructor(public element: HTMLElement) {

  }
}

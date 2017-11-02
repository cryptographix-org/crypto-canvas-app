declare function require(name: string): string;
//require('./core.scss');

export { Panel } from './elements/panel';

export class Element {
  constructor(public element: HTMLElement) {

  }
}

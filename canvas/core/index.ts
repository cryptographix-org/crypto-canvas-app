declare function require(name: string): string;
require('./core.scss');

export { Panel } from './elements/panel';
export { ComponentLibrary, ComponentRegistry } from '../../shared';

export class Element {
  constructor(public element: HTMLElement) {

  }
}

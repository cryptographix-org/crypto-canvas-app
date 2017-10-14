declare function require(name: string): string;
const css = require('./canvas-app.scss');

import { CanvasApp } from './canvas-app';
import * as jQuery from 'jquery';
import 'jqueryui';

jQuery(function($) {
  new CanvasApp($('body'));
});

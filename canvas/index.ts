import { CanvasApp } from './canvas-app';
import * as jQuery from 'jquery';
import 'jqueryui';

import { ComponentLibrary } from '@shared'

jQuery(function($) {
  let app = new CanvasApp($('body'));

  let reg = new ComponentLibrary(new URL('crypto', document.location.toString()));

  app.registry.register(reg);

  reg.loadModules()
    .then(() => {
      console.log(reg.registry.values());
    })
    .catch(e => {
      alert("error: " + JSON.stringify(e))
    });
});

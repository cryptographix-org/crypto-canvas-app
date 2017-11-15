import { Panel } from '../core';
import { ComponentRegistry } from '@shared';

import * as d3 from 'd3';
import * as $ from 'jquery';

export class Palette extends Panel {

  showCategory(container: JQuery, open: boolean) {
    if (!open) {
      container.removeClass('palette-open')
        .addClass('palette-close')
      //.find('.palette-content').css('display', 'none');
    }
    else {
      container.addClass('palette-open')
        .removeClass('palette-close')
      //.find('.palette-content').css('display', 'block');
    }
  }

  constructor(public me: HTMLElement, public registry: ComponentRegistry) {
    super(me);

    $('#palette-toggle').click(() => {
      if ($(me).hasClass('expanded'))
        $('#palette').removeClass('expanded');
      else
        $('#palette').addClass('expanded');
    });

    $('#palette-collapse-all').click(() => { this.showCategory($(me).find('.palette-category'), false); });
    $('#palette-expand-all').click(() => { this.showCategory($(me).find('.palette-category'), true); });

    this.registry.subscribe(ComponentRegistry.LIBRARY_UPDATED_EVENT, () => {
      this.refreshPalette();
    })

    this.refreshPalette();
    $('#palette').addClass('expanded');
  }

  makeDraggable(el) {
    var chart = $("#workspace-canvas");
    var chartOffset = chart.offset();
    var chartSVG = $("#workspace-canvas>svg").get(0);
    var activeSpliceLink;
    var mouseX;
    var mouseY;
    var spliceTimer;

    el.draggable(
      {
        helper: 'clone',
        appendTo: 'body',
        revert: false,
        revertDuration: 50,
        containment: '#main-container',
        start: function(e, ui) {
          ui.helper.data('component-id', el.data('component-id'))
        },
        stop: function() {
          d3.select('.link_splice').classed('link_splice', false);
          if (spliceTimer) { clearTimeout(spliceTimer); spliceTimer = null; }
        },
        drag: function(e, ui) {

          // TODO: this is the margin-left of palette node. Hard coding
          // it here makes me sad
          //console.log(ui.helper.position());
          ui.position.left += 27.5;

          let def = { inputs: 1, outputs: 5 };

          if (def.inputs > 0 && def.outputs > 0) {
            let mouseX = ui.position.left + (ui.helper.width() / 2) - chartOffset.left + chart.scrollLeft();
            let mouseY = ui.position.top + (ui.helper.height() / 2) - chartOffset.top + chart.scrollTop();

            if (!spliceTimer) {
              spliceTimer = setTimeout(function() {
                var nodes = [];
                var bestDistance = Infinity;
                var bestLink = null;
                if (chartSVG["getIntersectionList"]) {
                  var svgRect = chartSVG["createSVGRect"]();
                  svgRect.x = mouseX;
                  svgRect.y = mouseY;
                  svgRect.width = 1;
                  svgRect.height = 1;
                  nodes = chartSVG["getIntersectionList"](svgRect, chartSVG);
                  //mouseX /= RED.view.scale();
                  //mouseY /= RED.view.scale();
                } else {
                  // Firefox doesn't do getIntersectionList and that
                  // makes us sad
                  //mouseX /= RED.view.scale();
                  //mouseY /= RED.view.scale();
                  //nodes = RED.view.getLinksAtPoint(mouseX, mouseY);
                }
                for (var i = 0; i < nodes.length; i++) {
                  if (d3.select(nodes[i]).classed('link_background')) {
                    var length = nodes[i].getTotalLength();
                    for (var j = 0; j < length; j += 10) {
                      var p = nodes[i].getPointAtLength(j);
                      var d2 = ((p.x - mouseX) * (p.x - mouseX)) + ((p.y - mouseY) * (p.y - mouseY));
                      if (d2 < 200 && d2 < bestDistance) {
                        bestDistance = d2;
                        bestLink = nodes[i];
                      }
                    }
                  }
                }
                if (activeSpliceLink && activeSpliceLink !== bestLink) {
                  d3.select(activeSpliceLink.parentNode).classed('link_splice', false);
                }
                if (bestLink) {
                  d3.select(bestLink.parentNode).classed('link_splice', true)
                } else {
                  d3.select('.link_splice').classed('link_splice', false);
                }
                if (activeSpliceLink !== bestLink) {
                  if (bestLink) {
                    $(ui.helper).data('splice', d3.select(bestLink).data()[0]);
                  } else {
                    $(ui.helper).removeData('splice');
                  }
                }
                activeSpliceLink = bestLink;
                spliceTimer = null;
              }, 200);
            }
          }
        }
      });

  }

  refreshNodes(categoryEl: JQuery, cat: string) {
    let comps = this.registry.definitions;

    let contentEl = categoryEl.find('.palette-content');

    comps.forEach((comp) => {
      let name = comp.name;
      let compactName = name.split(' ').join('-');
      if (comp.category == cat) {
        let el = contentEl.find('#palette_node_' + compactName);

        if (el.length == 0) {
          /*      el = contentEl.append(`
                <div id="palette_node_${compactName}" class="palette_node " style="background-color: rgb(192, 237, 192); height: 48px; overflow: hidden;">
                <div class="palette_label" style="margin-left: 0px">${name.split(' ').join('<br/>')}</div>
                <!--div class="palette_icon_container">
                  <div class="palette_icon" xstyle="background-image: url(icons/node-red/alert.png)"></div>
                </div-->
                <div class="palette_port palette_port_input" style="top: 9px;"></div>
                <div class="palette_port palette_port_output" style="top: 9px;"></div>
                </div>
                `);*/

          /*      <!--div id="palette_node_${compactName}" class="palette_node" style="background-color: rgb(192, 237, 192); height: 48px; overflow: hidden;">
                <svg width="10" height="30" fill="#cecece" version="1.1"><rect x="0" y="0" width="3" height="3"></rect>
                <rect x="6" y="0" width="3" height="3"></rect><rect x="0" y="8" width="3" height="3"></rect><rect x="6" y="8" width="3" height="3"></rect><rect x="0" y="16" width="3" height="3"></rect><rect x="6" y="16" width="3" height="3"></rect><rect x="0" y="24" width="3" height="3"></rect><rect x="6" y="24" width="3" height="3"></rect></svg-->

          <!--a class="clearfix">
          <span class="api-design inline-block activity-icon icon-30"></span>
          <span class="inline-block truncate" title="API Design">${name}</span>
          <span class="material-icons inline-block right">keyboard_arrow_down</span>
          </a>
          </li-->


                  <!--li class="palette_label" style="margin-left: 0px">
                  ${name.split(' ').join('<br/>')}</div>
                  <!--div class="palette_icon_container">
                  <div class="palette_icon" xstyle="background-image: url(icons/node-red/alert.png)"></div>
                  </div>
                  <div class="palette_port palette_port_input" style="top: 9px;"></div>
                  <div class="palette_port palette_port_output" style="top: 9px;"></div>
                </li-->*/
          contentEl.append(`
<li title="${comp.description}" class="palette-node">
 <div id="palette_node_${compactName}" class="palette-node">
  <a class="clearfix" title="${comp.description}">
    <span class="" style="width: 10px"></span>
    <span class="inline-block mrm mtm">
      <svg width="10" height="30" fill="#cecece" version="1.1"><rect x="0" y="0" width="3" height="3"></rect><rect x="6" y="0" width="3" height="3"></rect><rect x="0" y="8" width="3" height="3"></rect><rect x="6" y="8" width="3" height="3"></rect><rect x="0" y="16" width="3" height="3"></rect><rect x="6" y="16" width="3" height="3"></rect><rect x="0" y="24" width="3" height="3"></rect><rect x="6" y="24" width="3" height="3"></rect></svg>
    </span>
    <span class="palette-icon icon-24" style="background-image: url(${comp.meta.iconURL})">
    </span>
    <span class="palette-node-name" title="${comp.description}">${comp.name}</span>
  </a>
  </div>
</li>`);

          el = contentEl.find('#palette_node_' + compactName);

          el.data('component-id', comp.id);

          el.click((evt) => { evt.preventDefault(); })

          this.makeDraggable(el);
        }
      }
    });
  }

  refreshCategory(palette: JQuery, category: string) {
    let categoryEl = palette.find('#palette-container-' + category);

    // Not in DOM, create div
    if (!categoryEl.length) {
      // Initially closed
      palette.append(`
<li id="palette-container-${category}" class="palette-category palette-close">
  <a id="palette-header-${category}" class="palette-header">
    <span class="api-design inline-block palette-icon icon-30"></span>
    <span class="inline-block truncate" title="${category}">${category}</span>
    <i class="inline-block right fa fa-angle-down"></i>
  </a>

  <ul class="palette-content" id="palette-base-category-${category}">
  </ul>
</li>`);

      categoryEl = palette.find('#palette-container-' + category);

      // Make 'openable/closeable'
      categoryEl.find('.palette-header').click((a) => {
        this.showCategory(categoryEl, !categoryEl.hasClass('palette-open'));
      });
    }

    this.refreshNodes(categoryEl, category);
  }

  refreshPalette() {
    let palette = $(this.me).find('#palette-container');

    let categories = this.registry.categories;
    let categoryElements = palette.find('.palette-category');

    // Remove missing categories
    categoryElements.each((idx, el) => {
      let catName = $(el).attr('id').substr('palette-container-'.length);
      if (categories.findIndex((a) => a == catName) < 0)
        $(el).remove();
    });

    let empty = !categoryElements.length;

    // Refresh (or insert) active categoriess
    categories.forEach((cat) => {
      this.refreshCategory(palette, cat);
    });

    if (empty && categories.length)
      this.showCategory(palette.find('.palette-category').first(), true);
  }

  getTemplate(): string {
    return `
<!--img src="red/images/spin.svg" class="palette-spinner hide" style="display: none;"-->
<div id="palette-search" class="palette-search">
  <div class="palette-search-container">
    <i class="fa fa-search"></i>
    <input type="text" data-i18n="[placeholder]palette.filter" placeholder="filter">
    <a href="#"><i class="fa fa-times"></i></a>
    <span class="palette-search-results hide"></span>
  </div>
  <div class="palette-button-container">
    <a id="palette-collapse-all" class="palette-button" href="#">
    <i class="fa fa-angle-double-up"></i>
    </a>
    <a id="palette-expand-all" class="palette-button" href="#">
    <i class="fa fa-angle-double-down"></i>
    </a>
  </div>
</div>

<ul id="palette-container" class="category-list">
</ul>

<a id="palette-toggle" class="button-collapse">
  <i class="material-icons">&#xE31C;</i>
  <span>Palette</span>
</a>

<div id="palette-shade" class="hide" style="display: none;"></div>
`;
  }
}

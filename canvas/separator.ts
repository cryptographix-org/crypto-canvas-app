import { Workspace } from './workspace';
import { Sidebar } from './sidebar';
import { Panel } from './core';
import * as $ from 'jquery';

class SidebarSeparatorStatus {
  opening?: boolean;
  closing?: boolean;
  start?: number;
  chartWidth?: number;
  chartRight?: number;
  width?: number;
}

export class Separator extends Panel {
  constructor(me: HTMLElement, private workspace: Workspace, private sidebar: Sidebar) {
    super(me);

    var sidebarSeparator: SidebarSeparatorStatus = {};
    let workspaceElement = $(workspace.element);
    let sidebarElement = $(sidebar.element);

    $(me).draggable({
      axis: "x",

      start: function(event, ui) {
        sidebarSeparator.closing = false;
        sidebarSeparator.opening = false;

        var winWidth = $(window).width();

        sidebarSeparator.start = ui.position.left;
        sidebarSeparator.chartWidth = workspaceElement.width();
        sidebarSeparator.chartRight = winWidth - workspaceElement.width() - workspaceElement.offset().left - 2;
        /*                if (!RED.menu.isSelected("menu-item-sidebar"))
        {
                            sidebarSeparator.opening = true;
                            var newChartRight = 7;
                            sidebarElement.addClass("closing");
                            workspaceElement.css("right",newChartRight);
        //                    $("#editor-stack").css("right",newChartRight+1);
                            sidebarElement.width(0);
        //                    RED.menu.setSelected("menu-item-sidebar",true);
        //                    RED.events.emit("sidebar:resize");
                        }*/
        sidebarSeparator.width = sidebarElement.width();
      },

      drag: function(event, ui) {
        var d = ui.position.left - sidebarSeparator.start;
        var newSidebarWidth = sidebarSeparator.width - d;
        if (sidebarSeparator.opening) {
          newSidebarWidth -= 3;
        }
        if (newSidebarWidth > 150) {
          if (sidebarSeparator.chartWidth + d < 200) {
            ui.position.left = 200 + sidebarSeparator.start - sidebarSeparator.chartWidth;
            d = ui.position.left - sidebarSeparator.start;
            newSidebarWidth = sidebarSeparator.width - d;
          }
        }
        if (newSidebarWidth < 150) {
          if (!sidebarSeparator.closing) {
            sidebarElement.addClass("closing");
            sidebarSeparator.closing = true;
          }
          if (!sidebarSeparator.opening) {
            newSidebarWidth = 150;
            ui.position.left = sidebarSeparator.width - (150 - sidebarSeparator.start);
            d = ui.position.left - sidebarSeparator.start;
          }
        } else if (newSidebarWidth > 150 && (sidebarSeparator.closing || sidebarSeparator.opening)) {
          sidebarSeparator.closing = false;
          sidebarElement.removeClass("closing");
        }
        var newChartRight = sidebarSeparator.chartRight - d;
        workspaceElement.css("right", newChartRight);
        //              $("#editor-stack").css("right",newChartRight+1);
        sidebarElement.width(newSidebarWidth);
        //                sidebar_tabs.resize();
        //                RED.events.emit("sidebar:resize");
      },
      stop: function(event, ui) {
        if (sidebarSeparator.closing) {
          sidebarElement.removeClass("closing");
          //                    RED.menu.setSelected("menu-item-sidebar",false);
          if (sidebarElement.width() < 180) {
            sidebarElement.width(180);
            workspaceElement.css("right", 187);
            //                        $("#editor-stack").css("right",188);
          }
        }
        $("#sidebar-separator").css("left", "auto");
        $("#sidebar-separator").css("right", (sidebarElement.width() + 2) + "px");
        //                RED.events.emit("sidebar:resize");
      }
    });

  }


  getTemplate() {
    return ``;
  }


}

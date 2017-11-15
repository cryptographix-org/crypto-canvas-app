import { Panel } from '../core';

import * as d3 from 'd3';
import * as $ from 'jquery';

export class Header extends Panel {
  constructor(me: HTMLElement) {
    super(me);
  }

  getTemplate() {
    return `
      <header-group style="float: left">
        <header-logo>
          <img src="static/images/cgx-logo.png"/>
        </header-logo>
        <header-title>Canvas Project--Canvas Project--Canvas Project--Canv</header-title>
      </header-group>
      <header-group style="float: right; top: 0;width: auto;">
        <header-button id="header-view-button">
          <a href="#"><i class="material-icons">&#xE335;</i></a>
          <span style="font-size: 14px; margin-left: 6px;vertical-align: 6px; display: inline-block">Canvas</span>

          <a href="#" style="display: inline-block; margin-left: -8px;">
            <i class="material-icons">&#xE5C5;</i>
          </a>
          <div class="sub-menu" style="position: absolute; margin-left: -8px; margin-top: -4px; padding-left: 4px; background-color: #d7d8d9; box-shadow: 0px 2px 8px rgba(0,0,0,0.1); width: 120px; " >
            <ul style="display: block; font-size: 14px; line-height: 24px; padding: 4px 4px; color: #448">
              <li id="menu-view-canvas"><a href="#">
                <i class="material-icons" style="color: #448; margin-right: 12px; line-height: 36px;">&#xE335;</i>
                <span style="display: inline-block; vertical-align: 8px;color: #448;">Canvas</span>
              </a></li>
              <li id="menu-view-flow"><a href="#">
                <i class="material-icons" style="color: #448; margin-right: 12px;">&#xE8D4;</i>
                <span style="display: inline-block; vertical-align: 8px;color: #448;">Flow</span>
              </a></li>
              <li id="menu-view-pipeline"><a href="#">
                <i class="material-icons" style="color: #448; margin-right: 12px;">&#xE8D5;</i>
                <span style="display: inline-block; vertical-align: 8px;color: #448;">Pipeline</span></a></li>
            </ul>
          </div>
        </header-button>

        <header-sep></header-sep>
        <header-button style="">
          <a href="#"><i class="material-icons">&#xE039;</i><!--span>Run</span--></a>
        </header-button>
        <header-button style=";">
          <a href="#"><i class="material-icons">&#xE036;</i><!--span>Pause</span--></a>
        </header-button>
        <header-button style="">
          <a href="#"><i class="material-icons">&#xE042;</i></a>
        </header-button>
        <header-sep></header-sep>
        <header-button style="">
          <a href="#"><i class="material-icons">&#xE8B8;</i></a>
        </header-button>
        <!--header-button style="">
          <a href="#"><i class="material-icons">&#xE83A;</i></a>
        </header-button-->
        <header-button class="noborder">
          <a href='#'><i class="material-icons">&#xE5D2;</i></a>
        </header-button>
      </header-group>
`;
  }
}

import * as PIXI from 'pixi.js';

export const MAP_FONT_SIZE    = 16; // px  

export const VIEW_FRAME_WIDTH = 2; // frame around map view area 
export const VIEW_WIDTH       = 800;
export const VIEW_HEIGHT      = 600;
export const MAP_WIDTH_CHAR   = 80;  
export const MAP_HEIGHT_CHAR  = 60;
// export const MAP_WIDTH_CHAR   = 94;  
// export const MAP_HEIGHT_CHAR  = 94;
export const SCREEN_WIDTH     = 1024; // px
export const SCREEN_HEIGHT    = 768;

export const HERO_WALK_BUFFER = 128; // buffer to edge before scrolling the map 

// font widths in pixels. Figured out through trial and error .. so
// clearly brittle 
export const FONT_PIXEL_W = 11;
export const FONT_PIXEL_H = 18;

// Upper left corner of map on the screen
export { MAP_X_OFFSET };
let MAP_X_OFFSET = 0; // can only be calculated once we have the map 
export function set_map_x_offset(val){
    MAP_X_OFFSET = val;
}

export  { MAP_Y_OFFSET };
let MAP_Y_OFFSET = FONT_PIXEL_H;
export function set_map_y_offset(val){
    MAP_Y_OFFSET = val;
}

// Position of main hero sidebar
export const HERO_SIDEBAR_W = 96;
export const HERO_SIDEBAR_H = 64;
export const HERO_SIDEBAR_X_OFFSET =  6; 
export const HERO_SIDEBAR_Y_OFFSET = MAP_Y_OFFSET;

export function vex_init_pixi() {
    console.log("[vex:screen.js] initializing pixi w:%d h:%d", SCREEN_WIDTH, SCREEN_HEIGHT);
    let type = "WebGL";
    if (!PIXI.utils.isWebGLSupported()) {
        type = "canvas";
    }
    return new PIXI.Application({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
}


export function keyboard_once(value) {
  const key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = (event) => {
    if (event.key === key.value) {
      if (key.isUp && key.press) {
        key.press();
      }
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = (event) => {
    if (event.key === key.value) {
      if (key.isDown && key.release) {
        key.release();
      }
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);
  
  window.addEventListener("keydown", downListener, false);
  window.addEventListener("keyup", upListener, false);
  
  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };
  
  return key;
}

export function keyboard_press(value) {
  const key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;

  //The `downHandler`
  key.downHandler = (event) => {
    if (event.key === key.value) {
        key.press();
    }
    event.preventDefault();
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  
  window.addEventListener("keydown", downListener, false);
  
  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
  };
  
  return key;
}

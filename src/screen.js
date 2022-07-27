let MAP_FONT_SIZE    = 16; // px  

let MAP_WIDTH_CHAR   = 64;  
let MAP_HEIGHT_CHAR  = 40;
let SCREEN_WIDTH     = 1024; // px
let SCREEN_HEIGHT    = 768;

// font widths in pixels. Figured out through trial and error .. so
// clearly brittle 
let FONT_PIXEL_W = 11;
let FONT_PIXEL_H = 18;

// Upper left corner of map on the screen
let MAP_X_OFFSET = 0; // can only be calculated once we have the map 
let MAP_Y_OFFSET = FONT_PIXEL_H;

// Position of main hero sidebar
let HERO_SIDEBAR_W = 128;
let HERO_SIDEBAR_H = 64;
let HERO_SIDEBAR_X_OFFSET =  6; 
let HERO_SIDEBAR_Y_OFFSET = MAP_Y_OFFSET;


function keyboard(value) {
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

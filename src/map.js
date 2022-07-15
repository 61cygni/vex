import { InternalConvexClient, ConvexHttpClient } from "convex-dev/browser";
import convexConfig from "/convex.json";

import {set_initial_hero_in_db, update_hero} from "/src/hero.js"

export let MAP_FONT_SIZE    = 16; // px  

let MAP_WIDTH_CHAR   = 64;  
let MAP_HEIGHT_CHAR  = 40;
let SCREEN_WIDTH     = 1024; // px
let SCREEN_HEIGHT    = 768;

// font widths in pixels. Figured out through trial and error .. so
// clearly brittle 
let FONT_PIXEL_W = 11;
let FONT_PIXEL_H = 18;

// Upper left corner of map on the screen
let MAP_X_OFFSET = Math.floor((SCREEN_WIDTH - (FONT_PIXEL_W*(MAP_WIDTH_CHAR/2))) / 2);
let MAP_Y_OFFSET = FONT_PIXEL_H;

const convexhttp      = new ConvexHttpClient(convexConfig.origin);
const internal_map    = new InternalConvexClient(convexConfig.origin, updatedQueries => reactive_update_map(updatedQueries));
const { queryTokenMap, unsubscribeMap }   = internal_map.subscribe("getMap", []);

// pointers to globals
let g_app_map        = null;
let g_pixi_hero  = null;
let cur_map    = null;

let pixi_map  = null;

// Font for map
let map_sty = new PIXI.TextStyle({
  fontFamily: "Courier",
  fontSize: MAP_FONT_SIZE,
  fill: "green",
  letterSpacing : 2,
});

// Menu for side panels
let rand_banner = "(rand map)";


export function set_g_app_map(app) {
    g_app_map = app;
}

export function set_g_pixi_hero_map(hero) {
    g_pixi_hero = hero;
}

export function vex_init_pixi() {
    console.log("[vex:map.js] initializing pixi");
    let type = "WebGL";
    if (!PIXI.utils.isWebGLSupported()) {
        type = "canvas";
    }

    PIXI.utils.sayHello(type);

    set_pixi_key_hooks();
    return new PIXI.Application({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
}

function rand_clicked() {
    console.log("rand clicked!");
    set_new_map();
}

function map_update_success () {
    console.log("Successfully updated initial map");
    get_cur_map();
}

function initial_map_update_success () {
    console.log("Successfully updated initial map");
    get_initial_map();
}

function map_update_failure () {
    console.log("Failed to update initial map");
}

function set_new_map(){
    let new_map = generate_new_map();

    console.log('Setting new map');
    const res = convexhttp.mutation("setMap")(new_map, true);
    res.then(map_update_success, map_update_failure);
}

export function set_initial_map() {
    console.log('Setting initial map');
    let initial_map = generate_new_map();
    const res = convexhttp.mutation("setMap")(initial_map,false);
    res.then(initial_map_update_success, map_update_failure);
}


export function reactive_update_map (updatedQueries) {
    console.log("Change to map!");
    get_cur_map();
}


export function set_rand_banner() {
    const randsty = new PIXI.TextStyle({
      fontFamily: "Courier",
      fontSize: MAP_FONT_SIZE,
      fill: "red",
      fontWeight : "bolder"
    });

    let pixi_rand = new PIXI.Text(rand_banner, randsty);
    pixi_rand.x = 32;
    pixi_rand.y = 32;
    pixi_rand.interactive = true;
    pixi_rand.on('pointerdown', (event) => { rand_clicked(); });

    g_app_map.stage.addChild(pixi_rand);
}

function map_map_index_to_pixel(x, y){
    // It seems characters are offset by a pixel every 4 pixels .. so
    let fudge = .6;
    let px_x  = MAP_X_OFFSET + (x * FONT_PIXEL_W) + Math.floor(fudge*x);
    let px_y  = MAP_Y_OFFSET + (y * FONT_PIXEL_H);
    return [px_x,px_y];
}


function update_hero_px_loc(push){
    let px_loc = map_map_index_to_pixel(g_pixi_hero.map_x, g_pixi_hero.map_y);
    g_pixi_hero.x = px_loc[0];
    g_pixi_hero.y = px_loc[1];
    console.log("hero x "+g_pixi_hero.map_x+" : hero y "+g_pixi_hero.map_y);
    if(push == true){
        update_hero(g_pixi_hero);
    }
}

export function update_local_hero_px_loc(local_hero){
    let px_loc = map_map_index_to_pixel(local_hero.map_x, local_hero.map_y);
    local_hero.x = px_loc[0];
    local_hero.y = px_loc[1];
    console.log("local hero x "+g_pixi_hero.map_x+" : local hero y "+g_pixi_hero.map_y);
}

function pixi_draw_map() {

    if (pixi_map == null) {
	  pixi_map = new PIXI.Text(cur_map, map_sty);
    } else {
      pixi_map.text = cur_map;
    }
      pixi_map.interactive = true;

      MAP_X_OFFSET = Math.floor((SCREEN_WIDTH - pixi_map.width) / 2);
      MAP_Y_OFFSET = FONT_PIXEL_H; // magic! 


      pixi_map.x = MAP_X_OFFSET;
      pixi_map.y = MAP_Y_OFFSET;

	  g_app_map.stage.addChild(pixi_map);

      // choose a random location for the hero
      let map_size = (MAP_WIDTH_CHAR+1) * MAP_HEIGHT_CHAR; 
      let loc = 0; 
      while(pixi_map.text[loc] != ' '){
          loc = Math.floor(Math.random() * map_size);
          g_pixi_hero.map_y = Math.floor(loc / (MAP_WIDTH_CHAR+1));
          g_pixi_hero.map_x = loc - (g_pixi_hero.map_y * (MAP_WIDTH_CHAR+1)); 
          console.log("loc "+loc+" : " + cur_map[loc]);
          console.log("map_x "+g_pixi_hero.map_x+" : map_y" + g_pixi_hero.map_y);
      }

      update_hero_px_loc(true);
	  //Start the "game loop"
	  g_app_map.ticker.add((delta) => gameLoop(delta));
}

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

function set_pixi_key_hooks() {
    //Capture the keyboard arrow keys
      const left = keyboard("ArrowLeft"),
      up = keyboard("ArrowUp"),
      right = keyboard("ArrowRight"),
      down = keyboard("ArrowDown");   

      right.press = () => {
        let new_x = g_pixi_hero.map_x + 1;
        let new_y = g_pixi_hero.map_y;
        let map_index = (new_y * (MAP_WIDTH_CHAR+1)) + new_x;
        if(cur_map[map_index] != '#'){
            console.log(cur_map[new_x][new_y] );
            g_pixi_hero.map_x = new_x; 
            update_hero_px_loc(true);
        }
      };
      left.press = () => {
        let new_x = g_pixi_hero.map_x - 1;
        let new_y = g_pixi_hero.map_y;
        let map_index = (new_y * (MAP_WIDTH_CHAR+1)) + new_x;

        if(cur_map[map_index] != '#'){
            g_pixi_hero.map_x = g_pixi_hero.map_x - 1;
            update_hero_px_loc(true);
        }
      };
      up.press = () => {
        let new_x = g_pixi_hero.map_x;
        let new_y = g_pixi_hero.map_y - 1;
        let map_index = (new_y * (MAP_WIDTH_CHAR+1)) + new_x;

        if(cur_map[map_index] != '#'){
            g_pixi_hero.map_y = g_pixi_hero.map_y - 1;
            update_hero_px_loc(true);
        }
      };
      down.press = () => {
        let new_x = g_pixi_hero.map_x;
        let new_y = g_pixi_hero.map_y + 1;
        let map_index = (new_y * (MAP_WIDTH_CHAR+1)) + new_x;

        if(cur_map[map_index] != '#'){
            g_pixi_hero.map_y = g_pixi_hero.map_y + 1;
            update_hero_px_loc(true);
        }
      };
}

function gameLoop(delta) {

  
}

function initial_map_query_success(m) {
    console.log("Successfully retrieved map ");
    cur_map = m;
    console.log(cur_map);
    pixi_draw_map();
    set_initial_hero_in_db();
}

function map_query_success(m) {
    console.log("Successfully retrieved map ");
    cur_map = m;
    console.log(cur_map);
    pixi_draw_map();
}

function map_query_failure () {
    console.log("Failed to retrieve map");
}

function get_initial_map(){
    const val = convexhttp.query("getMap")();
    val.then(initial_map_query_success, map_query_failure);
}

function get_cur_map(){
    const val = convexhttp.query("getMap")();
    val.then(map_query_success, map_query_failure);
}

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}

function setCharXY(map, x, y, chr) {
  return setCharAt(map, x + (y*(MAP_WIDTH_CHAR+1)), chr); 
}

function generate_new_map(){

  let new_map   = "";
  let room_list = [];
  
  for (let y = 0; y < MAP_HEIGHT_CHAR; y++){
      for (let x = 0; x < MAP_WIDTH_CHAR; x++){
        new_map += "#";
      }
        new_map += "\n";
  }

  let number_of_rooms = Math.ceil((Math.random() * 16) + 6);

  for (let rooms = 0; rooms < number_of_rooms; rooms++) {

      // generate a random room  (12 is a magic number for max size)
      let rand_room_w = Math.floor((Math.random() * 12) + 4);
      let rand_room_h = Math.floor((Math.random() * 12) + 4);
      let rand_room_x = 1 + Math.floor((Math.random() * (MAP_WIDTH_CHAR -  (rand_room_w + 1))));
      let rand_room_y = 1 + Math.floor((Math.random() * (MAP_HEIGHT_CHAR - (rand_room_h + 1))));


      let center_x = Math.floor(rand_room_x + (rand_room_w / 2));
      let center_y = Math.floor(rand_room_y + (rand_room_h / 2));
      room_list.push([center_x, center_y]);

      for (let x = rand_room_x; x < rand_room_w + rand_room_x; x++){
          for (let y = rand_room_y; y < (rand_room_h + rand_room_y); y++){
              new_map = setCharXY(new_map, x, y, ' '); 
          }
      }

      if (rooms >= 1) {
        // make path between rooms
        new_map = create_walkway(new_map, room_list[room_list.length - 1], room_list[room_list.length - 2]);
      }

  } // number of rooms

  return new_map;
}

// Use Bresenham's line drawing algorithm to make a walkway between two
// rooms. 
function create_walkway(map, c1, c2) {
    let x1 = c1[0]; let x2 = c2[0]; let y1 = c1[1]; let y2 = c2[1];
    let dx = Math.abs(x2 - x1); 
    let sx = (x1 < x2) ? 1 : -1;
    let dy = -Math.abs(y2 - y1);
    let sy = (y1 < y2) ? 1: -1;
    let error = dx + dy;

	while (true) {
        map = setCharXY(map,x1, y1,' ');
        map = setCharXY(map,x1+1, y1,' ');
        map = setCharXY(map,x1, y1+1,' ');
        map = setCharXY(map,x1+1, y1+1,' ');
        if(x1 == x2 && y1 == y2){
          break;
        }
        let e2 = 2 * error;
        if( e2 >= dy){
            if(x1 == x2){ 
              break;
            }
            error = error + dy;
            x1 = x1 + sx;
        } 
        if(e2 <= dx){
            if( y1 == y2){
               break;
            }
            error = error + dx;
            y1 = y1 + sy;
        }
    }
    return map;
}

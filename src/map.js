import { InternalConvexClient, ConvexHttpClient } from "convex/browser";
import convexConfig from "../convex/_generated/clientConfig";

import * as PIXI from 'pixi.js';
import * as  Keyboard  from 'pixi.js-keyboard';


import  * as SCREEN from '/screen.js';
import  * as HERO from  "/hero.js";
import * as SOUND from '/sound.js';


const convexhttp_map    = new ConvexHttpClient(convexConfig);
let   convex_internal_msg = null; 

const MapDirection = {
	Upstairs: Symbol("upstairs"),
	Downstairs: Symbol("downstairs"),
	Random: Symbol("random")
}


// pointers to globals
let g_app_map       = null;
let g_pixi_hero     = null;
let cur_map         = null;
let world_container = null;

let pixi_map  = null;
let pixi_map_msg_cover = null;

// Font for map
let map_sty = new PIXI.TextStyle({
  fontFamily: "Courier",
  fontSize: SCREEN.MAP_FONT_SIZE,
  fill: "green",
  letterSpacing : 2,
});

// Map Icons
let UP_CHAR   = '^';
let DOWN_CHAR = 'v';

// Menu for side panels
let rand_banner = "(rand map)";


export function set_g_app_map(app) {
    g_app_map = app;

}

export function set_g_pixi_hero_map(hero) {
    g_pixi_hero = hero;
    console.log("HERRO BEING SET!!!!! )@#(*$@)#(*$)@#(*$@)#(*$");
    console.log(g_pixi_hero);
    console.log(g_pixi_hero.hp);
    console.log(g_pixi_hero.speed);
}


function map_update_success () {
    console.log("Successfully updated initial map");
    get_cur_map();
}

function item_update_success () {
    console.log("Successfully updated item");
}

function item_update_failure () {
    console.log("Failed to update item!");
}

function initial_map_update_success () {
    console.log("Successfully updated initial map");
    get_initial_map();
}

function map_update_failure () {
    console.log("Failed to update initial map");
}

function set_new_map(){
    let new_map = generate_new_map(true, true);

    console.log('Setting new map');
    const res = convexhttp_map.mutation("setMap")(1, new_map, true);
    res.then(map_update_success, map_update_failure);
}

// --
// <MESSAGES>
// --

// Broadcast message to everyone
function broadcast_msg_update_success(){
    console.log("Successfully sent message");
}
function broadcast_msg_update_failure(){
    console.log("Failed to send message");
}
export function broadcast_msg(channel, body, author){
    console.log('[map] sending message: ' + body);
    const res = convexhttp_map.mutation("sendMessage")(channel, body, author);
    res.then(broadcast_msg_update_success, broadcast_msg_update_failure);
}

export function display_local_msg(body, color = "red", timeout = 3000){
    const msg_sty = new PIXI.TextStyle({
    fontFamily: "Courier",
    fontSize: SCREEN.MAP_FONT_SIZE - 4,
    fill: color,
    });

    let local_msg = new PIXI.Text(body, msg_sty);
    local_msg.x = (SCREEN.SCREEN_WIDTH/2) - (local_msg.width/2);
    local_msg.y = SCREEN.SCREEN_HEIGHT - (SCREEN.MAP_FONT_SIZE+8);

    g_app_map.stage.removeChild(pixi_map_msg_cover);
    g_app_map.stage.addChild(pixi_map_msg_cover);
    g_app_map.stage.addChild(local_msg);
    setTimeout(()=>g_app_map.stage.removeChild(local_msg), timeout);
}

function reactive_msg_update (updatedQueries) {
    if(updatedQueries == ""){
        return;
    }

    console.log("Change to messages!");

    // get last message 
    const val = convexhttp_map.query("listMessages")(g_pixi_hero._id);
    val.then(list_msg_query_success, list_msg_query_failure);
}

function list_msg_query_success (m) {
    console.log("Successfully retrieved messages ");
    if(m == null){
        return;
    }
    console.log(m);
    if(""+m.channel != ""+g_pixi_hero._id){
        display_local_msg(m.body);
    }
}

function list_msg_query_failure (m) {
    console.log("Failed to retrieved messages! ");
}

// --
// </MESSAGES>
// --


// --
// <DOWNSTAIRS>
//
// XXXX FIXME RACE CONDITION
//      - currently just forces the new map to be written. But if
//      multiple players do this at the same time, one is likely to
//      end with a map no longer in the DB after it has been overridden
// --

function create_ds_update_success(map){
    let new_map = map;
    function downstairs_map_update_success(){
        console.log("[map] DOWNSTAIRS UPDATE SUCCESS!!");
        cur_map = map;
        g_pixi_hero.level++;

        HERO.hero_change_level(g_pixi_hero.level);
        console.log(cur_map);
        pixi_draw_map();
        map_set_hero_loc(MapDirection.Downstairs);
        HERO.update_hero_px_loc(true);
        map_center_on_hero();
        HERO.update_hero_px_loc(true);
        broadcast_msg(g_pixi_hero._id, "Someone has entered level "+g_pixi_hero.level, ""+g_pixi_hero._id);
    }
    return downstairs_map_update_success;
}

function create_downstairs_success_func(l) {
    let new_level = l; 
    function go_downstairs_query_success(ret){
        if(ret == null) {
            console.log("[map] succesfully queried map but level doesn't exist "); 
            console.log("[map] creating map level "+new_level); 
            let new_map = generate_new_map(true, true);
            const res = convexhttp_map.mutation("setMap")(new_level, new_map, true);
            res.then(create_ds_update_success(new_map), downstairs_map_update_failure);
        }else{
            // got a map!
            console.log("[map] successfully queried map for level "+new_level);
            cur_map = ret;
            g_pixi_hero.level++;
            HERO.hero_change_level(g_pixi_hero.level);
            pixi_draw_map();
            map_set_hero_loc(MapDirection.Downstairs);
            HERO.update_hero_px_loc(true);
            map_center_on_hero();
            HERO.update_hero_px_loc(true);
            broadcast_msg(g_pixi_hero._id, "Someone has entered level "+g_pixi_hero.level, ""+g_pixi_hero._id);
        }
    }
    return go_downstairs_query_success;
}

function downstairs_map_update_failure(){
    console.log("[map] DOWNSTAIRS UPDATE FAILURE!!");
}

function go_downstairs(){
    let new_level = g_pixi_hero.level + 1;
    const val = convexhttp_map.query("getMap")(new_level);
    val.then(create_downstairs_success_func(new_level), go_downstairs_query_fail);
    SOUND.play_heartbeat();
}

function go_downstairs_query_fail(ret){
    console.log("[map] failed to query downstairs map"); 
}

// --
// </DOWNSTAIRS>
// --

// --
// <UPSTAIRS>
// --

function create_upstairs_success_func(l) {
    let new_level = l; 
    function go_upstairs_query_success(ret){
        if(ret == null) {
            console.log("[map] FATAL upstairs map doesn't exist "); 
        }else{
            // got a map!
            console.log("[map] upstairs successfully queried map for level "+new_level);
            cur_map = ret;
            g_pixi_hero.level--;
            HERO.hero_change_level(g_pixi_hero.level);
            pixi_draw_map();
            map_set_hero_loc(MapDirection.Upstairs);
            HERO.update_hero_px_loc(true);
            map_center_on_hero();
            HERO.update_hero_px_loc(true);
            broadcast_msg(g_pixi_hero._id, "Someone has entered level "+g_pixi_hero.level, ""+g_pixi_hero._id);
        }
    }
    return go_upstairs_query_success;
}

function go_upstairs_query_fail(ret){
    console.log("[map] failed to query upstairs map"); 
}


function go_upstairs(){
    let new_level = g_pixi_hero.level - 1;
    const val = convexhttp_map.query("getMap")(new_level);
    val.then(create_upstairs_success_func(new_level), go_upstairs_query_fail);
}

// --
// </UPSTAIRS>
// --


function init_message_bar(){
    pixi_map_msg_cover = new PIXI.Graphics();
    //pixi_map_msg_cover.lineStyle({width: 2, color: 0xFFFF00, alpha: 1});
    pixi_map_msg_cover.beginFill(0x0000);
    pixi_map_msg_cover.drawRect(0, SCREEN.SCREEN_HEIGHT - (SCREEN.MAP_FONT_SIZE+8), SCREEN.SCREEN_WIDTH, 24);
    pixi_map_msg_cover.endFill();
    g_app_map.stage.addChild(pixi_map_msg_cover);
}


// Create first level of the map
export function set_initial_map(new_map, container) {
    console.log('Setting initial map');
    world_container = container;

    convex_internal_msg    = new InternalConvexClient(convexConfig, updatedQueries => reactive_msg_update(updatedQueries));
    const { queryTokenMap, unsubscribeMap }   = convex_internal_msg.subscribe("listMessages", [0]);

    set_pixi_key_hooks();
    init_message_bar();

    let initial_map = generate_new_map(false, true);

    // set map in data and force replcement
    const res = convexhttp_map.mutation("setMap")(1, initial_map, new_map);
    res.then(initial_map_update_success, map_update_failure);
}


export function map_map_index_to_pixel(x, y){
    // It seems characters are offset by a pixel every 4 pixels .. so
    let fudge = .6;
    let px_x  =  (x * SCREEN.FONT_PIXEL_W) + Math.floor(fudge*x) + pixi_map.x;
    let px_y  =  (y * SCREEN.FONT_PIXEL_H) + pixi_map.y;
    return [px_x,px_y];
}


function map_set_hero_loc(dir) {

    if(dir === MapDirection.Downstairs){
        // Look for upstairs char. If we find it, place hero just to the
        // right
        let upst_index = cur_map.indexOf(UP_CHAR);
        if(upst_index === -1){
            console.log("[map] **ERROR** going downstairs can cannot find upstairs char");
            return;
        }
        let loc = upst_index + 1;
        g_pixi_hero.map_y = Math.floor(loc / (SCREEN.MAP_WIDTH_CHAR+1));
        g_pixi_hero.map_x = loc - (g_pixi_hero.map_y * (SCREEN.MAP_WIDTH_CHAR+1)); 
    }

    else if(dir === MapDirection.Upstairs){
        // Look for upstairs char. If we find it, place hero just to the
        // right
        let upst_index = cur_map.indexOf(DOWN_CHAR);
        if(upst_index === -1){
            constole.log("[map] **ERROR** going upstairs can cannot find downstairs char");
            return;
        }
        let loc = upst_index + 1;
        g_pixi_hero.map_y = Math.floor(loc / (SCREEN.MAP_WIDTH_CHAR+1));
        g_pixi_hero.map_x = loc - (g_pixi_hero.map_y * (SCREEN.MAP_WIDTH_CHAR+1)); 
    }


    else if(dir === MapDirection.Random){
        let map_size = (SCREEN.MAP_WIDTH_CHAR+1) * SCREEN.MAP_HEIGHT_CHAR; 
        let loc = 0; 
        while(pixi_map.text[loc] != ' '){
            loc = Math.floor(Math.random() * map_size);
            g_pixi_hero.map_y = Math.floor(loc / (SCREEN.MAP_WIDTH_CHAR+1));
            g_pixi_hero.map_x = loc - (g_pixi_hero.map_y * (SCREEN.MAP_WIDTH_CHAR+1)); 
        }
    }

    else {
        console.log("[map] **ERROR** map_set_hero_loc() unknown direction");
    }

}


function pixi_draw_map() {

    if (pixi_map == null) {
	  pixi_map = new PIXI.Text(cur_map, map_sty);
    } else {
      pixi_map.text = cur_map;
    }
      pixi_map.interactive = true;

      //SCREEN.MAP_X_OFFSET = Math.floor((SCREEN.SCREEN_WIDTH - pixi_map.width) / 2);
      SCREEN.set_map_x_offset( Math.floor((SCREEN.SCREEN_WIDTH - pixi_map.width) / 2));
      SCREEN.set_map_y_offset(SCREEN.FONT_PIXEL_H); // magic! 

      // create a black background
      let textbg = new PIXI.Graphics();
      textbg.beginFill(0);
      textbg.drawRect(0, 0, 800, 600);

	  world_container.addChild(textbg);
	  world_container.addChild(pixi_map);
      world_container.addChild(g_pixi_hero);
}

export function map_center_on_hero() {
      let global_pos = g_pixi_hero.toGlobal(new PIXI.Point(0,0));

      console.log("Placed hero at global : "+global_pos.x+","+global_pos.y+")");
      let x_off = 0;
      let y_off = 0;

      x_off = global_pos.x - SCREEN.SCREEN_WIDTH/2;
      y_off = global_pos.y - SCREEN.SCREEN_HEIGHT/2;

      console.log("Adjusting map : "+x_off+","+y_off+")");
      pixi_map.x -= x_off;
      pixi_map.y -= y_off;

}

// great linear index into map array from xy coords
function map_xy_to_index(x,y){
        return (y * (SCREEN.MAP_WIDTH_CHAR+1)) + x;
}

// --
// keyboard Hooks!
// --

function set_pixi_key_hooks() {

    const keyu = SCREEN.keyboard_once("u"), // go upstairs 
    keyd = SCREEN.keyboard_once("d"); // go downstairs

    keyd.press = () => { /// go down stairs!
      let map_index = map_xy_to_index(g_pixi_hero.map_x, g_pixi_hero.map_y); 
      if(cur_map[map_index] == DOWN_CHAR){
          console.log("[map] heading downstairs!");
          console.log("[map] Hero is currently on level "+g_pixi_hero.level);
          go_downstairs();
      }
    }
    keyu.press = () => { /// go up stairs!
      let map_index = map_xy_to_index(g_pixi_hero.map_x, g_pixi_hero.map_y); 
      if(cur_map[map_index] == UP_CHAR){
          console.log("[map] heading upstairs!");
          console.log("[map] Hero is currently on level "+g_pixi_hero.level);
          go_upstairs();
      }
    }
}


let last_time = Date.now();

export function move_hero(){

    if(g_pixi_hero === null){
        return;
    }

    let new_time = Date.now();
    if ((new_time - last_time) > g_pixi_hero.speed){
        last_time = new_time;

        if (Keyboard.isKeyDown('ArrowLeft', 'KeyH')){
            keyboard_once_left();
        }
        if (Keyboard.isKeyDown('ArrowRight', 'KeyL')){
            keyboard_once_right();
        }
        if (Keyboard.isKeyDown('ArrowUp', 'KeyK')){
            keyboard_once_up();
        }
        if (Keyboard.isKeyDown('ArrowDown', 'KeyJ')){
            keyboard_once_down();
        }

    }

}

function keyboard_once_right(){
    let new_x = g_pixi_hero.map_x + 1;
    let new_y = g_pixi_hero.map_y;
    let map_index = map_xy_to_index(new_x, new_y); 
    if(cur_map[map_index] != '#'){
        console.log("right ("+new_x+","+new_y+")");
        g_pixi_hero.map_x = new_x; 

        // if we step out of the bounding box, move map instead of hero
        let old_screen_x = g_pixi_hero.x;
        HERO.update_hero_px_loc(false);
        let global_pos = g_pixi_hero.toGlobal(new PIXI.Point(0,0));
        let map_buffer = SCREEN.SCREEN_WIDTH - (SCREEN.SCREEN_WIDTH - SCREEN.VIEW_WIDTH)/2 - SCREEN.HERO_WALK_BUFFER; 
        if(global_pos.x > map_buffer){
            let delta = g_pixi_hero.x - old_screen_x;
            pixi_map.x -= delta;
        }
        HERO.update_hero_px_loc(true);
    }
}
function keyboard_once_left(){
    let new_x = g_pixi_hero.map_x - 1;
    let new_y = g_pixi_hero.map_y;
    let map_index = map_xy_to_index(new_x, new_y); 

    if(cur_map[map_index] != '#'){
        console.log("left: "+new_x);
        g_pixi_hero.map_x = new_x; 

        // if we step out of the bounding box, move map instead of hero
        let old_screen_x = g_pixi_hero.x;
        HERO.update_hero_px_loc(false);
        let global_pos = g_pixi_hero.toGlobal(new PIXI.Point(0,0));
        let map_buffer = (SCREEN.SCREEN_WIDTH - SCREEN.VIEW_WIDTH)/2 + SCREEN.HERO_WALK_BUFFER; 
        if(global_pos.x < map_buffer){ 
            let delta = old_screen_x - g_pixi_hero.x;
            pixi_map.x += delta;
        }

        HERO.update_hero_px_loc(true);
    }
}
function keyboard_once_up(){
    let new_x = g_pixi_hero.map_x;
    let new_y = g_pixi_hero.map_y - 1;
    let map_index = map_xy_to_index(new_x, new_y); 

    if(cur_map[map_index] != '#'){
        g_pixi_hero.map_y = new_y; 

        // if we step out of the bounding box, move map instead of hero
        let old_screen_y = g_pixi_hero.y;
        HERO.update_hero_px_loc(false);
        let global_pos = g_pixi_hero.toGlobal(new PIXI.Point(0,0));
        let map_buffer = (SCREEN.SCREEN_HEIGHT - SCREEN.VIEW_HEIGHT)/2 + SCREEN.HERO_WALK_BUFFER; 
        if(global_pos.y < map_buffer){ 
            let delta = old_screen_y - g_pixi_hero.y;
            pixi_map.y += delta;
        }

        HERO.update_hero_px_loc(true);
    }
}
function keyboard_once_down(){
    let new_x = g_pixi_hero.map_x;
    let new_y = g_pixi_hero.map_y + 1;
    let map_index = map_xy_to_index(new_x, new_y); 

    if(cur_map[map_index] != '#'){
        g_pixi_hero.map_y = new_y; 

        // if we step out of the bounding box, move map instead of hero
        let old_screen_y = g_pixi_hero.y;
        HERO.update_hero_px_loc(false);
        let global_pos = g_pixi_hero.toGlobal(new PIXI.Point(0,0));
        let map_buffer = SCREEN.SCREEN_HEIGHT - (SCREEN.SCREEN_HEIGHT - SCREEN.VIEW_HEIGHT)/2 - SCREEN.HERO_WALK_BUFFER; 
        if(global_pos.y > map_buffer){ // XXX Picked an arbitrary boundry for dev
            let delta = g_pixi_hero.y - old_screen_y;
            pixi_map.y -= delta;
        }

        HERO.update_hero_px_loc(true);
    }
}

function initial_map_query_success(m) {
    console.log("Successfully retrieved map ");
    cur_map = m;
    console.log(cur_map);
    

    pixi_draw_map();
    map_set_hero_loc(MapDirection.Random);

    display_local_msg("Welcome hero!"); 
    HERO.update_hero_px_loc(false);

    HERO.set_initial_hero_in_db(world_container);
}

function map_query_success(m) {
    console.log("Successfully retrieved map ");
    cur_map = m;
    console.log(cur_map);
    pixi_draw_map();
    map_set_hero_loc(MapDirection.Random);
}

function map_query_failure () {
    console.log("Failed to retrieve map");
}

function get_initial_map(){
    const val = convexhttp_map.query("getMap")(1);
    val.then(initial_map_query_success, map_query_failure);
}

function get_cur_map(){
    const val = convexhttp_map.query("getMap")(1);
    val.then(map_query_success, map_query_failure);
}

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}

function setCharXY(map, x, y, chr) {
  return setCharAt(map, x + (y*(SCREEN.MAP_WIDTH_CHAR+1)), chr); 
}

//--
// Generate a random map. 
//
// Arguments
// upstairs - place stairs going to the previous level
// downstairs - place stairs going to the next level
// --
function generate_new_map(upstairs, downstairs){

  let new_map   = "";
  let room_list = [];
  
  for (let y = 0; y < SCREEN.MAP_HEIGHT_CHAR; y++){
      for (let x = 0; x < SCREEN.MAP_WIDTH_CHAR; x++){
        new_map += "#";
      }
        new_map += "\n";
  }

  let number_of_rooms = Math.ceil((Math.random() * 16) + 6);

  for (let rooms = 0; rooms < number_of_rooms; rooms++) {

      // generate a random room  (12 is a magic number for max size)
      let rand_room_w = Math.floor((Math.random() * 12) + 4);
      let rand_room_h = Math.floor((Math.random() * 12) + 4);
      let rand_room_x = 1 + Math.floor((Math.random() * (SCREEN.MAP_WIDTH_CHAR -  (rand_room_w + 1))));
      let rand_room_y = 1 + Math.floor((Math.random() * (SCREEN.MAP_HEIGHT_CHAR - (rand_room_h + 1))));


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

  // always put upstairs in the first room
  if (upstairs != false) {
    new_map = setCharXY(new_map, room_list[0][0], room_list[0][1], UP_CHAR);
    //const res = convexhttp_map.mutation("setItem")(null, 1, '^', room_list[0][0], room_list[0][1]);
    //res.then(item_update_success, item_update_failure);
  }
  // always put upstairs in the last room
  if (downstairs != false) {
    let center_tuple = room_list[number_of_rooms - 1];
    new_map = setCharXY(new_map, center_tuple[0], center_tuple[1], DOWN_CHAR);
    //const res = convexhttp_map.mutation("setItem")(null, 1, 'V', center_tuple[0], center_tuple[1]);
    //res.then(item_update_success, item_update_failure);
  }

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

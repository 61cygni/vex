import { InternalConvexClient, ConvexHttpClient } from "convex/browser";
import convexConfig from "../convex/_generated/clientConfig";
import * as PIXI from 'pixi.js';
import * as SCREEN from '/screen.js';


import {set_initial_hero_in_db, update_hero, hero_reset_other_heros} from "/hero.js";


const convexhttp_map    = new ConvexHttpClient(convexConfig);
let   convex_internal_msg = null; 


// pointers to globals
let g_app_map    = null;
let g_pixi_hero  = null;
let cur_map      = null;

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

        hero_reset_other_heros();
        console.log(cur_map);
        pixi_draw_map();
        update_hero_px_loc(true);
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
            hero_reset_other_heros();
            pixi_draw_map();
            update_hero_px_loc(true);
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
            hero_reset_other_heros();
            pixi_draw_map();
            update_hero_px_loc(true);
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
export function set_initial_map(new_map) {
    console.log('Setting initial map');

    convex_internal_msg    = new InternalConvexClient(convexConfig, updatedQueries => reactive_msg_update(updatedQueries));
    const { queryTokenMap, unsubscribeMap }   = convex_internal_msg.subscribe("listMessages", [0]);

    set_pixi_key_hooks();
    init_message_bar();

    let initial_map = generate_new_map(false, true);

    // set map in data and force replcement
    const res = convexhttp_map.mutation("setMap")(1, initial_map, new_map);
    res.then(initial_map_update_success, map_update_failure);
}




function map_map_index_to_pixel(x, y){
    // It seems characters are offset by a pixel every 4 pixels .. so
    let fudge = .6;
    let px_x  = SCREEN.MAP_X_OFFSET + (x * SCREEN.FONT_PIXEL_W) + Math.floor(fudge*x);
    let px_y  = SCREEN.MAP_Y_OFFSET + (y * SCREEN.FONT_PIXEL_H);
    return [px_x,px_y];
}


export function update_hero_px_loc(push){
    let px_loc = map_map_index_to_pixel(g_pixi_hero.map_x, g_pixi_hero.map_y);
    g_pixi_hero.x = px_loc[0];
    g_pixi_hero.y = px_loc[1];
    console.log("hero x "+g_pixi_hero.map_x+" : hero y "+g_pixi_hero.map_y);
    if(push == true){
        update_hero();
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

      //SCREEN.MAP_X_OFFSET = Math.floor((SCREEN.SCREEN_WIDTH - pixi_map.width) / 2);
      SCREEN.set_map_x_offset( Math.floor((SCREEN.SCREEN_WIDTH - pixi_map.width) / 2));
      SCREEN.set_map_y_offset(SCREEN.FONT_PIXEL_H); // magic! 


      pixi_map.x = SCREEN.MAP_X_OFFSET;
      pixi_map.y = SCREEN.MAP_Y_OFFSET;

	  g_app_map.stage.addChild(pixi_map);

      // choose a random location for the hero
      let map_size = (SCREEN.MAP_WIDTH_CHAR+1) * SCREEN.MAP_HEIGHT_CHAR; 
      let loc = 0; 
      while(pixi_map.text[loc] != ' '){
          loc = Math.floor(Math.random() * map_size);
          g_pixi_hero.map_y = Math.floor(loc / (SCREEN.MAP_WIDTH_CHAR+1));
          g_pixi_hero.map_x = loc - (g_pixi_hero.map_y * (SCREEN.MAP_WIDTH_CHAR+1)); 
          //console.log("loc "+loc+" : " + cur_map[loc]);
          //console.log("map_x "+g_pixi_hero.map_x+" : map_y" + g_pixi_hero.map_y);
      }

	  //Start the "game loop"
	  //g_app_map.ticker.add((delta) => gameLoop(delta));
}

// great linear index into map array from xy coords
function map_xy_to_index(x,y){
        return (y * (SCREEN.MAP_WIDTH_CHAR+1)) + x;
}

// --
// keyboard Hooks!
// --

function set_pixi_key_hooks() {
    //Capture the keyboard arrow keys
      const left = SCREEN.keyboard_press("ArrowLeft"),
      up = SCREEN.keyboard_press("ArrowUp"),
      right = SCREEN.keyboard_press("ArrowRight"),
      down = SCREEN.keyboard_press("ArrowDown"),
      keyh = SCREEN.keyboard_press("h"), // left
      keyj = SCREEN.keyboard_press("j"), // down 
      keyk = SCREEN.keyboard_press("k"), // up
      keyl = SCREEN.keyboard_press("l"), // right
      keyu = SCREEN.keyboard_once("u"), // go upstairs 
      keyd = SCREEN.keyboard_once("d"); // go downstairs

      right.press = keyboard_once_right;
      keyl.press  = keyboard_once_right;

      left.press = keyboard_once_left; 
      keyh.press = keyboard_once_left; 

      up.press   = keyboard_once_up; 
      keyk.press = keyboard_once_up; 

      down.press = keyboard_once_down; 
      keyj.press = keyboard_once_down; 

      keyd.press = () => { /// go down stairs!
        let map_index = map_xy_to_index(g_pixi_hero.map_x, g_pixi_hero.map_y); 
        if(cur_map[map_index] == DOWN_CHAR){
            console.log("[map] heading downstairs!");
            console.log("[map] Hero is currently on level "+g_pixi_hero.level);
            go_downstairs();
            //set_new_map();
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

function keyboard_once_right(){
    let new_x = g_pixi_hero.map_x + 1;
    let new_y = g_pixi_hero.map_y;
    let map_index = map_xy_to_index(new_x, new_y); 
    if(cur_map[map_index] != '#'){
        console.log("right: "+new_x);
        g_pixi_hero.map_x = new_x; 
        update_hero_px_loc(true);
    }
}
function keyboard_once_left(){
    let new_x = g_pixi_hero.map_x - 1;
    let new_y = g_pixi_hero.map_y;
    let map_index = map_xy_to_index(new_x, new_y); 

    if(cur_map[map_index] != '#'){
        console.log("left: "+new_x);
        g_pixi_hero.map_x = g_pixi_hero.map_x - 1;
        update_hero_px_loc(true);
    }
}
function keyboard_once_up(){
    let new_x = g_pixi_hero.map_x;
    let new_y = g_pixi_hero.map_y - 1;
    let map_index = map_xy_to_index(new_x, new_y); 

    if(cur_map[map_index] != '#'){
        g_pixi_hero.map_y = g_pixi_hero.map_y - 1;
        update_hero_px_loc(true);
    }
}
function keyboard_once_down(){
    let new_x = g_pixi_hero.map_x;
    let new_y = g_pixi_hero.map_y + 1;
    let map_index = map_xy_to_index(new_x, new_y); 

    if(cur_map[map_index] != '#'){
        g_pixi_hero.map_y = g_pixi_hero.map_y + 1;
        update_hero_px_loc(true);
    }
}

//--
// keyboard Hooks!
//--


function gameLoop(delta) {

  
}

function initial_map_query_success(m) {
    console.log("Successfully retrieved map ");
    cur_map = m;
    console.log(cur_map);
    pixi_draw_map();

    display_local_msg("Welcome hero!"); 


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

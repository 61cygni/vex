import { InternalConvexClient, ConvexHttpClient } from "convex/browser";
import convexConfig from "../convex/_generated/clientConfig";

import * as MAP from "/map.js"

import * as SCREEN from '/screen.js';

import * as PIXI from 'pixi.js';


const hero_char   = "@";
const INITIAL_HERO_HP    = 100;
const INITIAL_HERO_SPEED = 100;

let other_heros = [];

// pointers to globals
let g_pixi_hero_hero = null;
let g_app_hero       = null;
let world_container  = null;
let unsubscribe_hero = null;

// CONVEX global initialization
const convexhttp_hero = new ConvexHttpClient(convexConfig);
let internal_hero   = null;

export function set_g_pixi_hero_hero(ph) {
    g_pixi_hero_hero = ph;
}

export function set_g_app_hero(app) {
    g_app_hero = app;
}

// --
// <SIDEBAR>
// --

let pixi_hero_rect    = null;
let pixi_sidebar_text = null;

function hero_sidebar_gen_string(dg, hp, exp){
    let str = `Hero: `+hero_char+`
Floor: `+dg+`
Hp: `+hp+`
Xp: `+exp;
    return str;
}

function init_hero_sidebar() {
    pixi_hero_rect = new PIXI.Graphics();
    pixi_hero_rect.lineStyle({width: 2, color: 0xFFFF00, alpha: 1});
    pixi_hero_rect.beginFill(0x0000);
    pixi_hero_rect.drawRect(SCREEN.HERO_SIDEBAR_X_OFFSET, SCREEN.HERO_SIDEBAR_Y_OFFSET, SCREEN.HERO_SIDEBAR_W, SCREEN.HERO_SIDEBAR_H);
    pixi_hero_rect.endFill();
    g_app_hero.stage.addChild(pixi_hero_rect);

    const sidebarsty = new PIXI.TextStyle({
fontFamily: "Courier",
fontSize: SCREEN.MAP_FONT_SIZE - 4,
fill: 'green',
});

  pixi_sidebar_text = new PIXI.Text(hero_sidebar_gen_string(1,INITIAL_HERO_HP, 0), sidebarsty);
  pixi_sidebar_text.x = SCREEN.HERO_SIDEBAR_X_OFFSET + 4;
  pixi_sidebar_text.y = SCREEN.HERO_SIDEBAR_Y_OFFSET + 4;
  g_app_hero.stage.addChild(pixi_sidebar_text);
 
}

// Print sidebar to screen with current stats 
function update_hero_sidebar() {
    pixi_sidebar_text.text = hero_sidebar_gen_string(g_pixi_hero_hero.level, g_pixi_hero_hero.hp, g_pixi_hero_hero.xp);
}

// --
// </STATS>
// --


// --
// Create a new hero 
// --

export function init_pixi_hero(level, color) {
    const herosty = new PIXI.TextStyle({
fontFamily: "Courier",
fontSize: SCREEN.MAP_FONT_SIZE,
fill: color,
fontWeight : "bolder"
});

    console.log("[hero] init_pixi_hero");
    
    let pixi_hero = new PIXI.Text(hero_char, herosty);
    pixi_hero.interactive = true;
    pixi_hero.level       = level;
    pixi_hero._id = null; // will get ID from DB
    pixi_hero.hp    = INITIAL_HERO_HP; 
    pixi_hero.speed = INITIAL_HERO_SPEED; 
    pixi_hero.xp    = 0;
    
    internal_hero   = new InternalConvexClient(convexConfig, updatedQueries => reactive_update_hero(updatedQueries));

    init_hero_sidebar();
    
    return pixi_hero;
}

// --
// Pixi object for remote hero
// --
function init_pixi_remote_hero(color) {
    const herosty = new PIXI.TextStyle({
fontFamily: "Courier",
fontSize: SCREEN.MAP_FONT_SIZE,
fill: color,
fontWeight : "bolder"
});

    console.log("[hero] initi_pixi_remote_hero");
    
    let ph = new PIXI.Text(hero_char, herosty);
    ph._id = null; // will get ID from DB
    return ph;
}

export function set_initial_hero_in_db(container) {
    world_container = container;

    console.log('[hero] Setting initial hero:' + g_pixi_hero_hero.text + " : " + g_pixi_hero_hero.map_x);
    const res = convexhttp_hero.mutation("createHero")(g_pixi_hero_hero.text, g_pixi_hero_hero.map_x, g_pixi_hero_hero.map_y);
    res.then(initial_hero_update_success, hero_update_failure);
}

// --
// Push current hero state to convex 
// --

export function update_hero() {
    console.log('[hero] update_hero '+g_pixi_hero_hero._id);
    const res =
    convexhttp_hero.mutation("setHero")(g_pixi_hero_hero._id, g_pixi_hero_hero.level,  g_pixi_hero_hero.text, g_pixi_hero_hero.map_x, g_pixi_hero_hero.map_y);

    update_hero_sidebar(); // optimistically update the sidebar stats
    res.then(hero_update_success, hero_update_failure);
}
function hero_update_success () {
    //console.log("Successfully updated initial hero");
}
function hero_update_failure () {
    console.log("Failed to update initial hero");
}

function initial_hero_update_success (id) {
    console.log("Successfully updated initial hero "+id+" : " + g_pixi_hero_hero.map_x);
    g_pixi_hero_hero._id = id;
    MAP.set_g_pixi_hero_map(g_pixi_hero_hero);
    MAP.map_center_on_hero();
    update_hero_px_loc(true);

    // get notified whenever listHerosNotMe changes (a new hero enters,
    // or another hero moves)
    const {queryTokenHero, unsubscribe} = internal_hero.subscribe("listHerosNotMe", [id, 1]);
    unsubscribe_hero = unsubscribe;

    // At this point can safely assume map has been drawn, and hero too
    MAP.broadcast_msg(id, "a new hero entered dungeon!", ""+id);

    list_heros_from_db();
}


// -- 
// List all heros stored in the back end
// Once received update local and remote heros
// --
function list_heros_from_db(){
    console.log('[hero] list_heros_from_db ' + ""+g_pixi_hero_hero._id); 

    const val = convexhttp_hero.query("listHerosNotMe")(g_pixi_hero_hero._id, g_pixi_hero_hero.level);
    val.then(list_hero_query_success, list_hero_query_failure);
}

export function hero_change_level(new_level){

    console.log("[hero] changing to new level "+new_level); 

    unsubscribe_hero();
    unsubscribe_hero = null;
    const {queryTokenHero, unsubscribe} = internal_hero.subscribe("listHerosNotMe", [g_pixi_hero_hero._id, new_level]);
    unsubscribe_hero = unsubscribe;

    for(let i = 0; i < other_heros.length; i++){
        console.log("Removing other hero "+other_heros[i]._id);
        g_app_hero.stage.removeChild(other_heros[i]);
    }
    other_heros = [];
}


function list_hero_query_success(m) {
    console.log("Successfully retrieved heros ");
    console.log(m);

    let new_other_hero = [];
    
    for(let i = 0; i < m.length; i++){
        let found_local = false;
        let db_hero = m[i];
        if(""+db_hero._id == ""+g_pixi_hero_hero._id){
            console.log("found our hero, ignoring!");
            // nothing to do here since we're the source of truth
            // for the local hero
            continue;
        }
        // look whether we know about this hero
        for(let j = 0; j < other_heros.length; j++){
            if(""+db_hero._id == ""+other_heros[j]._id){
                if(db_hero.level != g_pixi_hero_hero.level){
                    console.log("Removing other hero at different level "+db_hero.level);
                    continue;
                }
                found_local = true;
                console.log("found local hero!: "+db_hero._id);
                console.log(other_heros[j]);
                other_heros[j].map_x = db_hero.x;
                other_heros[j].map_y = db_hero.y;

                // save this hero
                new_other_hero.push(other_heros[j]);
                other_heros.splice(j, 1); 
            }
        }
        if(!found_local){
            if(db_hero.level != g_pixi_hero_hero.level){
                continue;
            }
            console.log("[hero] new remote hero: "+db_hero._id);
            let new_local = init_pixi_remote_hero("red");
            new_local._id = db_hero._id;
            new_local.map_x = db_hero.x;
            new_local.map_y = db_hero.y;
            new_other_hero.push(new_local);
            world_container.addChild(new_local);
        }
    }

    // remove all stale heros
    for(let i = 0; i < other_heros.length; i++){
        g_app_hero.stage.removeChild(other_heros[i]);
    }
    other_heros = new_other_hero;

    update_hero_px_loc(false); // will update screen locations for all other
}

// --
// update_hero_px_loc(..)
//
// Map from map coordinates to screen coordinates. 
//
// --

export function update_hero_px_loc(push){
    let px_loc = MAP.map_map_index_to_pixel(g_pixi_hero_hero.map_x, g_pixi_hero_hero.map_y);
    g_pixi_hero_hero.x = px_loc[0];
    g_pixi_hero_hero.y = px_loc[1];

    for(let j = 0; j < other_heros.length; j++){
        let px_loc = MAP.map_map_index_to_pixel(other_heros[j].map_x, other_heros[j].map_y);
        other_heros[j].x = px_loc[0];
        other_heros[j].y = px_loc[1];
    }

    if(push == true){
        update_hero();
    }


}


function list_hero_query_failure () {
    console.log("Failed to retrieve hero");
}

function reactive_update_hero (updatedQueries) {
    if(updatedQueries == ""){
        return;
    }
    list_heros_from_db();
}

import { InternalConvexClient, ConvexHttpClient } from "convex/browser";
import convexConfig from "/convex.json";

import {update_local_hero_px_loc, update_hero_px_loc, set_g_pixi_hero_map} from "/src/map.js"

let hero_char   = "@";

let other_heros = [];

// pointers to globals
let g_pixi_hero_hero      = null;
let g_app_hero            = null;

// CONVEX global initialization
const convexhttp_hero = new ConvexHttpClient(convexConfig.origin);
let internal_hero   = null;

export function set_g_pixi_hero_hero(ph) {
    g_pixi_hero_hero = ph;
}

export function set_g_app_hero(app) {
    g_app_hero = app;
}


// --
// Create a new hero 
// --

export function init_pixi_hero(level, color) {
    const herosty = new PIXI.TextStyle({
fontFamily: "Courier",
fontSize: MAP_FONT_SIZE,
fill: color,
fontWeight : "bolder"
});

    console.log("[hero] init_pixi_hero");
    
    let pixi_hero = new PIXI.Text(hero_char, herosty);
    pixi_hero.interactive = true;
    pixi_hero.level       = level;
    pixi_hero._id = null; // will get ID from DB

    
    internal_hero   = new InternalConvexClient(convexConfig.origin, updatedQueries => reactive_update_hero(updatedQueries));
    const { queryTokenHero, unsubscribeHero } = internal_hero.subscribe("listHeros", [1]);
    
    return pixi_hero;
}

// --
// Pixi object for remote hero
// --
function init_pixi_remote_hero(color) {
    const herosty = new PIXI.TextStyle({
fontFamily: "Courier",
fontSize: MAP_FONT_SIZE,
fill: color,
fontWeight : "bolder"
});

    console.log("[hero] initi_pixi_remote_hero");
    
    let ph = new PIXI.Text(hero_char, herosty);
    ph._id = null; // will get ID from DB
    return ph;
}

export function set_initial_hero_in_db() {
    console.log('[hero] Setting initial hero:' + g_pixi_hero_hero.text + " : " + g_pixi_hero_hero.map_x);
    const res = convexhttp_hero.mutation("createHero")(g_pixi_hero_hero.text, g_pixi_hero_hero.map_x, g_pixi_hero_hero.map_y);
    res.then(initial_hero_update_success, hero_update_failure);
}

// --
// Push current hero state to back end
// --

export function update_hero() {
    console.log('[her] update_hero '+g_pixi_hero_hero.map_x);
    const res =
    convexhttp_hero.mutation("setHero")(g_pixi_hero_hero._id, g_pixi_hero_hero.level,  g_pixi_hero_hero.text, g_pixi_hero_hero.map_x, g_pixi_hero_hero.map_y);
    res.then(hero_update_success, hero_update_failure);
}
function hero_update_success () {
    console.log("Successfully updated initial hero");
    list_heros_from_db();
}
function hero_update_failure () {
    console.log("Failed to update initial hero");
}



function initial_hero_update_success (id) {
    console.log("Successfully updated initial hero "+id+" : " + g_pixi_hero_hero.map_x);
    g_pixi_hero_hero._id = id;
    set_g_pixi_hero_map(g_pixi_hero_hero);
    update_hero_px_loc(true);
    list_heros_from_db();
}


// -- 
// List all heros stored in the back end
// Once received update local and remote heros
// --
function list_heros_from_db(){
    console.log('[hero] list_heros_from_db'); 

    const val = convexhttp_hero.query("listHeros")(g_pixi_hero_hero.level);
    val.then(list_hero_query_success, list_hero_query_failure);
}

export function hero_reset_other_heros(){
    console.log("XXXXXX REMOVING"); 
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
                update_local_hero_px_loc(other_heros[j]);

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
            update_local_hero_px_loc(new_local);
            g_app_hero.stage.addChild(new_local);
        }
    }

    // remove all stale heros
    for(let i = 0; i < other_heros.length; i++){
        g_app_hero.stage.removeChild(other_heros[i]);
    }
    other_heros = new_other_hero;
}

function list_hero_query_failure () {
    console.log("Failed to retrieve hero");
}

export function reactive_update_hero (updatedQueries) {
    console.log("Change to hero!");
    list_heros_from_db();
}

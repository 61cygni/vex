import { InternalConvexClient, ConvexHttpClient } from "convex/browser";
import convexConfig from "../convex/_generated/clientConfig";

import {set_initial_map, set_g_pixi_hero_map} from "/map.js"
import {init_pixi_hero, set_g_pixi_hero_hero} from "/hero.js";

import * as PIXI   from 'pixi.js';
import * as SCREEN from '/screen.js';

// CONVEX global initialization
const convexhttp_title = new ConvexHttpClient(convexConfig);

let title_string  = "vex";
let new_game_str  = "[new]";
let join_game_str = "[join]";

let pixi_title = null;
let pixi_subnew = null;
let pixi_subjoin = null;

let hacky_global_scratch = 0;

let g_app_title    = null;

export function set_g_app_title(app) {
    g_app_title = app;
}


export function init_and_set_title() {
    const title_text_sty = new PIXI.TextStyle({
      fontFamily: "Courier",
      fontSize: SCREEN.MAP_FONT_SIZE + 4,
      fill: "red",
      fontWeight : "bolder"
    });
    const subtitle_text_sty = new PIXI.TextStyle({
      fontFamily: "Courier",
      fontSize: SCREEN.MAP_FONT_SIZE- 2,
      fill: "green",
      fontWeight : "bolder"
    });

    pixi_title   = new PIXI.Text(title_string, title_text_sty);
    pixi_subnew  = new PIXI.Text(new_game_str, subtitle_text_sty);
    pixi_subjoin = new PIXI.Text(join_game_str, subtitle_text_sty);

    // below is just used to calc positioning
    let pixi_aggsub  = new PIXI.Text(new_game_str+join_game_str, subtitle_text_sty);

    let title_x_offset = Math.floor((SCREEN.SCREEN_WIDTH - pixi_title.width) / 2);
    let title_y_offset = Math.floor((SCREEN.SCREEN_HEIGHT - (2*pixi_title.height)) / 2);
    pixi_title.x = title_x_offset;
    pixi_title.y = title_y_offset;

    let subnew_x_offset = Math.floor((SCREEN.SCREEN_WIDTH - pixi_aggsub.width) / 2);
    let subjoin_x_offset = subnew_x_offset + pixi_subnew.width; 
    let subnew_y_offset = Math.floor((SCREEN.SCREEN_HEIGHT - (2*pixi_subnew.height)) / 2) + pixi_subnew.height;

    pixi_subnew.x = subnew_x_offset;
    pixi_subnew.y = subnew_y_offset;

    pixi_subjoin.x = subjoin_x_offset;
    pixi_subjoin.y = subnew_y_offset;
    pixi_subnew.interactive = true;
    pixi_subjoin.interactive = true;

    pixi_subnew.on('pointerdown', (event) => { new_clicked(); });
    pixi_subjoin.on('pointerdown', (event) => { join_clicked(); });

    g_app_title.stage.addChild(pixi_title);
    g_app_title.stage.addChild(pixi_subnew);
    g_app_title.stage.addChild(pixi_subjoin);

    console.log("[title] Title initialized");

    //audio_play();
}

function init_new_game() {
    set_initial_map(true); // generate new map

    let pixi_hero = init_pixi_hero(1, "yellow"); // start hero on first level
    set_g_pixi_hero_map(pixi_hero);
    set_g_pixi_hero_hero(pixi_hero); // FIXME and just use local instance
    g_app_title.stage.addChild(pixi_hero);


    g_app_title.stage.removeChild(pixi_title);
    g_app_title.stage.removeChild(pixi_subnew);
    g_app_title.stage.removeChild(pixi_subjoin);
}

function init_join_game() {
    set_initial_map(false); // don't generate new map
    let pixi_hero = init_pixi_hero(1, "yellow");
    set_g_pixi_hero_map(pixi_hero);
    set_g_pixi_hero_hero(pixi_hero); // FIXME and just use local instance
    g_app_title.stage.addChild(pixi_hero);

    g_app_title.stage.removeChild(pixi_title);
    g_app_title.stage.removeChild(pixi_subnew);
    g_app_title.stage.removeChild(pixi_subjoin);
}

function hero_delete_success (id) {
    console.log("[title] successfully deleted hero "+id);
    hacky_global_scratch = hacky_global_scratch - 1;
    if(hacky_global_scratch <= 0){
        console.log("[title] all heros deleted, let's go! ");
        init_new_game();
    }
}

function hero_delete_failure () {
    console.log("[title] failed to delete hero"); 
}

function list_hero_query_success(m) {
    console.log("[title] retrieved heros ");
    console.log(m);

    hacky_global_scratch = m.length;
    if (hacky_global_scratch == 0){
        init_new_game();
        return;
    }
    
    for(let i = 0; i < m.length; i++){
        console.log("[title] deleting "+m[i]._id);
        const res = convexhttp_title.mutation("deleteHero")(m[i]._id);
        res.then(hero_delete_success, hero_delete_failure);
    }
}

function list_hero_query_failure () {
    console.log("[title] failed to list heros");
}

function new_clicked() {
    console.log("New game");

    // use 0 to list all heros and delete them
    const val = convexhttp_title.query("listHeros")(0); 
    val.then(list_hero_query_success, list_hero_query_failure);
}

function join_clicked() {
    console.log("Join game");

    init_join_game();
}

function audio_play() {
  var audio = new Audio('/audio/title.mp3');
  audio.play();
}

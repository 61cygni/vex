// --
// Handle layout of primary game screen
// --

import {set_initial_map, set_g_pixi_hero_map} from "/map.js"
import {init_pixi_hero, set_g_pixi_hero_hero} from "/hero.js";

import * as PIXI from 'pixi.js';
import * as SCREEN from '/screen.js';

let g_app_game_screen = null;

export function set_g_app_game_screen(app) {
    g_app_game_screen = app;
}

export function game_screen_init_new_game() {

    // Create frame around world map
    let frame = new PIXI.Graphics();
    frame.beginFill(0x666666);
    frame.lineStyle({ color: 0x8B0000, width: SCREEN.VIEW_FRAME_WIDTH, alignment: 0 });
    frame.drawRect(0, 0, SCREEN.VIEW_WIDTH + SCREEN.VIEW_FRAME_WIDTH*2, SCREEN.VIEW_HEIGHT + SCREEN.VIEW_FRAME_WIDTH*2);
    frame.position.set(SCREEN.SCREEN_WIDTH/2 - (SCREEN.VIEW_WIDTH/2 + SCREEN.VIEW_FRAME_WIDTH), SCREEN.SCREEN_HEIGHT/2 - (SCREEN.VIEW_HEIGHT/2 + SCREEN.VIEW_FRAME_WIDTH));
    g_app_game_screen.stage.addChild(frame);

    // Create mask which is the view into the world. 
    let mask = new PIXI.Graphics();
    // Add the rectangular area to show
    mask.beginFill(0x0);
    mask.drawRect(0,0,800,600); // TODO add to screen.js
    mask.endFill();

    // Add container that will hold our masked content
    let maskContainer = new PIXI.Container();
    // Set the mask to use our graphics object from above
    maskContainer.mask = mask;
    // Add the mask as a child, so that the mask is positioned relative to its parent
    maskContainer.addChild(mask);
    // Offset by the window's frame width
    maskContainer.position.set(2,2);
    // And add the container to the window!
    frame.addChild(maskContainer);

    set_initial_map(true, maskContainer); // generate new map

    let pixi_hero = init_pixi_hero(1, "yellow"); // start hero on first level
    set_g_pixi_hero_map(pixi_hero);
    set_g_pixi_hero_hero(pixi_hero); // FIXME and just use local instance
}

export function game_screen_init_join_game() {

    // Create frame around world map
    let frame = new PIXI.Graphics();
    frame.beginFill(0x666666);
    frame.lineStyle({ color: 0x8B0000, width: SCREEN.VIEW_FRAME_WIDTH, alignment: 0 });
    frame.drawRect(0, 0, SCREEN.VIEW_WIDTH + SCREEN.VIEW_FRAME_WIDTH*2, SCREEN.VIEW_HEIGHT + SCREEN.VIEW_FRAME_WIDTH*2);
    frame.position.set(SCREEN.SCREEN_WIDTH/2 - (SCREEN.VIEW_WIDTH/2 + SCREEN.VIEW_FRAME_WIDTH), SCREEN.SCREEN_HEIGHT/2 - (SCREEN.VIEW_HEIGHT/2 + SCREEN.VIEW_FRAME_WIDTH));
    g_app_game_screen.stage.addChild(frame);

    // Create mask which is the view into the world. 
    let mask = new PIXI.Graphics();
    // Add the rectangular area to show
    mask.beginFill(0x0);
    mask.drawRect(0,0,800,600); // TODO add to screen.js
    mask.endFill();

    // Add container that will hold our masked content
    let maskContainer = new PIXI.Container();
    // Set the mask to use our graphics object from above
    maskContainer.mask = mask;
    // Add the mask as a child, so that the mask is positioned relative to its parent
    maskContainer.addChild(mask);
    // Offset by the window's frame width
    maskContainer.position.set(2,2);
    // And add the container to the window!
    frame.addChild(maskContainer);

    set_initial_map(false, maskContainer); // generate new map

    let pixi_hero = init_pixi_hero(1, "yellow"); // start hero on first level
    set_g_pixi_hero_map(pixi_hero);
    set_g_pixi_hero_hero(pixi_hero); // FIXME and just use local instance
}


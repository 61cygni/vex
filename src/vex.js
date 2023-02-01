import * as  Keyboard  from 'pixi.js-keyboard';
import * as  Mouse     from 'pixi.js-mouse';

import { vex_init_pixi} from "/screen.js";
import { set_g_app_title, init_and_set_title} from "/title.js";
import { set_g_app_game_screen} from "/game_screen.js";
import { set_g_app_map, move_hero} from "/map.js";
import { set_g_app_hero} from "/hero.js";

export function vex_init(){

    const g_app = vex_init_pixi(); // defined in /screen.js 
    console.log("[vex] PIXI initialized"); 

    set_g_app_map(g_app);
    set_g_app_hero(g_app);
    set_g_app_title(g_app);
    set_g_app_game_screen(g_app);

    return g_app;
}


export function vex(g_app){

    init_and_set_title(); // title screen will take it from here


    // Start the game loop
    g_app.ticker.add(delta => gameLoop(delta));

    function gameLoop(delta){
        // Update the current game state:
        Keyboard.update();
        Mouse.update();
        move_hero();
    }


}

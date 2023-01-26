import * as PIXI   from 'pixi.js';

let confirm_file = "audio/confirm.mp3";
let confirm_sound = null;

let title_file = "audio/title.mp3";
let title_sound = null;

let fireball_file = "audio/fireball.mp3";
let fireball_sound = null;

let heartbeat_file = "audio/heartbeat.mp3";
let heartbeat_sound = null;

export async function load_sounds() {
    console.log("[sounds] loading all sounds");
    let pxsound = (await import('@pixi/sound'));
    pxsound.default;

    title_sound     = pxsound.Sound.from(title_file); 
    confirm_sound   = pxsound.Sound.from(confirm_file); 
    fireball_sound  = pxsound.Sound.from(fireball_file); 
    heartbeat_sound = pxsound.Sound.from(heartbeat_file); 

    // this is called by new / join so we want an audio acknolwedgement
    // which gets lost because this is async so fireball_file is null
    // when play_fireball is called
    fireball_sound.play();
}

export function play_confirm(){
    if(confirm_sound){
        confirm_sound.play();
    }
}

export function play_fireball(){
    if(fireball_sound){
        fireball_sound.play();
    }
}

export function play_heartbeat(){
    if(heartbeat_sound){
        heartbeat_sound.play();
    }
}

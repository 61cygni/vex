
let hero_char   = "@";

let other_heros = [];

// pointers to globals
let g_convexhttp_hero     = null;
let g_app_hero            = null;
let g_pixi_hero_hero      = null;

function set_g_convex_http_client_hero(gh) {
    g_convexhttp_hero = gh;
}

function set_g_pixi_hero_hero(ph) {
    g_pixi_hero_hero = ph;
}

function set_g_app_hero(app) {
    g_app_hero = app;
}

function init_pixi_hero(color) {
    const herosty = new PIXI.TextStyle({
      fontFamily: "Courier",
      fontSize: MAP_FONT_SIZE,
      fill: color,
      fontWeight : "bolder"
    });

    let pixi_hero = new PIXI.Text(hero_char, herosty);

    pixi_hero.interactive = true;
    pixi_hero._id = null; // will get ID from DB

    return pixi_hero;
}

function set_initial_hero_in_db() {
    console.log('XXXXX Setting initial hero:' + g_pixi_hero_hero.text);
    const res = g_convexhttp_hero.mutation("createHero")(g_pixi_hero_hero.text, g_pixi_hero_hero.map_x, g_pixi_hero_hero.map_y);
    console.log("post mutation");
    res.then(initial_hero_update_success, hero_update_failure);
}

function update_hero() {
    console.log('XXXXXXXXXX updating hero');
    const res =
    g_convexhttp_hero.mutation("setHero")(g_pixi_hero_hero._id, g_pixi_hero_hero.text, g_pixi_hero_hero.map_x, g_pixi_hero_hero.map_y);
    res.then(hero_update_success, hero_update_failure);
}

function initial_hero_update_success (id) {
    console.log("Successfully updated initial hero "+id);
    g_pixi_hero_hero._id = id;
    list_heros_from_db();
}

function hero_update_success () {
    console.log("Successfully updated initial hero");
    list_heros_from_db();
}

function hero_update_failure () {
    console.log("Failed to update initial hero");
}

function list_hero_query_success(m) {
    console.log("Successfully retrieved heros ");
    console.log(m);
    
    for(let i = 0; i < m.length; i++){
        let found_local = false;
        let db_hero = m[i];
        if(""+db_hero._id == ""+g_pixi_hero_hero._id){
            console.log("found our hero, ignoring!");
            continue;
        }
        // look whether we know about this hero
        for(let j = 0; j < other_heros.length; j++){
            if(""+db_hero._id == ""+other_heros[j]._id){
                found_local = true;
                console.log("found local hero!: "+db_hero._id);
                console.log(other_heros[j]);
                other_heros[j].map_x = db_hero.x;
                other_heros[j].map_y = db_hero.y;
                update_local_hero_px_loc(other_heros[j]);
            }
        }
        if(!found_local){
            console.log("new hero with no local!! "+db_hero._id);
            let new_local = init_pixi_hero("red");
            new_local._id = db_hero._id;
            new_local.map_x = db_hero.x;
            new_local.map_y = db_hero.y;
            other_heros.push(new_local);
            update_local_hero_px_loc(new_local);
            g_app_hero.stage.addChild(new_local);
        }
    }
    //if(g_pixi_hero_hero != null){
    //    g_pixi_hero_hero.map_x = m.x;
    //    g_pixi_hero_hero.map_y = m.y;
    //    update_hero_px_loc(false);
    //}
}

function hero_query_failure () {
    console.log("Failed to retrieve hero");
}


function list_heros_from_db(){
    console.log('list_heros_from_db'); 

    const val = g_convexhttp.query("listHeros")();
    val.then(list_hero_query_success, hero_query_failure);
}

function reactive_update_hero (updatedQueries) {
    console.log("Change to hero!");
    list_heros_from_db();
}

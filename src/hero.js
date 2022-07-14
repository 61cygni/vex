
// pointers to globals
let g_convexhttp_hero     = null;
let g_pixi_hero_hero      = null;

function set_g_convex_http_client_hero(gh) {
    g_convexhttp_hero = gh;
}

function set_g_pixi_hero_hero(ph) {
    g_pixi_hero_hero = ph;
}

function set_initial_hero(pixi_hero) {
    console.log('XXXXXXXXXX Setting initial hero');
    const res = g_convexhttp_hero.mutation("setHero")(pixi_hero.text, pixi_hero.map_x, pixi_hero.map_y);
    res.then(hero_update_success, hero_update_failure);
}

function update_hero(pixi_hero) {
    console.log('XXXXXXXXXX updating hero');
    const res = g_convexhttp_hero.mutation("setHero")(pixi_hero.text, pixi_hero.map_x, pixi_hero.map_y);
    res.then(hero_update_success, hero_update_failure);
}

function hero_update_success () {
    console.log("Successfully updated initial hero");
    get_cur_hero();
}

function hero_update_failure () {
    console.log("Failed to update initial hero");
}

function hero_query_success(m) {
    console.log("Successfully retrieved hero ");
    console.log(m);
    if(g_pixi_hero_hero != null){
        g_pixi_hero_hero.map_x = m.x;
        g_pixi_hero_hero.map_y = m.y;
        update_hero_px_loc(false);
    }
}

function hero_query_failure () {
    console.log("Failed to retrieve hero");
}


function get_cur_hero(){
    const val = g_convexhttp.query("getHero")();
    val.then(hero_query_success, hero_query_failure);
}

function reactive_update_hero (updatedQueries) {
    console.log("Change to hero!");
    get_cur_hero();
}

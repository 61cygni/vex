import { mutation } from "./_generated/server";

// Set the map 
export default mutation(async ({ db }, level: number, body: string, force: boolean ) => {
  console.log("setMap");

  const map = { level, body, time: Date.now() };
  let map_list = await db.table("the_map").collect();

  console.log("map_list.length "+map_list.length);

  for (let index = 0; index < map_list.length; index++) {
    console.log(index);
    if(map_list[index].level == map.level){
        console.log("Found map at level "+map.level);
        if(force == true){
            console.log("updating map");
            db.replace(map_list[index]._id, map);
            return level;
        }else{
            console.log("not updating because force not set");
            return null;
        }
    }
  } // -- end for

  console.log("Map not found, inserting");
  db.insert("the_map", map);

  return level;
});


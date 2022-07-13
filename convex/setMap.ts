import { mutation } from "./_generated/server";

// Set the map 
export default mutation(async ({ db }, body: string, force: boolean ) => {
  const map = { body, time: Date.now() };
  let oldmap = await db.table("the_map").first();

  console.log(oldmap);

  if (oldmap === null) {
    console.log("Inserting new map");
    db.insert("the_map", map);
  } else if (force) {
    console.log("Forcing replacement of map");
    db.replace(oldmap._id, map);
  } else {
    console.log("Map already exists, doing nothing");
  }

});


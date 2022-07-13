import { mutation } from "./_generated/server";

// Set the map 
export default mutation(async ({ db }, icon: string, x: number, y : number ) => {
  const hero = { icon, x, y };

  let oldhero = await db.table("the_hero").first();

  if (oldmap === null) {
    console.log("Inserting new hero");
    db.insert("the_hero", hero);
  } else {
    console.log("Updating hero");
    db.replace(oldhero._id, hero);
  } 

});


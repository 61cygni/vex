import { mutation } from "./_generated/server";

// Set the map 
export default mutation(async ({ db }, icon: string, x : number, y : number ) => {

  console.log("createHero");
  const hero = { icon, x, y, };

  console.log("Inserting new hero "+icon);
  let hid = db.insert("the_hero", hero);
  console.log("Done id: "+hid);
  return hid;
});

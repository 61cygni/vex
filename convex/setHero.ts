import { mutation } from "./_generated/server";

// Set the map 
export default mutation(async ({ db }, id : Id, icon: string, x : number, y : number ) => {

  console.log("setHero: " + id);
  const hero = { icon, x, y, };

  let hero_list = await db.table("the_hero").collect();

  for (let index = 0; index < hero_list.length; index++) {
    if(""+hero_list[index]._id == ""+id){
        console.log("Found hero, updating");
        db.replace(hero_list[index]._id, hero);
        return hero_list[index]._id;
    }
  }

  return 0;

  console.log("Inserting new hero "+icon);
  db.insert("the_hero", hero);

});


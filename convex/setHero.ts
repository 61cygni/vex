import { mutation } from "./_generated/server";

// Set the map 
export default mutation(async ({ db }, id : Id, level: number, icon: string, x : number, y : number ) => {

  console.log("setHero: " + id);
  const hero = { icon, level, x, y, };

  let hero_list = await db.query("the_hero").collect();

  for (let index = 0; index < hero_list.length; index++) {
    if(""+hero_list[index]._id == ""+id){
        console.log("Found hero, updating");
        db.replace(hero_list[index]._id, hero);
        return hero_list[index]._id;
    }
  }

  console.log("Inserting new hero "+icon);
  db.insert("the_hero", hero);

});


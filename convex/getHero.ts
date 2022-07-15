import { query } from "./_generated/server";

export default query(async ({ db }, id: Id): Promise<{}> => {
  console.log("getHero: "+id);

  const hero_list = await db.table("the_hero").collect();

  for (let index = 0; index < hero_list.length; index++) {
    console.log("getHero: "+hero_list[index]._id+" : "+id+" : "+(hero_list[index]._id == id));
    if(""+hero_list[index]._id == ""+id){
        console.log("found hero! ");
        return hero_list[index]; 
    }
  }

  console.log("Did not find hero .. ");
  return 0;
});

import { query } from "./_generated/server";

export default query(async ({ db }, level : number): Promise<{}> => {
  console.log("listHeros "+level);

  if(level == 0){
    console.log("level is zero");
    return await db.query("the_hero").collect();
  }
  return db.query("the_hero")
           .filter(q => q.eq(q.field("level"), level))
           .collect();
});

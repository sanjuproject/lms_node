const express = require("express");
const router = express.Router();
const db = require('../services/db.js');

router.get('/checktime', async(req, res) => { 
 
    let yourDate = new Date();
  const offset = yourDate.getTimezoneOffset()
  yourDate = new Date(yourDate.getTime() - (offset*60*1000));
  let current_time = yourDate.getTime();
  yourDate = yourDate.toISOString().split('T')[0];
    const start_time = new Date(yourDate+"T01:00:00Z").getTime() + (-330*60*1000);
    const end_time = new Date(yourDate+"T01:15:00Z").getTime() + (-330*60*1000);
    console.log(start_time , end_time , current_time , offset);
  let maintance_status = 0;
    if(current_time >= start_time && current_time <= end_time)
      {
        maintance_status = 1;
      }

      await db.query("select * from `migration_data` order by id desc limit 1")
      .then(result=>{
        if(result.length > 0)
        {
          
            let yourDate = new Date();
            const offset = yourDate.getTimezoneOffset()
            yourDate = new Date(yourDate.getTime() - (offset*60*1000));
            let current_time = yourDate.getTime();

            let start_date = result[0].created_at; 
      

            let start_time = new Date(start_date).getTime() - (60*5*1000);
            let end_time = new Date(start_date).getTime() + (60*15*1000);
           
          if(current_time >= start_time && current_time <= end_time)
            {
              maintance_status = 1;
            }
        }
      })
    res.status(200).send({status:200,msg:"Test API Calling",value:maintance_status});
  });

  router.get('/updatemigrationstatus', async(req, res) => { 
    
  });
module.exports = router;
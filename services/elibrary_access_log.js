const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function storeelibraryaccesslog(data,userdata)
{
  let response = {};
  let student_id = userdata.id;
  let subject_id = data.subject_id;
  let chapter_shortcode = data.chapter_shortcode;
  if(data.subject_id == undefined){
    chapter_shortcode = "demo";
  }
  let time_spent = (data.time_spent);
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if(chapter_shortcode != "demo" && chapter_shortcode != undefined && subject_id > 0){
          await db.query("INSERT INTO `elibrary_access_log`(`student_id`, `subject_id`,`chapter_shortcode`, `time_spend`) \
          VALUES ('"+student_id+"','"+subject_id+"','"+chapter_shortcode+"','"+time_spent+"')")
          response = {status: 200, msg: "e-Library time spend data stored",time_spent_time:time_spent}
    }
          resolve(response);
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

module.exports = 
{
  storeelibraryaccesslog
}
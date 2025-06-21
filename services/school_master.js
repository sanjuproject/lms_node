const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


async function getlist(data)
{
  let board_name = "";
  let board_id = 0;
  if(data.board > 0){
    board_id = data.board;
  }

  await db.query("select * from `boards` where `id` = "+board_id+" and is_deleted = 0 and status = 1")
  .then(result=>{
    if(result.length > 0){
      board_name = result[0]['name'];
    }
  })
  const record_details = await db.query("SELECT * FROM school_master WHERE FIND_IN_SET('"+board_name+"',board)");
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No exam type found.';
      response = {status: 200, msg: message,data:[]}
      reject(response);
    }
    else{
          message = "Exam type list";
          response = {status: 200, msg: message, data: record_details}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });
  return promise_result;  
}

module.exports = 
{
  getlist,
}
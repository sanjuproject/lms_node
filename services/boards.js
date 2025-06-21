const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function storeboards(data) {
  let response = {};
  let status = config.errorStatus;
  let message = "Something went wrong, please try again later.";
  const result = await db.query(
    `INSERT INTO boards (name, short_code) VALUES ('`+data.name+`', '`+data.short_code+`')`
  );
  if (result.affectedRows) {
    status = config.successStatus;
    message = 'Board added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}

async function getboards() {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched boards.";
  const boards = await db.query(`select id,name,short_code,status,created_at from boards where is_deleted = 0 and status = 1`);
  response = {status: status, msg: message, data: boards};
  return response;
}

async function deleteboard(data)
{
    const record_details = await db.query(`SELECT * FROM boards WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No Board record found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update boards set is_deleted = 1 where id = '`+data.recid+`' `);
          message = "Board record deleted successfully";
          response = {status: 200, msg: message}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function updatestatusboard(data)
{
    const record_details = await db.query(`SELECT * FROM boards WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No Board record found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update boards set status = '`+data.status+`' where id = '`+data.recid+`' `);
          message = "Board status updated successfully";
          response = {status: 200, msg: message}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}
async function editboards(data)
{
    const record_details = await db.query(`SELECT * FROM boards WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No Board record found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update boards set name = '`+data.name+`',short_code = '`+data.short_code+`' where id = '`+data.recid+`' `);
          message = "Board record updated successfully";
          response = {status: 200, msg: message}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function getboardbyid(data) {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched boards.";
  const boards = await db.query(`select id,name,short_code,status,created_at from boards where id = `+data.board_id+` and is_deleted = 0`);
  response = {status: status, msg: message, data: boards};
  return response;
}

async function getboardbyshortcode(data) {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched boards.";
  await db.query(`select id,name,short_code,status,created_at from boards where short_code = '`+data+`' and is_deleted = 0`)
  .then((result)=>{
    response = {status: status, msg: message, data: result};
    
  });
  return response;
}

module.exports = {
  storeboards,
  getboards,
  deleteboard,
  updatestatusboard,
  editboards,
  getboardbyid,
  getboardbyshortcode
}
const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function storebranches(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
  const result = await db.query(
    `INSERT INTO branches (branch_name,subject_id,branch_code,question_no) VALUES ('`+data.branch_name+`','`+data.subject_id+`','`+data.branch_code+`','`+data.question_no+`')`
  );
  if (result.affectedRows) {
    status = 200;
    message = 'Branch added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}

async function getbranchesscholastic(data) {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched scholastic branches";

  const branches = await db.query(`select branches.id,branches.branch_name,branches.branch_code,branches.status,
  branches.created_at,subjects.name as subject_name,subjects.exam_category_id from branches join subjects on subjects.id = branches.subject_id
   where branches.is_deleted = 0 and subjects.exam_category_id =`+data.exam_category_id+``);
 
   response = {status: status, msg: message, data: branches};
  return response;
}

async function getbranchescompetitive(data) {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched competitive branches";
  const branches = await db.query(`select branches.id,branches.branch_name,branches.branch_code,branches.status,
  branches.created_at,subjects.name as subject_name,subjects.exam_category_id from branches join subjects on subjects.id = branches.subject_id
   where branches.is_deleted = 0 and subjects.exam_category_id =`+data.exam_category_id+``);
  response = {status: status, msg: message, data: branches};
  return response;
}

async function deletebranch(data)
{
    const record_details = await db.query(`SELECT * FROM branches WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No branch record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update branches set is_deleted = 1 where id = '`+data.recid+`' `);
          message = "Branch record deleted successfully";
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

async function updatestatusbranch(data)
{
    const record_details = await db.query(`SELECT * FROM branches WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No branch record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update branches set status = '`+data.status+`' where id = '`+data.recid+`' `);
          message = "Branch record status updated successfully";
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

async function editbranch(data)
{
    const record_details = await db.query(`SELECT * FROM branches WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No branch record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update branches set branch_name = '`+data.branch_name+`',subject_id = '`+data.subject_id+`',
          branch_code = '`+data.branch_code+`',question_no = '`+data.question_no+`' where id = '`+data.recid+`' `);
          message = "Branch record updated successfully";
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

async function getbranchbycode(data,board_id="") {
  let response = {};
  let status = config.successStatus;
  
  let message = "Fetched branches";
  const branches = await db.query(`select * from subjects where board_id = '`+board_id+`' and is_deleted = 0 and status = 1 and subject_code ='`+data+`'`);
  response = {status: status, msg: message, data: branches};
  return response;
}

async function getbranchesscholastic_bysubjectid(data) {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched scholastic branches";

  const branches = await db.query(`select id,branch_name, subject_id, branch_code, question_no from branches where is_deleted = 0 and subject_id =`+data.subject_id+``);
 
   response = {status: status, msg: message, data: branches};
  return response;
}

module.exports = {
  storebranches,
  getbranchescompetitive,
  deletebranch,
  updatestatusbranch,
  editbranch,
  getbranchesscholastic,
  getbranchbycode,
  getbranchesscholastic_bysubjectid
}
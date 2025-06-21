const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { response } = require('express');

async function storeexamsubtype(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
  const result = await db.query(
    `INSERT INTO exam_subtype (subtype_name, exam_type_id) VALUES ('`+data.subtype_name+`','`+data.exam_type_id+`')`
  );
  if (result.affectedRows) {
    status = 200;
    message = 'Exam subtype added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}
async function getexamsubtype(){
    const record_details = await db.query(`SELECT exam_subtype.*,exam_type.type_name as exam_type FROM exam_subtype left join exam_type on
    exam_subtype.exam_type_id = exam_type.id WHERE exam_subtype.is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No exam type found.';
      response = {status: status, msg: message,data:[]}
      reject(response);
    }
    else{
          message = "Exam sub type list";
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

  async function editexamsubtype(data){
    const record_details = await db.query(`SELECT * FROM exam_subtype WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No exam type found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update exam_subtype set subtype_name = '`+data.subtype_name+`',exam_type_id = '`+data.exam_type_id+`' WHERE id = '`+data.recid+`' and is_deleted = 0`);
          message = "Exam sub type updated successfully";
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

  async function deleteexamsubtype(data){
    const record_details = await db.query(`SELECT * FROM exam_subtype WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No exam type found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update exam_subtype set is_deleted = 1 WHERE id = '`+data.recid+`' and is_deleted = 0`);
          message = "Exam sub type deleted successfully";
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

  async function updatestatusexamsubtype(data){
    const record_details = await db.query(`SELECT * FROM exam_subtype WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No exam sub type found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update exam_subtype set status = '`+data.status+`' WHERE id = '`+data.recid+`' and is_deleted = 0`);
          message = "Exam sub type deleted successfully";
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
 
  async function getexamsubtype_bytype(data){
    const record_details = await db.query(`SELECT exam_subtype.*,exam_type.type_name as exam_type FROM exam_subtype left join exam_type on
    exam_subtype.exam_type_id = exam_type.id WHERE exam_subtype.is_deleted = 0 and exam_subtype.status = 1 and exam_subtype.exam_type_id =`+data.exam_type_id );
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    
    if (record_details.length == 0) {
      message = 'No exam type found.';
      response = {status: status, msg: message,data:[]}
      reject(response);
    }
    else{
          message = "Exam sub type list";
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

module.exports = {
  storeexamsubtype,
  getexamsubtype,
  editexamsubtype,
  deleteexamsubtype,
  updatestatusexamsubtype,
  getexamsubtype_bytype
}
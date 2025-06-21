const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function getconceptmapdetails(data)
{
    const record_details = await db.query("SELECT * FROM e_library WHERE exam_category_id ="+data.exam_category_id+" and exam_type_id ="+data.exam_type_id+" and board_id ="+data.board_id+"\
    and branch_id = "+data.branch_id+" and class_id = "+data.class_id+" and chapter_id = "+data.chapter_id+" and is_deleted = 0 and admin_approved_status = 5 and is_demo = 2");

  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No e-Library record found.';
      response = {status: status, msg: message,data:[]}
      resolve(response);
    }
    else{
          message = "e-Library record";
          let conceptmap = record_details[0].concept_map_path.split(',');
          
          response = {status: 200, msg: message, data: conceptmap.pop()}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}


async function getconceptmapdetails_demo(data,userdata){
  let userid= data.userid;
  let category_id= data.category_id;
  let board_id = "";
  let class_id = "";
  
  let is_demo = 1;
  if(userid > 0){
    is_demo = 3;
    board_id = userdata.board;
    class_id = userdata.class_id;
  }
    let record_details = "";  
    if(is_demo == 3 && category_id == 1){
        record_details = await db.query("SELECT * FROM e_library WHERE exam_category_id = "+category_id+" and class_id = "+class_id+" and board_id = "+board_id+" and is_deleted = 0 and admin_approved_status = 5 and is_demo = "+is_demo);
      }
    else if(is_demo == 3 && category_id == 2){
        record_details = await db.query("SELECT * FROM e_library WHERE exam_category_id = "+category_id+" and class_id = "+class_id+" and is_deleted = 0 and admin_approved_status = 5 and is_demo = "+is_demo);
        
      }  
      else{
        record_details = await db.query("SELECT * FROM e_library WHERE exam_category_id = "+category_id+" and is_deleted = 0 and admin_approved_status = 5 and is_demo = "+is_demo);      
        await db.query("INSERT INTO `demo_elibrary_access`(`library_type`) VALUES ("+category_id+")");
    }
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No e-Library record found.';
      response = {status: status, msg: message,data:[]}
      resolve(response);
    }
    else{
          message = "e-Library record";
          let conceptmap = record_details[0].concept_map_path.split(',');
          
          response = {status: 200, msg: message, data: conceptmap.pop()}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function get_e_library_conceptmapdetails(data,user){
  let category_id = data.category_id;
  let branch_id = data.branch_id;
  let chapter_id = data.chapter_id;
  let record_details;
  if (category_id == 1) {
    record_details = await db.query("SELECT * FROM e_library WHERE exam_category_id = "+category_id+" and chapter_id = "+chapter_id+" and is_deleted = 0 and admin_approved_status = 5 and is_demo = 2");
  }
  else{
    let exam_type_id = data.exam_type_id;
    if(exam_type_id == 1){
        record_details = await db.query("SELECT * FROM e_library WHERE exam_category_id = "+category_id+" and exam_type_id = "+exam_type_id+" and chapter_id = "+chapter_id+" and is_deleted = 0 and admin_approved_status = 5 and is_demo = 2");
    }
    else if(exam_type_id == 2){
      record_details = await db.query("SELECT * FROM e_library WHERE exam_category_id = "+category_id+" and exam_type_id = "+exam_type_id+" and chapter_id = "+chapter_id+" and class_id = "+user.class_id+" and is_deleted = 0 and admin_approved_status = 5 and is_demo = 2");
    }
  }

  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No e-Library record found.';
      response = {status: status, msg: message,data:[]}
      resolve(response);
    }
    else{
      message = "e-Library record";
      let conceptmap = record_details[0].concept_map_path.split(',');    
      response = {status: 200, msg: message, data: conceptmap.pop()}
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
  getconceptmapdetails,
  getconceptmapdetails_demo,
  get_e_library_conceptmapdetails
}
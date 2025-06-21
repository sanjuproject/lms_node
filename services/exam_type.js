const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const academic_session = require('../services/academic_sessions.js');

async function getexamtype(data,userdata)
{
   let user_id = userdata.id;
   let purchased_subscribtions_ary = [];
   let purchased_subscribtions_library_ary = [];
   let purchased_subscribtions_exam_ary = [];
   let session_srart_date = "";
   let session_end_date = "";
   await db.query("select * from `purchased_subscribtions_details` where `student_id` = "+user_id)
   .then(result=>{
      if(result.length > 0)
      {
        result.forEach(Element=>{
          if(Element.exam_category_id == 2){
              purchased_subscribtions_ary.push(Element.type_name);
              if(Element.has_library == 1 || Element.only_library == 1){
                  if(Element.type_name!=''){
                      purchased_subscribtions_library_ary.push(Element.type_name);
                  }
              }
                if(Element.no_set > 0){
                  if(Element.type_name!=''){
                    purchased_subscribtions_exam_ary.push(Element.type_name);
                  }
              }
            }
          
        })
      }
   })

   let ntse_exam_status_query_data = "select * from exam_completed_competitive where exam_type = 'NTSE' and exam_subtype_id = 2 and student_id = "+user_id;

   let ntse_exam_status_result = await db.query(ntse_exam_status_query_data);

let competitive_exam = [];
   
   await db.query("select * from `exam_completed_competitive` where `student_id` = "+user_id+" and exam_category_id = "+data.exam_category)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        competitive_exam.push(Element['exam_type']);
      })
    }
   })
   let academic_session_details = await academic_session.get_academicsessionsby_category(data.exam_category);
   
   await db.query("select students.*,academic_session.course_start_date,academic_session.course_end_date from students left join  academic_session on academic_session.id = students.academic_year where students.id = "+user_id)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        session_srart_date = Element['course_start_date'];
        session_end_date = Element['course_end_date'];
      })
    }
   })
    const record_details = await db.query(`SELECT *,full_name as sub_heading FROM exam_type WHERE exam_category_id = `+data.exam_category+` and exam_type.is_deleted = 0 and exam_type.status = 1`);

  let response = {};
  let status = 200;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No exam type found.';
      response = {status: status, msg: message,data:[]}
      reject(response);
    }
    else{
      let resultdata = [];
      record_details.forEach(Element=>{
        if(purchased_subscribtions_ary.includes(Element.type_name)){
          Element.subscribe = 1;

        }else{
          Element.subscribe = 0;
        }
        if(purchased_subscribtions_library_ary.includes(Element.type_name)){
          Element.e_subscribe = 1;
          
        }else{
          Element.e_subscribe = 0;
        }

        if(competitive_exam.includes(Element.type_name)){
          if(Element.type_name == 'NTSE')
          {
            if(ntse_exam_status_result.length > 0){
              Element.is_exam = 1;
            }else{
              Element.is_exam = 0;
            }
          }else{
            Element.is_exam = 1;
          }
          Element.subscribe = 1;
        }else{
          Element.is_exam = 0;
          //resultdata.push(Element);
        }
        if(purchased_subscribtions_exam_ary.includes(Element.type_name)){
          Element.subscribe = 1;
          
        }else{
          Element.subscribe = 0;
        }

        if(Element.image_path != null){
          Element.image_path = process.env.IMAGEBASEURL+Element.image_path;
        }
        if(academic_session_details.academicyear[Element.id] != undefined){ 
          Element.academic_year = academic_session_details.academicyear[Element.id];
        }
        else{
          Element.academic_year = "";
        }
        Element.course_validity = [];
        if(academic_session_details.course_data[Element.id] != undefined)
        {
          Element.course_validity = academic_session_details.course_data[Element.id];
        }else{
          Element.subscribe = 0;
          Element.e_subscribe = 0;
        }
        let current_date = moment().format('YYYY-MM-DD');
        if(Element.course_validity[1]){
          session_end_date = new Date(Element.course_validity[1]+" 23:59:59");
        }
        //session_end_date = "2024-08-22 12:55:59"// Testing
        if(session_end_date < current_date)
        {
          Element.subscribe = 0;
          Element.e_subscribe = 0;
        }
        resultdata.push(Element);
      })
          message = "Exam type list";
          response = {status: 200, msg: message, data: resultdata}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });
  return promise_result;  
}

async function getexamtype_library(data,userdata)
{
   let user_id = userdata.id;

   let purchased_subscribtions_ary = [];
   let purchased_subscribtions_library_ary = [];
   let purchased_subscribtions_exam_ary = [];
   await db.query("select * from `purchased_subscribtions_details` where `student_id` = "+user_id)
   .then(result=>{
      if(result.length > 0)
      {
        result.forEach(Element=>{
          if(Element.exam_category_id == 2){
              purchased_subscribtions_ary.push(Element.type_name);
              if(Element.has_library == 1 || Element.only_library == 1){
                  if(Element.type_name!=''){
                      purchased_subscribtions_library_ary.push(Element.type_name);
                  }
              }
                if(Element.no_set > 0){
                  if(Element.type_name!=''){
                    purchased_subscribtions_exam_ary.push(Element.type_name);
                  }
              }
            }
          
        })
      }
   })

let competitive_exam = [];
   await db.query("select elibrary_visit_log.*,exam_type.type_name from `elibrary_visit_log` left join subjects on subjects.id = elibrary_visit_log.subject_id left join exam_type on exam_type.id = subjects.exam_type_id where subjects.exam_category_id = "+data.exam_category_id+" and elibrary_visit_log.student_id = "+user_id)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        competitive_exam.push(Element['type_name']);
      })
    }
   })

    const record_details = await db.query(`SELECT *,full_name as sub_heading FROM exam_type WHERE exam_category_id = `+data.exam_category_id+` and exam_type.is_deleted = 0 and exam_type.status = 1`);
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
      let resultdata = [];
      record_details.forEach(Element=>{
        
        if(purchased_subscribtions_library_ary.includes(Element.type_name)){
          Element.e_subscribe = 1;
          
        }else{
          Element.e_subscribe = 0;
        }

        if(competitive_exam.includes(Element.type_name)){
          {
            Element.is_view = 1;
          }
         
        }else{
          Element.is_view = 0;
        }

        if(Element.image_path != null){
          Element.image_path = process.env.IMAGEBASEURL+Element.image_path;
        }

        resultdata.push(Element);
      })
          message = "Exam type list";
          response = {status: 200, msg: message, data: resultdata}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });
  return promise_result;  
}

///////////////////////////////// ARCHIVE //////////////////////////////////

async function getexamtype_archive(data,userdata)
{
   let user_id = userdata.id;
   let class_no = userdata.class;
  
   let purchased_subscribtions_ary = [];
   let purchased_subscribtions_library_ary = [];
   let purchased_subscribtions_exam_ary = [];
   await db.query("select * from `purchased_subscribtions_details` where `student_id` = "+user_id)
   .then(result=>{
      if(result.length > 0)
      {
        result.forEach(Element=>{
          if(Element.exam_category_id == 2){
              purchased_subscribtions_ary.push(Element.type_name);
              if(Element.has_library == 1 || Element.only_library == 1){
                  if(Element.type_name!=''){
                      purchased_subscribtions_library_ary.push(Element.type_name);
                  }
              }
                if(Element.no_set > 0){
                  if(Element.type_name!=''){
                    purchased_subscribtions_exam_ary.push(Element.type_name);
                  }
              }
            }
          
        })
      }
   })

   let ntse_exam_status_query_data = "select * from exam_completed_competitive_archive where previous_class = "+class_no+" and exam_type = 'NTSE' and exam_subtype_id = 2 and student_id = "+user_id;

   let ntse_exam_status_result = await db.query(ntse_exam_status_query_data);

let competitive_exam = [];
   
   await db.query("select * from `exam_completed_competitive_archive` where previous_class = "+class_no+" and student_id = "+user_id+" and exam_category_id = "+data.exam_category)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        competitive_exam.push(Element['exam_type']);
      })
    }
   })
   let academic_session_details = await academic_session.get_academicsessionsby_category(data.exam_category);

    const record_details = await db.query(`SELECT *,full_name as sub_heading FROM exam_type WHERE exam_category_id = `+data.exam_category+` and exam_type.is_deleted = 0 and exam_type.status = 1`);
  let response = {};
  let status = 200;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No exam type found.';
      response = {status: status, msg: message,data:[]}
      reject(response);
    }
    else{
      let resultdata = [];
      record_details.forEach(Element=>{
        if(purchased_subscribtions_ary.includes(Element.type_name)){
          Element.subscribe = 1;
          
        }else{
          Element.subscribe = 0;
        }
        if(purchased_subscribtions_library_ary.includes(Element.type_name)){
          Element.e_subscribe = 1;
          
        }else{
          Element.e_subscribe = 0;
        }

        if(competitive_exam.includes(Element.type_name)){
          if(Element.type_name == 'NTSE')
          {
            if(ntse_exam_status_result.length > 0){
              Element.is_exam = 1;
            }else{
              Element.is_exam = 0;
            }
          }else{
            Element.is_exam = 1;
          }
          Element.subscribe = 1;
        }else{
          Element.is_exam = 0;
          //resultdata.push(Element);
        }

        if(purchased_subscribtions_exam_ary.includes(Element.type_name)){
          Element.subscribe = 1;
          
        }else{
          Element.subscribe = 0;
        }

        if(Element.image_path != null){
          Element.image_path = process.env.IMAGEBASEURL+Element.image_path;
        }
        if(academic_session_details.academicyear[Element.id] != undefined)
        {
          Element.academic_year = academic_session_details.academicyear[Element.id];
        }
        else{
          Element.academic_year = "";
        }
        Element.course_validity = [];
        if(academic_session_details.course_data[Element.id] != undefined)
        {
          Element.course_validity = academic_session_details.course_data[Element.id];
        }
        
        resultdata.push(Element);
      })
          message = "Exam type list";
          response = {status: 200, msg: message, data: resultdata}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });
  return promise_result;  
}

async function getexamtype_library_archive(data,userdata)
{
   let user_id = userdata.id;
   let class_no = userdata.class;
   let purchased_subscribtions_ary = [];
   let purchased_subscribtions_library_ary = [];
   let purchased_subscribtions_exam_ary = [];
   await db.query("select * from `purchased_subscribtions_details` where `student_id` = "+user_id)
   .then(result=>{
      if(result.length > 0)
      {
        result.forEach(Element=>{
          if(Element.exam_category_id == 2){
              purchased_subscribtions_ary.push(Element.type_name);
              if(Element.has_library == 1 || Element.only_library == 1){
                  if(Element.type_name!=''){
                      purchased_subscribtions_library_ary.push(Element.type_name);
                  }
              }
                if(Element.no_set > 0){
                  if(Element.type_name!=''){
                    purchased_subscribtions_exam_ary.push(Element.type_name);
                  }
              }
            }
          
        })
      }
   })

let competitive_exam = [];
   await db.query("select elibrary_access_log_archive.*,exam_type.type_name from `elibrary_access_log_archive` left join subjects on subjects.id = elibrary_access_log_archive.subject_id left join exam_type on exam_type.id = subjects.exam_type_id where elibrary_access_log_archive.previous_class = "+class_no+" and subjects.exam_category_id = "+data.exam_category_id+" and elibrary_access_log_archive.student_id = "+user_id)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        competitive_exam.push(Element['type_name']);
      })
    }
   })

    const record_details = await db.query(`SELECT *,full_name as sub_heading FROM exam_type WHERE exam_category_id = `+data.exam_category_id+` and exam_type.is_deleted = 0 and exam_type.status = 1`);
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
      let resultdata = [];
      record_details.forEach(Element=>{
        
        if(purchased_subscribtions_library_ary.includes(Element.type_name)){
          Element.e_subscribe = 1;
          
          
        }else{
          Element.e_subscribe = 0;
          
        }

        if(competitive_exam.includes(Element.type_name)){
          {
            Element.is_view = 1;
            Element.subscribe = 1;
          }
         
        }else{
          Element.is_view = 0;
          Element.subscribe = 0;
        }

        if(Element.image_path != null){
          Element.image_path = process.env.IMAGEBASEURL+Element.image_path;
        }

        resultdata.push(Element);
      })
          message = "Exam type list";
          response = {status: 200, msg: message, data: resultdata}
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
    getexamtype,
    getexamtype_library,
    getexamtype_archive,
    getexamtype_library_archive
}
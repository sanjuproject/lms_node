const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');

async function getclasses()
{
    const record_details = await db.query(`SELECT * FROM classes WHERE is_deleted = 0 and status = 1 order by class_no ASC`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No class record found.';
      response = {status: status, msg: message,data:[]}
      resolve(response);
    }
    else{
          message = "Class record list";
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

async function storeclasses(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
  const result = await db.query(
    `INSERT INTO classes (class_no, short_code) VALUES ('`+data.class_no+`','`+data.short_code+`')`
  );
  if (result.affectedRows) {
    status = 200;
    message = 'Class added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}

async function deleteclasses(data)
{
    const record_details = await db.query(`SELECT * FROM classes WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No class record found.';
      response = {status: status, msg: message}
      resolve(response);
    }
    else{
          db.query(`update classes set is_deleted = 1 where id = '`+data.recid+`' `);
          message = "Class record deleted successfully";
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

async function updatestatusclasses(data)
{
    const record_details = await db.query(`SELECT * FROM classes WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No class record found.';
      response = {status: status, msg: message}
      resolve(response);
    }
    else{
          db.query(`update classes set status = '`+data.status+`' where id = '`+data.recid+`' `);
          message = "Class record status updated successfully";
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

async function editclass(data)
{
    const record_details = await db.query(`SELECT * FROM classes WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No class record found.';
      response = {status: status, msg: message}
      resolve(response);
    }
    else{
          db.query(`update classes set class_no = '`+data.class_no+`',short_code = '`+data.short_code+`' where id = '`+data.recid+`' `);
          message = "Class record updated successfully";
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

async function getclasses_after_login(data){
  let user_id = data.id;
  let academic_year = 0;
  let course_end_date = "";
  let is_expired = 1;
  let current_class = 0;
  let student_create_date = "";
  let year_diff = 0
  let student_board = 0;
  let academic_session_id = 0;
  await db.query(`select students.*,academic_session.id as academic_session_id,academic_session.course_end_date,academic_session.is_expired from students left join academic_session on academic_session.id = students.academic_year where students.is_deleted = 0 and students.id = `+user_id)
  .then((result) => {
    if (result.length > 0) {
      academic_year = result[0].academic_year;
      course_end_date = result[0].course_end_date;
      is_expired = result[0].is_expired;
      current_class = result[0].standard;
      student_create_date = result[0].created_at;
      let current_date = moment().format('YYYY-MM-DD');
      academic_session_id = result[0].academic_session_id;
      student_board = result[0].board;
      if(current_date > course_end_date){
        is_expired = 2;
      }
    }
  })
  .catch((err) => {
    console.log(err)
  })
  await db.query("SELECT * FROM `academic_session` WHERE is_deleted = 0 AND status = 1 AND `id` >= "+academic_year+" AND `exam_category_id` = 1 AND `exam_board_type` = "+student_board+" ORDER BY `id` ASC")
  .then((result) => {
    if (result.length > 0) {
      year_diff = result.length;
    }
  })
  const record_details = await db.query(`SELECT * FROM classes WHERE class_no >= `+current_class+` and is_deleted = 0 and status = 1 order by class_no ASC limit 0,`+year_diff+``);
  let response = {};
  let status = config.errorStatus;
  let resultdata = [];
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No class record found.';
      response = {status: status, msg: message,data:[]}
      resolve(response);
    }
    else{
          message = "Class record list";
          record_details.forEach(element => {
            resultdata.push(element);
          })
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

async function getclasses_archive(data){
  let user_id = data.id;
  let resultdata = [];
  let message = "Class record list";

  await db.query(`select exam_completed_archive.previous_class,classes.* from exam_completed_archive left join classes on classes.class_no = exam_completed_archive.previous_class where exam_completed_archive.student_id = `+user_id+` group by exam_completed_archive.previous_class`)
  .then(async (result) => {
    if (result.length > 0) {
      result.forEach(element => {
        resultdata.push(element);
      })
    }else{
      await db.query(`select exam_completed_competitive_archive.previous_class,classes.* from exam_completed_competitive_archive left join classes on classes.class_no = exam_completed_competitive_archive.previous_class where exam_completed_competitive_archive.student_id = `+user_id+` group by exam_completed_competitive_archive.previous_class`)
      .then(async(result) => {
        if (result.length > 0) {
          result.forEach(element => {
            resultdata.push(element);
          })
        }else{
          await db.query(`select elibrary_access_log_archive.previous_class,classes.* from elibrary_access_log_archive left join classes on classes.class_no = elibrary_access_log_archive.previous_class where elibrary_access_log_archive.student_id = `+user_id+` group by elibrary_access_log_archive.previous_class`)
          .then(async(result) => {
            if (result.length > 0) {
              result.forEach(element => {
                resultdata.push(element);
              })
            }
          })
        }
      })
    }
  })
  .catch((err) => {
    console.log(err)
  })

  response = {status: 200, msg: message, data: resultdata}
  return response;
}

module.exports = 
{
  getclasses,
  storeclasses,
  deleteclasses,
  updatestatusclasses,
  editclass,
  getclasses_after_login,
  getclasses_archive
}
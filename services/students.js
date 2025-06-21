const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const academic_session = require('../services/academic_sessions');

async function update_student_class(data) {
  let academic_session = 0;
  await db.query("select * from `academic_session` where `exam_board_type` = " + data.board + " and exam_category_id = 1 and is_deleted = 0 and status = 1 and is_expired = 1 and course_end_date > CURDATE() order by academic_year limit 0,1")
    .then(async result => {
      if (result.length > 0) {
        academic_session = result[0].id;
        await db.query("delete from purchased_subscribtions where student_id = " + data.id);
        await db.query("delete from purchased_subscribtions_details where student_id = " + data.id);
        ///////////////////////////////

        //await db.query("update `elibrary_access_log_archive` set previous_class = "+(data.class_id - 1)+" where student_id = "+data.id);
        //await db.query("update `elibrary_visit_log_archive` set previous_class = "+(data.class_id - 1)+" where student_id = "+data.id);
        //await db.query("update `exam_completed_archive` set previous_class = "+(data.class_id - 1)+" where student_id = "+data.id);
        //await db.query("update `exam_completed_competitive_archive` set previous_class = "+(data.class_id - 1)+" where student_id = "+data.id);
        //await db.query("update `searched_questions_archive` set previous_class = "+(data.class_id - 1)+" where student_id = "+data.id);
      }
    })

  if (academic_session > 0) {
    
    const record_details = await db.query(`update students set standard = ` + data.class_id + ` where id = ` + data.id);
  }
  let response = {};
  let status = 200;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (academic_session == 0) {
      message = 'No academic session found.';
      response = { status: status, msg: message, data: [] }
      resolve(response);
    }
    else {
      let response_data = await get_student_details_by_id(data.id);

      let mailbody = config.update_class_successful.body.replace('#CLASS#', "Class " + data.class_id);
      mailbody = mailbody.replace('#student#', response_data.data.fname);

      let reqest_data = { email: response_data.data.email, subject: config.update_class_successful.subject, body: mailbody }
      helper.sendmail(reqest_data);

      message = "Class record updated successfully";
      response = { status: 200, msg: message }
      resolve(response);
    }
  }).then((value) => {
    return value;
  }).catch((err) => {
    return err;
  });

  return promise_result;
}

async function get_student_details_by_id(data) {
  const record_details = await db.query(`select students.*,academic_session.id as academic_id,academic_session.academic_year,academic_session.academy_start_date,academic_session.academy_end_date,academic_session.course_start_date,academic_session.course_end_date,boards.name as board_name,boards.short_code as board_code,logindevices.login_token as token from students left join academic_session on academic_session.id = students.academic_year join boards on boards.id = students.board join logindevices on logindevices.userid = students.id where logindevices.usertype = 1 and students.id = ` + data);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No record found.';
      response = { status: status, msg: message, data: [] }
      resolve(response);
    }
    else {
      message = "Student record details";
      response = { status: 200, msg: message, data: record_details[0] }
      resolve(response);
    }
  }).then((value) => {
    return value;
  }).catch((err) => {
    return err;
  });

  return promise_result;
}
async function call_cronjob_archive_exam(student_id, standard_id) {

  await db.query("select students.id,students.standard,academic_session.is_expired from students left join academic_session on academic_session.id = students.academic_year where students.id = " + student_id)
    .then(async result_inner => {
      if (result_inner.length > 0 && result_inner[0].is_expired == 2) {

            await db.query("delete from `exam_completed_archive` where `student_id` = " + student_id+" and `previous_class` = "+result_inner[0].standard);
						await db.query("delete from `exam_completed_competitive_archive` where `student_id` = " +student_id+" and `previous_class` = "+result_inner[0].standard);
						await db.query("delete from `elibrary_access_log_archive` where `student_id` = " +student_id+" and `previous_class` = "+result_inner[0].standard);
						await db.query("delete from `elibrary_visit_log_archive` where `student_id` = " +student_id+" and `previous_class` = "+result_inner[0].standard);
						await db.query("delete from `searched_questions_archive` where `student_id` = " +student_id+" and `previous_class` = "+result_inner[0].standard);
      }
    })
  await db.query("delete from demo_question_answers where student_id = " + student_id);
  await db.query("update students set demo_exam_status = 0 where id = " + student_id);
  let sch_status = 0;
  let com_status = 0
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://' + process.env.HOSTNAME + '/apiv2/lms/cronjob/achive_competitve_exam/' + student_id + '/' + standard_id + '',
    headers: {}
  };
  if(process.env.HOSTNAME === 'localhost:4000'){
  config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'http://' + process.env.HOSTNAME + '/apiv2/lms/cronjob/achive_competitve_exam/' + student_id + '/' + standard_id + '',
    headers: {}
  };
  }
  
  axios.request(config)
    .then(async (response) => {
      sch_status = 1;
      let config2 = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://' + process.env.HOSTNAME + '/apiv2/lms/cronjob/archive_scholastic_exam/' + student_id + '/' + standard_id + '',
        headers: {}
      };
      if(process.env.HOSTNAME === 'localhost:4000'){
      config2 = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://' + process.env.HOSTNAME + '/apiv2/lms/cronjob/archive_scholastic_exam/' + student_id + '/' + standard_id + '',
        headers: {}
      };
    }
      axios.request(config2)
        .then(async (response2) => {
          com_status = 1;
          if (com_status == 1 && sch_status == 1) {
            await academic_session.update_academicessions_student_id(student_id);
          }
        })
        .catch((error) => {
          console.log(error);
        });
        let config3 = {
          method: 'get',
          maxBodyLength: Infinity,
          url: 'https://' + process.env.HOSTNAME + '/apiv2/lms/cronjob/archive_purchase/' + student_id + '/' + standard_id + '',
          headers: {}
        };
        if(process.env.HOSTNAME === 'localhost:4000'){
      config3 = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://' + process.env.HOSTNAME + '/apiv2/lms/cronjob/archive_purchase/' + student_id + '/' + standard_id + '',
        headers: {}
      };
    }
      axios.request(config3)
        .then(async (response3) => {
          //console.log("Purchased data archiving", response3)
        })

    })
    .catch((error) => {
      console.log(error);
    });



}
async function checkprofil(data) {
  let response = {};
  const result = await db.query(`SELECT pincode,school_name,school_address FROM students WHERE (pincode='' OR school_name='' OR school_address='' OR pincode IS NULL OR school_name IS NULL OR school_address IS NULL) AND id='${data.student_id}'`);
  if (result.length>0) {
    response = { status: 200, msg: "Profile not completed", isComplete: 1, data: result }
  } else {
    response = { status: 200, msg: "Profile already completed", isComplete: 0, data: result }
  }
  return response;
}
module.exports =
{
  update_student_class,
  get_student_details_by_id,
  call_cronjob_archive_exam,
  checkprofil
}
const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const static_data_json = require('../static_data_json.json');
const moment = require('moment');
async function getrecords(data)
{
  let exam_category_id = data.exam_category_id;
  let exam_board_type = data.exam_board_type;
  let session_name = data.session_name;
  let course_start_date = data.course_start_date;
  let course_end_date = data.course_end_date;
  let academic_year = data.academy;
  let search_status = data.status;
  
let category_ary = [];
  await db.query("select * from `exam_categories` where `is_deleted` = 0")
  .then(result=>{
    result.forEach(element => {
      if(category_ary[element.id] == undefined)
        {
          category_ary[element.id] = "";
        }
        category_ary[element.id] = element.category;
    })
  })

  let examtype_ary = [];
  await db.query("select * from `exam_type` where `is_deleted` = 0")
  .then(result=>{
    result.forEach(element => {
      if(examtype_ary[element.id] == undefined)
        {
          examtype_ary[element.id] = "";
        }
        examtype_ary[element.id] = element.type_name;
    })
  })

  let board_ary = [];
  await db.query("select * from `boards` where `is_deleted` = 0")
  .then(result=>{
    result.forEach(element => {
      if(board_ary[element.id] == undefined)
        {
          board_ary[element.id] = "";
        }
        board_ary[element.id] = element.name;
    })
  })

  const offset = helper.getOffset(data.page, config.listPerPage);
  let condition = "";

  if(exam_category_id != "" && exam_category_id != 0)
  {
    condition += ` and exam_category_id = `+exam_category_id+``;
  }
  if(data.current_date != "" && data.current_date != 0 && data.current_date != undefined)
  {
    condition += ` and course_end_date < '`+data.current_date+`'`;
  }
  if(exam_board_type != "" && exam_board_type != 0)
  {
    condition += ` and exam_board_type = `+exam_board_type+``;
  }
  if(session_name != "")
  {
    condition += ` and session_name like '%`+session_name+`%'`;
  }
  if(course_start_date != "" && course_start_date != 0)
  {
    condition += ` and course_start_date >= '`+course_start_date+`'`;
  }
  if(course_end_date != "" && course_end_date != 0)
  {
    condition += ` and course_end_date <= '`+course_end_date+`'`;
  }
  if(academic_year != "")
  {
    condition += ` and academic_year = '`+academic_year+`'`;
  }
  if(search_status != "")
    {
      condition += ` and status = `+search_status+``;
    }
  const record_details_count = await db.query(`SELECT * FROM academic_session WHERE is_deleted = 0 `+condition);

  const record_details = await db.query(`SELECT * FROM academic_session WHERE is_deleted = 0 `+condition+` limit `+config.listPerPage+` offset `+offset);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'Academic session not found.';
      response = {status: 200, msg: message,data:[]}
      reject(response);
    }
    else{
          message = "Academic session list";
          record_details.forEach(Element=>{
            delete Element['created_at'];
            delete Element['updated_at'];
            delete Element['is_deleted'];
        
            Element['category'] = category_ary[Element['exam_category_id']];
            if(Element['exam_category_id'] == 1)
              {
                Element['exam_board_type_name'] = board_ary[Element['exam_board_type']];    
              }else{
            Element['exam_board_type_name'] = examtype_ary[Element['exam_board_type']];
              }
          });

          response = {status: 200, msg: message, data: record_details,total_page :Math.ceil(record_details.length/config.listPerPage),total_record:record_details_count.length}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function deleterecord(data)
{
    const record_details = await db.query("SELECT * FROM academic_session WHERE id ='"+data.recid+"' and is_deleted = 0");
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          message = "Academic session deleted";
          db.query("update academic_session set `is_deleted` = 1 WHERE id ='"+data.recid+"' and is_deleted = 0");
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
async function add_record(data)
{
  let response = {};
  let status = 400;
  let message = "Something went wrong, please try again later.";
  
  let academic_year = data.academy_start_date+"-"+data.academy_end_date;

  const result = await db.query(`INSERT INTO academic_session(exam_category_id, exam_board_type, session_name,academic_year, academy_start_date, academy_end_date, course_start_date, course_end_date) VALUES ('`+data.exam_category_id+`','`+data.exam_board_type+`','`+data.session_name+`','`+academic_year+`','`+data.academy_start_date+`','`+data.academy_end_date+`','`+data.course_start_date+`','`+data.course_end_date+`')`);
  if (result.affectedRows) {
    status = 200;
    message = 'Academic session added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}
async function update_status(data)
{
    const record_details = await db.query("SELECT * FROM academic_session WHERE id ='"+data.recid+"' and is_deleted = 0");
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
        let update_status = 0;
        if(record_details[0].status == 1){
            update_status = 2;
        }else{
            update_status = 1;
        }
          message = "Academic session status updated successfully";
          db.query("update academic_session set `status` = "+update_status+" WHERE id ='"+data.recid+"' and is_deleted = 0");
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

async function update_record(data)
{
    const record_details = await db.query("SELECT * FROM academic_session WHERE id ='"+data.recid+"' and is_deleted = 0");
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          message = "Academic session updated";
          await db.query("update academic_session set `exam_category_id` = '"+data.exam_category_id+"', `exam_board_type` = '"+data.exam_board_type+"', `session_name` = '"+data.session_name+"', `academy_start_date` = '"+data.academy_start_date+"', `academy_end_date` = '"+data.academy_end_date+"', `course_start_date` = '"+data.course_start_date+"', `course_end_date` = '"+data.course_end_date+"' WHERE id ='"+data.recid+"' and is_deleted = 0");
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

async function get_academicsessionsby_board(data)
{
  let current_date = moment().format("YYYY-MM-DD");
    const record_details = await db.query("SELECT * FROM academic_session WHERE exam_board_type = "+data.board_id+" and exam_category_id = 1 and is_deleted = 0 and status = 1 and is_expired = 1 order by academic_year");

  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
      const mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          message = "Academic session list";
          let academic_year = [];
          let course_data = []
            if(record_details.length > 0){
              record_details.forEach(Element=>{
                let year_ary = Element.academic_year.split('-');
                let start_date = mS[parseInt(year_ary[1] - 1)]+" "+year_ary[0];
                let end_date = mS[parseInt(year_ary[3] - 1)]+" "+year_ary[2];
                
                  let academicyear = start_date+" - "+end_date;
                  
                  academic_year.push({"id":Element.id,"academicyear":academicyear})
                course_data.push(Element.course_start_date)
                course_data.push(Element.course_end_date)
                course_data.push(Element.is_expired)
                course_data.push(Element.academy_start_date)
                course_data.push(Element.academy_end_date)
              })
            }
          response = {status: 200, msg: message,list:academic_year,course_data:course_data}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function get_academicsessionsby_examtype(data)
{
  let current_date = moment().format("YYYY-MM-DD");
    const record_details = await db.query("SELECT * FROM academic_session WHERE exam_board_type = "+data.exam_type+" and exam_category_id = 2 and is_deleted = 0 and status = 1 and course_end_date >= '"+current_date+"' order by academic_year limit 1");

  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          message = "Academic session list";
          let academic_year = [];
          let course_data = []
            if(record_details.length > 0){
              record_details.forEach(Element=>{
                academic_year.push(Element.academic_year)
                course_data.push(Element.course_start_date)
                course_data.push(Element.course_end_date)
              })
            }
          response = {status: 200, msg: message,list:academic_year,course_data:course_data}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });
  return promise_result;  
}

async function check_academic_session_exist(data){
  let current_date = moment().format("YYYY-MM-DD");
    const record_details = await db.query("SELECT * FROM academic_session WHERE exam_board_type = "+data.board_type+" and exam_category_id = "+data.category+" and is_deleted = 0 and status = 1 and is_expired = 1 order by academic_year limit 0,1");
  let response = {};
  const mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  let status = config.errorStatus;
  let couese_exist = 0;
  let show_alert_msg = 1;
  let date_diff = await helper.calculate_date_diff(record_details[0].course_end_date);
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (record_details.length == 0) {
      let year_ary = record_details[0].academic_year.split('-');
                let start_date = mS[parseInt(year_ary[1] - 1)]+" "+year_ary[0];
                let end_date = mS[parseInt(year_ary[3] - 1)]+" "+year_ary[2];
                
                  let academicyear = start_date+" - "+end_date;
      message = 'Subscription expired.';
      response = {status: status, msg: message,couese_exist:couese_exist,academic_year:academicyear,course_start_date:record_details[0].course_start_date,course_end_date:record_details[0].course_end_date,recid:record_details[0].id,show_alert_msg:show_alert_msg}
      reject(response);
    }else{
        couese_exist = 1;
        let expire_date_ary = record_details[0].course_end_date.split('-');
        message = 'Subscription will be expired on '+expire_date_ary[2]+"/"+expire_date_ary[1]+"/"+expire_date_ary[0];
        if(date_diff > process.env.SHOW_ALERT_TIME){
          show_alert_msg = 0;
        }
        let year_ary = record_details[0].academic_year.split('-');
                let start_date = mS[parseInt(year_ary[1] - 1)]+" "+year_ary[0];
                let end_date = mS[parseInt(year_ary[3] - 1)]+" "+year_ary[2];
                
                  let academicyear = start_date+" - "+end_date;
        response = {status: config.successStatus, msg: message,couese_exist:couese_exist,academic_year:academicyear,course_start_date:record_details[0].course_start_date,course_end_date:record_details[0].course_end_date,recid:record_details[0].id,show_alert_msg:show_alert_msg}
        resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function get_academicsessionsby_category(category)
{
  let current_date = moment().format("YYYY-MM-DD");
    const record_details = await db.query("SELECT * FROM academic_session WHERE exam_category_id = "+category+" and is_deleted = 0 and status = 1 and course_end_date > '"+current_date+"' order by academic_year ASC");

  let response = {};
  const mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message,course_data:[],academicyear:""}
      reject(response);
    }
    else{
          message = "Academic session list";
          let academic_year = [];
          let course_data = []
            if(record_details.length > 0){
              record_details.forEach(Element=>{
                let academic_year_ary = Element.academic_year.split('-');
                let start_date = mS[parseInt(academic_year_ary[1] - 1)]+" "+academic_year_ary[0];
                let end_date = mS[parseInt(academic_year_ary[3] - 1)]+" "+academic_year_ary[2];
                
                let academicyear = start_date+" - "+end_date;
              if(course_data[Element.exam_board_type] == null)
                {
                  course_data[Element.exam_board_type] = [];
                  academic_year[Element.exam_board_type] = "";
                }  
                course_data[Element.exam_board_type].push(Element.course_start_date)
                course_data[Element.exam_board_type].push(Element.course_end_date)
                academic_year[Element.exam_board_type] = academicyear;
              })
            }
          response = {status: 200, msg: message,academicyear:academic_year,course_data:course_data}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });
  return promise_result;  
}


async function get_academicsessionsby_id(data)
{
  let current_date = moment().format("YYYY-MM-DD");
    const record_details = await db.query("SELECT * FROM academic_session WHERE id = "+data.id+" and is_deleted = 0 and status = 1 order by academic_year ");

  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
      const mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          message = "Academic session list";
          let academic_year = [];
          let course_data = []
            if(record_details.length > 0){
              record_details.forEach(Element=>{
                let year_ary = Element.academic_year.split('-');
                let start_date = mS[parseInt(year_ary[1] - 1)]+" "+year_ary[0];
                let end_date = mS[parseInt(year_ary[3] - 1)]+" "+year_ary[2];
                
                  let academicyear = start_date+" - "+end_date;
                  academic_year.push({"id":Element.id,"academicyear":academicyear,"is_expired":Element.is_expired})
                
                course_data.push(Element.course_start_date)
                course_data.push(Element.course_end_date)
              })
            }
          response = {status: 200, msg: message,list:academic_year,course_data:course_data}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function get_academicsessionsbyid(data)
{
  let current_date = moment().format("YYYY-MM-DD");
    const record_details = await db.query("SELECT * FROM academic_session WHERE id = "+data+" and is_deleted = 0 and status = 1 order by academic_year ");

  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
      const mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          message = "Academic session list";
          let academic_year = [];
          let course_data = []
            if(record_details.length > 0){
              record_details.forEach(Element=>{
                let year_ary = Element.academic_year.split('-');
                let start_date = mS[parseInt(year_ary[1] - 1)]+" "+year_ary[0];
                let end_date = mS[parseInt(year_ary[3] - 1)]+" "+year_ary[2];
                
                  let academicyear = start_date+" - "+end_date;
                  academic_year.push({"id":Element.id,"academicyear":academicyear})
                
                course_data.push(Element.course_start_date)
                course_data.push(Element.course_end_date)
              })
            }
          response = {status: 200, msg: message,list:academic_year,course_data:course_data}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function update_academicessions_student_id(data)
{
  await db.query("select * from students where id = "+data+" ")
  .then(async(result) => {
    if(result.length > 0)
    {
      await db.query("SELECT * FROM academic_session WHERE exam_category_id = 1 and exam_board_type = "+result[0].board+" and is_deleted = 0 and status = 1 and is_expired = 1 and course_end_date > CURDATE() limit 0,1")
      .then(async(result2) => {
        if(result2.length > 0)
        {
          await db.query("UPDATE students SET academic_year = "+result2[0].id+" where id = "+data+" ")
          //await db.query("UPDATE elibrary_access_log_archive SET previous_class = "+result[0].standard+" where student_id = "+data+" ")
          //await db.query("UPDATE elibrary_visit_log_archive SET previous_class = "+result[0].standard+" where student_id = "+data+" ")
          //await db.query("UPDATE exam_completed_archive SET previous_class = "+result[0].standard+" where student_id = "+data+" ")
          //await db.query("UPDATE exam_completed_competitive_archive SET previous_class = "+result[0].standard+" where student_id = "+data+" ")
          //await db.query("UPDATE searched_questions_archive SET previous_class = "+result[0].standard+" where student_id = "+data+" ")

        }
      })
    }
  })
  let response = "Academic Session updated successfully.";
  return response;
}

async function get_academicessions_by_student_id(data)
{
  const record_details = await db.query("SELECT academic_session.is_expired,students.academic_year,students.id,academic_session.academic_year,academic_session.course_start_date,academic_session.course_end_date FROM students left join academic_session on students.academic_year = academic_session.id WHERE students.id = "+data.id+" and students.is_deleted = 0 and students.status = 1");

  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async (resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No academic session found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
      const mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          message = "Academic session list";
          let academic_year = [];
          let course_data = []
            if(record_details.length > 0){
              record_details.forEach(Element=>{
                let year_ary = Element.academic_year.split('-');
                let start_date = mS[parseInt(year_ary[1] - 1)]+" "+year_ary[0];
                let end_date = mS[parseInt(year_ary[3] - 1)]+" "+year_ary[2];
                
                  let academicyear = start_date+" - "+end_date;
                  academic_year.push({"id":Element.id,"academicyear":academicyear})
                
                  course_data.push(Element.course_start_date)
                  course_data.push(Element.course_end_date)
                  course_data.push(Element.is_expired)
              })
            }
          response = {status: 200, msg: message,list:academic_year,course_data:course_data}
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
  getrecords,
  add_record,
  deleterecord,
  update_status,
  update_record,
  get_academicsessionsby_board,
  get_academicsessionsby_examtype,
  check_academic_session_exist,
  get_academicsessionsby_category,
  get_academicsessionsby_id,
  get_academicsessionsbyid,
  update_academicessions_student_id,
  get_academicessions_by_student_id
}
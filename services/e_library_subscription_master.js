const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const academic_session = require('../services/academic_sessions.js');
const moment = require('moment');
async function list_competetive(data, subscribed_details, subscribed_details_purchased){
  let response = {};
  let status = config.successStatus;
  let message = "Fetched subscription details.";
  let list = [];
  if (data.class_id != "" || data.class_id != 0) {
    list = await db.query(`select e_library_subscription_master.*,exam_type.type_name from e_library_subscription_master\
   left join exam_type on exam_type.id = e_library_subscription_master.exam_type_id where e_library_subscription_master.exam_type_id = `+data.exam_type+` and e_library_subscription_master.class = `+data.class_id+` and e_library_subscription_master.is_deleted = 0 and e_library_subscription_master.status = 1 order by e_library_subscription_master.id desc`);
  }
  else{
    list = await db.query(`select e_library_subscription_master.*,exam_type.type_name from e_library_subscription_master\
   left join exam_type on exam_type.id = e_library_subscription_master.exam_type_id where e_library_subscription_master.exam_type_id = `+data.exam_type+` and e_library_subscription_master.is_deleted = 0 and e_library_subscription_master.status = 1 order by e_library_subscription_master.id desc`);
  }
  
  let detailsdata = [];
  let counter  = 0;

  list.forEach(Element=>{
    if(subscribed_details_purchased.length > 0)
    {    
      Element.is_purchased = 0;
      subscribed_details_purchased.forEach(Element_inner=>{
        //if(Element_inner.subscription_id == Element.id)
        {
          Element.cart_amount = Element_inner.cart_amount;
          Element.purchased_no_set = Element_inner.no_set;
          Element.purchased_no_module = Element_inner.no_module;
          Element.purchased_no_mock = Element_inner.no_mock;
          Element.has_library = Element_inner.has_library;
          Element.only_elibrary = Element_inner.only_elibrary;
          if(Element_inner.has_library == 1 || Element_inner.only_elibrary == 1){
            Element.is_purchased = 1;
          }
        }
      })
    }else{
      Element.is_purchased = 0;

      Element.cart_amount = 0;
      Element.purchased_no_set = 0;
      Element.purchased_no_module = 0;
      Element.purchased_no_mock = 0;
      Element.has_library = 0;
      Element.only_elibrary = 0;
    }
      detailsdata[counter] = Element;
      counter++;
    
  });

  //////////////////////////////// ACADEMIC SESSION DETAILS ////////////////////////////////
let academic_year = "";
let course_validity = "";
let current_date =  moment().format("YYYY-MM-DD");
let course_available = 1;
let academic_session_expired = 0;
let academic_session_data = await academic_session.get_academicsessionsby_examtype(data)
let academic_session_expired_ary = await academic_session.get_academicessions_by_student_id(data)
if(academic_session_data.status == 200){
  academic_year = academic_session_data.list[0];
  academic_session_expired = academic_session_expired_ary.course_data[2];
  course_validity = academic_session_data.course_data[0]+"-"+academic_session_data.course_data[1];
  let firstDate = new Date(academic_session_data.course_data[1]),
    secondDate = new Date(current_date),
    timeDifference = Math.abs(secondDate.getTime() - firstDate.getTime());
    let differentDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
    if(differentDays < process.env.COURSE_VALID_DAYS){
      course_available = 0;
    }
      if(current_date < academic_session_data.course_data[0]){
        course_available = 0;
      }
}

let final_data_details = [];
  counter = 0;
  if(academic_session_expired == 2){
  detailsdata.forEach(Element=>{
      Element.remaning_set_no = [1];
      Element.is_purchased = 0;
      Element.purchased_no_test	= 0;
      Element.purchased_no_module	= 0;
      Element.purchased_no_mock	 = 0;
      Element.has_library	 = 0;
      Element.total_set_purchased = 0;
      final_data_details[counter] = (Element);
      counter++;
  })
  academic_year = "";
  course_validity = "";
  }else{
  detailsdata.forEach(Element=>{
      final_data_details[counter] = (Element);
      counter++;
  })
  }

////////////////////////////////////////////// ACADEMIC SESSION DETAILS END ////////////////////////////////

  response = {status: status, msg: message, data: final_data_details,academic_year:academic_year,course_validity:course_validity,course_available:course_available};
  //response = {status: status, msg: message, data: detailsdata};
  return response;
}


async function list_scolastic(data, subscribed_details){
  let response = {};
  let status = config.successStatus;
  let message = "Fetched subscription details.";
  const classdata = await db.query("select * from `classes` where `class_no` = "+data.class_id);
 let combo_subjects_details = [];
 let dependent_groups = [];
 let group_details = {};
 let combo_subject_names = [];
  const class_id = classdata[0].id;
  let combo_subject_ids = [];
  
  let subject_ary = [];
  await db.query("select * from subjects where is_deleted = 0 and status = 1 and group_exist != 3 and board_id = "+data.board_id+" and exam_category_id = 1")
  .then(result=>{
    result.forEach(Element=>{
      if(subject_ary[Element.id] == null){
        subject_ary[Element.id] = "";
      }
      subject_ary[Element.id] = Element.name;
    })
  })
  await db.query("select * from subjects where is_deleted = 0 and status = 1 and board_id = "+data.board_id+" and exam_category_id = 1")
    .then(result=>{
      result.forEach(Element=>{
        if(combo_subject_names[Element.id] == null){
            combo_subject_names[Element.id] = "";
            combo_subject_ids[Element.id] = [];
        }
        let com_subjects = [];
        if(Element.group_subjects != "" && Element.group_exist == 3)
        {
        com_subjects = Element.group_subjects.split(",");
        com_subjects.forEach(Element_inner=>{
          combo_subject_names[Element.id] += subject_ary[Element_inner]+" ,";
          combo_subject_ids[Element.id].push(parseInt(Element_inner));
          if(subscribed_details.elibrary.includes(parseInt(Element_inner)))
          {
            combo_subjects_details.push(parseInt(Element_inner)); 
          }
        })
      }else{
        combo_subject_ids[Element.id].push(parseInt(Element.id));
      }
    
        let com_subjects_interm = [];
        com_subjects.forEach(Element=>{
          com_subjects_interm.push(parseInt(Element));
        })
        if(group_details[Element.id] == null){
          group_details[Element.id] = [];
        }
        group_details[Element.id].push(com_subjects_interm);
      })
    })

  const list = await db.query(`select e_library_subscription_master.*,exam_type.type_name,boards.name as board_name, subjects.name as subject_name,subjects.subject_image,subjects.elibrary_image,subjects.subject_color_code from e_library_subscription_master
   left join exam_type on exam_type.id = e_library_subscription_master.exam_type_id left join boards on e_library_subscription_master.board_id = boards.id left join subjects on e_library_subscription_master.subject_id = subjects.id where e_library_subscription_master.board_id = `+data.board_id+` and e_library_subscription_master.class = `+class_id+` and e_library_subscription_master.is_deleted = 0 and e_library_subscription_master.status = 1 order by e_library_subscription_master.ranking_no asc`);
  let detailsdata = [];
  let counter  = 0;

  list.forEach(Element=>{
    if(subscribed_details['elibrary'].includes(Element.subject_id))
    {
      Element.is_purchased = 0;
      subscribed_details['elibrary_purchase'].forEach(Element_inner=>{
        if(Element_inner.subject_id == Element.subject_id)
        {
          Element.cart_amount = Element_inner.cart_amount;
          Element.purchased_no_set = Element_inner.no_set;
          Element.purchased_no_module = Element_inner.no_module;
          Element.purchased_no_mock = Element_inner.no_mock;
          Element.has_library = Element_inner.has_library;
          Element.only_elibrary = Element_inner.only_elibrary;
        }
      }) 
    }
    else
    {
      Element.is_purchased = 0;
      Element.cart_amount = 0;
      Element.purchased_no_set = 0;
      Element.purchased_no_module = 0;
      Element.purchased_no_mock = 0;
      Element.has_library = 0;
      Element.only_elibrary = 0;
    }

    //console.log(subscribed_details);
    subscribed_details['elibrary_purchase'].forEach(element_inner=>{
    
      if(element_inner['subject_id'] == Element.subject_id)
          {
            
            if((element_inner['only_elibrary'] == 1) || (element_inner['has_library'] == 1))
            {
    
              Element.has_library = 1;
              Element.only_elibrary = 1;
              //Element.is_purchased = 1;
            }
          }

          combo_subject_ids[element_inner.subject_id].forEach(element_inner2=>{
            if(combo_subject_ids[Element.subject_id] != undefined)
            {
              if(combo_subject_ids[Element.subject_id].includes(element_inner2))
              {
                Element.is_purchased = 1;
              }
            }else{
              if(Element.subject_id == element_inner2)
              {
                Element.is_purchased = 1;
              }     
            }
          })
    })
    Element.combo_elibrary_subject_id = [Element.subject_id];
    if(Array.isArray(group_details[Element.subject_id]))
    {
      if(group_details[Element.subject_id][0]!=""){
          Element.combo_elibrary_subject_id = group_details[Element.subject_id][0];
      }
        Element.combo_elibrary_subject_id.forEach(check_subject=>
      {
          if(combo_subjects_details.includes(parseInt(check_subject)))
          {
              Element.is_purchased = 1;
          }
    })
      
  }else{
    if(combo_subjects_details.includes(Element.subject_id))
    {
        Element.is_purchased = 1;
    }
  }
      detailsdata[counter] = Element;
      counter++;
  });

  //////////////////////////////// ACADEMIC SESSION DETAILS ////////////////////////////////
  let academic_year = "";
  let course_validity = "";
  let current_date =  moment().format("YYYY-MM-DD");
  let course_available = 1;
  let academic_session_expired = 0;
  let academic_session_data = await academic_session.get_academicsessionsby_board(data)
  let academic_session_expired_ary = await academic_session.get_academicessions_by_student_id(data)
  console.log(academic_session_expired_ary)
  if(academic_session_data.status == 200){
    academic_year = academic_session_data.list[0];
    academic_session_expired = academic_session_expired_ary.course_data[2];
    course_validity = academic_session_data.course_data[0]+"-"+academic_session_data.course_data[1];
    let firstDate = new Date(academic_session_data.course_data[1]),
    secondDate = new Date(current_date),
    timeDifference = Math.abs(secondDate.getTime() - firstDate.getTime());
    let differentDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
    if(differentDays < process.env.COURSE_VALID_DAYS){
      course_available = 0;
    }
      if(current_date < academic_session_data.course_data[0]){
        course_available = 0;
      }
  }else if(academic_session_data.status == 400){
    course_available = 0;
  }

  let final_data_details = [];
  counter = 0;
  if(academic_session_expired == 2){
  detailsdata.forEach(Element=>{
      Element.remaning_set_no = [1];
      Element.is_purchased = 0;
      Element.purchased_no_test	= 0;
      Element.purchased_no_module	= 0;
      Element.purchased_no_mock	 = 0;
      Element.has_library	 = 0;
      Element.total_set_purchased = 0;
      final_data_details[counter] = (Element);
      counter++;
  })
  }else{
  detailsdata.forEach(Element=>{
      final_data_details[counter] = (Element);
      counter++;
  })
  }
  ////////////////////////////////////////////// ACADEMIC SESSION DETAILS END ////////////////////////////////

  response = {status: status, msg: message, data: detailsdata,academic_year:academic_year,course_validity:course_validity,course_available:course_available};
  

  //response = {status: status, msg: message, data: detailsdata};
  return response;
}

module.exports = {
  list_competetive,
  list_scolastic
}
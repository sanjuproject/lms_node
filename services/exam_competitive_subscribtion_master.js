const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const academic_session = require('../services/academic_sessions.js');
const moment = require('moment');

async function getcompetitivesubscribtion_details(data,subscribed_details,subscribed_details_purchased,elibrary) {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched exam competitive subscribtion details";
  let examCategories = "";
  let elibrarylist = "";
  let disabled_library = 0;
  let max_set_no = 0;
  if(data.class_id != 0){
       examCategories = await db.query(`select exam_competitive_subscribtion_master.* from exam_competitive_subscribtion_master 
       where class = `+data.class_id+` and exam_competitive_subscribtion_master.exam_type_id = `+data.exam_type+` and exam_competitive_subscribtion_master.status = 1 and exam_competitive_subscribtion_master.is_deleted = 0 order by exam_competitive_subscribtion_master.ranking_no`);
  }
  else{
      examCategories = await db.query(`select exam_competitive_subscribtion_master.* from exam_competitive_subscribtion_master 
      where exam_type_id = `+data.exam_type+` and status = 1 and is_deleted = 0 order by exam_competitive_subscribtion_master.ranking_no`);
  }
////////////////////////////////////////////////////// START ///////////////////////////////////////////////
let only_library_price = 0;
  if (data.class_id != "" || data.class_id != 0) {
    elibrarylist = await db.query(`select e_library_subscription_master.*,exam_type.type_name from e_library_subscription_master\
   left join exam_type on exam_type.id = e_library_subscription_master.exam_type_id where e_library_subscription_master.exam_type_id = `+data.exam_type+` and e_library_subscription_master.class = `+data.class_id+` and e_library_subscription_master.is_deleted = 0 and e_library_subscription_master.status = 1 order by e_library_subscription_master.id desc`);
  }
  else{
    elibrarylist = await db.query(`select e_library_subscription_master.*,exam_type.type_name from e_library_subscription_master\
   left join exam_type on exam_type.id = e_library_subscription_master.exam_type_id where e_library_subscription_master.exam_type_id = `+data.exam_type+` and e_library_subscription_master.is_deleted = 0 and e_library_subscription_master.status = 1 order by e_library_subscription_master.id desc`);
  }
if(elibrarylist.length > 0)
{
  elibrarylist.forEach(Element=>{
    only_library_price = Element.library_price;
  })
}
////////////////////////////////////////////////////////////////////// END //////////////////////////////

  let total_set_purchased = 0;
  if(subscribed_details_purchased.length > 0)
  {
      subscribed_details_purchased.forEach(Element=>{
        total_set_purchased += Number(Element.no_set);
      })
  }
  let detailsdata = [];
  let counter  = 0;
  if(examCategories.length > 0)
  {
      examCategories.forEach(Element=>{
        if(Element.set_count > max_set_no)
        {
          max_set_no = Element.set_count;
        }
      });

      //console.log("current_setno", current_setno)
      examCategories.forEach(Element=>{
        Element.exam_category_id = 2;
        delete Element.is_deleted;
        delete Element.created_at;
        delete Element.updated_at;
        Element.is_purchased = 0;
        Element.has_library = 0;
        Element.only_elibrary = 0;
        let remaning_set_no = max_set_no - total_set_purchased;
        if(remaning_set_no/Element.set_count < 1)
        {
          Element.is_purchased = 1;
        }
          subscribed_details_purchased.forEach(Element_inner=>{
            if(Element_inner.subscription_id == Element.id)
            {
              Element.cart_amount = Element_inner.cart_amount;
              //Element.purchased_no_set = Element_inner.no_set;
              
              Element.has_library = Element_inner.has_library;
              Element.only_elibrary = Element_inner.only_elibrary;
              Element.disabled_library = disabled_library;
              if(Element_inner.has_library == 1 || Element_inner.only_library == 1){
                  disabled_library = 1;
              }
            }
            
          })
        
        if(elibrary.length > 0)
            {
                Element.disabled_library = 1;
                
            }
            if(Element.disabled_library == 1)
            {
              Element.has_library = 0;
            }

            Element.only_elibrary_price = only_library_price;  
          detailsdata[counter] = Element;
          counter++;
      })
  }
  if(detailsdata[0] == null)
  {
    detailsdata[0] = [];
  }
  if(detailsdata[0]['max_set_no'] == null)
  {
    detailsdata[0]['max_set_no'] = 0;
  }
  detailsdata[0]['max_set_no'] = max_set_no;
  detailsdata[0]['total_set_purchased'] = total_set_purchased;
  
//////////////////////////////// ACADEMIC SESSION DETAILS ////////////////////////////////
let academic_year = "";
let course_validity = "";
let current_date =  moment().format("YYYY-MM-DD");
let course_available = 1;
let academic_session_expired = 0;
let academic_session_data = await academic_session.get_academicsessionsby_examtype(data)
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
////////////////////////////////////////////// ACADEMIC SESSION DETAILS END ////////////////////////////////

if(detailsdata[0].max_set_no == 0)
{
  detailsdata = [];
}

final_data_details = [];
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

  response = {status: status, msg: message, data: final_data_details,academic_year:academic_year,course_validity:course_validity,course_available:course_available};

  //response = {status: status, msg: message, data: examCategories};
  return response;
}

module.exports = {
 
    getcompetitivesubscribtion_details
  
}
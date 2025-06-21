const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const academic_session = require('../services/academic_sessions.js');
const moment = require('moment');

async function getscholasticsubscribtion_details(data,subscribed_details,subscribed_details_purchased,subscribed_details_purchased_elibrary) {
  let response = {};
  // try{
    let academic_session_expired_ary = await academic_session.get_academicessions_by_student_id(data)
    let combo_subjects_details = [];
    let combo_subject_names = [];
    let combo_subject_ids = [];
    let subject_ary = [];
    let single_set_price = 0;
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
          combo_subject_names[Element.id] += subject_ary[Element_inner]+", ";
          combo_subject_ids[Element.id].push(parseInt(Element_inner));
          if(subscribed_details.includes(Element.id)){
            combo_subjects_details.push(parseInt(Element_inner));
          }
        })
      }else{
        combo_subject_ids[Element.id].push(parseInt(Element.id));
      }
      })
    })

  let status = config.successStatus;
  let message = "Fetched exam scholastic subscribtion details";

  const examCategories = await db.query(`select classes.class_no,exam_scholastic_subscribtion_master.*,subjects.name as subject_name,subjects.subject_image from exam_scholastic_subscribtion_master left join subjects on 
  subjects.id = exam_scholastic_subscribtion_master.subject_id left join classes on classes.id = exam_scholastic_subscribtion_master.class where exam_scholastic_subscribtion_master.board_id = `+data.board_id+` and \
  classes.class_no = '`+data.class_id+`' and exam_scholastic_subscribtion_master.status = 1 and exam_scholastic_subscribtion_master.is_deleted = 0 order by exam_scholastic_subscribtion_master.ranking_no asc`);
  let detailsdata = [];
  let counter  = 0;
  let included_elibrary_subjects = [];
  examCategories.forEach(Element=>{
    Element.test_count = 0;
    Element.remaning_set_no = [1];
    Element.disabled_library = 0;
    Element.case_studies_exist = 0; 

    let package_details = JSON.parse(Element.package_details);
          package_details.forEach(Element_inner2=>{
            if(Element.test_count < Element_inner2.set)
              {
                Element.test_count = parseInt(Element_inner2.set);
              }
            })

             //////// Calculate Min Set No for remaning sets after purchased for subscription section LMS portal //////
  

    subscribed_details_purchased_elibrary.forEach(Element_inner3=>{
      if(Element_inner3.only_elibrary == 1){
        if(Element_inner3.subject_id == Element.subject_id){
            Element.disabled_library = 1;
            let package_details = JSON.parse(Element.package_details);
            package_details.forEach(Element_inner2=>{
              if(Element_inner2.set == 1 && Element_inner2.module == 0 && Element_inner2.mock == 0 && Element_inner2.library == 0 && Element_inner2.case_studies == 0){
                single_set_price = Element_inner2.price;
                  Element.cart_amount = single_set_price;
              }
              if(Element_inner2.case_studies != 0)
              {
                Element.case_studies_exist = 1;
              }
              else{
                Element.purchased_case_study = 1;
              }
          })
        }
      
      }
      combo_subject_ids[Element_inner3.subject_id].forEach(Element_inner4=>{
        if(combo_subject_ids[Element.subject_id] != undefined)
        {
          if(combo_subject_ids[Element.subject_id].includes(Element_inner4))
          {
            Element.disabled_library = 1;
          }
        }else{
          if(Element.subject_id == Element_inner4)
          {
            Element.disabled_library = 1;
          }     
        }
      })

    })


    if(subscribed_details.includes(Element.subject_id)){
      Element.is_purchased = 0;
      Element.purchased_no_test = [];
      Element.purchased_checkbox_select = [];
      Element.purchased_no_module = 0;
      Element.purchased_no_mock = 0;
      Element.purchased_case_study = 0;
      if(data.board_id == 1)
            {
              //Element.purchased_case_study = 1;
            }
      Element.has_library = 0;

      subscribed_details_purchased.forEach(Element_inner=>{

        if(Element_inner.subscription_id == Element.id)
        {
          
          //Element.cart_amount = single_set_price;
          //Element.cart_amount = 110;
          Element.purchased_no_test = Element.purchased_no_test.concat(JSON.parse(Element_inner.no_set));

          //////// Calculate Min Set No for remaning sets after purchased for subscription section LMS portal //////
          let min_value_1 = [];
          for(let i = 1; i <= Element.test_count; i++){
            if(!Element.purchased_no_test.includes(i))
            {
              min_value_1.push(i);
              break;
            }
          }
          Element.remaning_set_no = min_value_1.concat(Element.purchased_no_test);
          //Element.purchased_checkbox_select = Element.purchased_no_test;
        //////// Calculate Min Set No for remaning sets after purchased for subscription section LMS portal END //////
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
          let package_details = JSON.parse(Element.package_details);
          package_details.forEach(Element_inner2=>{
            
            if(Element_inner2.set == 1 && Element_inner2.module == 0 && Element_inner2.mock == 0 && Element_inner2.library == 0 && Element_inner2.case_studies == 0){
              
                single_set_price = Element_inner2.price;
              
                Element.cart_amount = single_set_price;
            }
            if(Element_inner2.case_studies != 0)
              {
                Element.case_studies_exist = 1;
              }
        })

          if(Element.purchased_no_module == 0){
            Element.purchased_no_module = Element_inner.no_module;
          }
          if(Element.purchased_no_mock == 0)
          {
            Element.purchased_no_mock = Element_inner.no_mock;
          }
          if(Element.purchased_case_study == 0)
          {
            Element.purchased_case_study = Element_inner.no_casestudy;
            if(data.board_id == 1)
            {
              //Element.purchased_case_study = 1;
            }
          }
          if(Element.has_library == 0)
          {
            Element.has_library = Element_inner.has_library;
          }

          if(Element.purchased_no_test.length == Element.test_count && Element.purchased_no_module > 0 && Element.purchased_no_mock > 0 && Element.has_library > 0 && Element.purchased_case_study > 0){
            Element.is_purchased = 1;
          }
          if(Element_inner.only_library == 1){
            Element.is_purchased = 0;
            Element.purchased_no_module = 0;
            Element.purchased_no_mock = 0;
            Element.purchased_case_study = 0;
            if(data.board_id == 1)
            {
              //Element.purchased_case_study = 1;
            }
            Element.has_library = 0;
            Element.cart_amount = 0;
          }
        }
      })

    }else{
      Element.is_purchased = 0;
      Element.cart_amount = 0;
      if(Element.package_details!='')
      {
          let package_details = JSON.parse(Element.package_details);
          package_details.forEach(Element_inner2=>{
              if(Element_inner2.set == 1 && Element_inner2.module == 0 && Element_inner2.mock == 0 && Element_inner2.library == 0 && Element_inner2.case_studies == 0){
                  Element.cart_amount = Element_inner2.price;
              }
              if(Element_inner2.case_studies != 0)
              {
                Element.case_studies_exist = 1;
              }
          })
      }
      Element.purchased_no_test = 0;
      Element.purchased_checkbox_select = [];
      Element.purchased_no_module = 0;
      Element.purchased_no_mock = 0;
      Element.has_library = 0;
      Element.purchased_case_study = 0;
      if(data.board_id == 1)
            {
              //Element.purchased_case_study = 1;
            }
      
    }

    Element.combo_subject_names = "";
    Element.combo_subject_ids = [Element.subject_id];
    if(combo_subject_names[Element.subject_id])
    {
      Element.combo_subject_names = combo_subject_names[Element.subject_id].slice(0, -2);
      Element.combo_subject_ids = combo_subject_ids[Element.subject_id];
    }
    

    /*subscribed_details_purchased_elibrary.forEach(Element_inner3=>{
      if(Element_inner3.only_elibrary == 1){
        if(Element_inner3.subject_id == Element.subject_id){
            Element.disabled_library = 1;
            let package_details = JSON.parse(Element.package_details);
            package_details.forEach(Element_inner2=>{
              if(Element_inner2.set == 1 && Element_inner2.module == 0 && Element_inner2.mock == 0 && Element_inner2.library == 0 && Element_inner2.case_studies == 0){
                  Element.cart_amount = Element_inner2.price;
              }
          })
        }
      
      }
      combo_subject_ids[Element_inner3.subject_id].forEach(Element_inner4=>{
        if(combo_subject_ids[Element.subject_id] != undefined)
        {
          if(combo_subject_ids[Element.subject_id].includes(Element_inner4))
          {
            Element.disabled_library = 1;
          }
        }else{
          if(Element.subject_id == Element_inner4)
          {
            Element.disabled_library = 1;
          }     
        }
      })

    })*/

    if(included_elibrary_subjects.includes(Element.subject_id))
    {
      Element.disabled_library = 1;
    }
    
    if(Element.has_library == 1){
      Element.disabled_library = 1;
    }

    if(Element.combo_subject_ids.includes(Element.subject_id))
    {
      //Element.disabled_library = 1;
    }
    if(Element.case_studies_exist == 0)
    {
      Element.purchased_case_study = 1;
    }
    if(Element.purchased_no_test.length == Element.test_count && Element.purchased_no_module > 0 && Element.purchased_no_mock > 0 && (Element.has_library > 0 || Element.disabled_library == 1) && Element.purchased_case_study > 0){
      Element.is_purchased = 1;
    }
   
    if(Element.purchased_no_test.length == Element.test_count && academic_session_expired_ary.course_data[2] != 2){
      Element.cart_amount = 0;
    }
    
    if(process.env.CASE_STUDY_EXIST == 0)
      {
        Element.case_studies_exist = 0;
      }
    detailsdata[counter] = Element;
    counter++;
    
  })
  //////////////////////////////// ACADEMIC SESSION DETAILS ////////////////////////////////
  let academic_year = "";
  let course_validity = "";
  let current_date =  moment().format("YYYY-MM-DD");
  let course_available = 1;
  let academic_session_expired = 0;
  let academic_session_data = await academic_session.get_academicsessionsby_board(data)
  

  if(academic_session_data.status == 200){
    academic_year = academic_session_data.list[0];
    academic_session_expired = academic_session_expired_ary.course_data[2];
    course_validity = academic_session_data.course_data[0]+"-"+academic_session_data.course_data[1];
    let session_available = await get_last_date_month(academic_session_data.course_data[4])
    let firstDate = new Date(academic_session_data.course_data[1]),
    secondDate = new Date(current_date),
    timeDifference = Math.abs(secondDate.getTime() - firstDate.getTime());
    let differentDays = Math.ceil(timeDifference / (1000 * 3600 * 24));

    if(differentDays < process.env.COURSE_VALID_DAYS){
      course_available = 0;
    }
    if(academic_session_data.course_data[0]>current_date){
      course_available = 2;
    }
        
    if(academic_session_data.length > 0){
      if(academic_session_data.course_data[0] > current_date)
      {
        course_available = 0;
      }
    }
  }
  ////////////////////////////////////////////// ACADEMIC SESSION DETAILS END ////////////////////////////////
  final_data_details = [];
  counter = 0;
  if(academic_session_expired == 2){
  detailsdata.forEach(Element=>{
      Element.remaning_set_no = [2,1];
      Element.is_purchased = 0;
      Element.purchased_no_test	= 0;
      Element.purchased_no_module	= 0;
      Element.purchased_no_mock	 = 0;
      Element.has_library	 = 0;
      Element.disabled_library	= 0; 
      final_data_details[counter] = (Element);
      counter++;
  })
  }else{
  detailsdata.forEach(Element=>{
      final_data_details[counter] = (Element);
      counter++;
  })
  }
  response = {status: status, msg: message, data: detailsdata,academic_year:academic_year,course_validity:course_validity,course_available:course_available};
  if(academic_session_data.length > 0){
      if(current_date < academic_session_data.course_data[0]){
          course_available = 0;
          response = {status: status, msg: message, data: [],academic_year:academic_year,course_validity:course_validity,course_available:course_available};
      }
    }
  // }
  // catch(err){
  //   response = {status: 200, msg: "err",course_available:0,data:[]};
  // }
  return response;
}

async function get_last_date_month(data){
  try{
  // Input month and year
const input = data;

// Convert the input to a Date object for the first day of the next month
const date = new Date(`${input}-01`);

// Set the date to 0 to get the last day of the previous month
date.setMonth(date.getMonth() + 1);
date.setDate(0);

// Extract the last date of the month
const lastDay = date.getDate();

// Format the result as "YYYY-MM-DD"
const lastDateOfMonth = `${input}-${lastDay.toString().padStart(2, '0')}`;

return (lastDateOfMonth); // Outputs: "2024-08-31"
  }
  catch(err){
    console.log(err);
  }
}

async function get_combination_price(data){
  try{
    let status = config.successStatus;
    const set_no = data.set_no.length;
    const mock = data.mock;
    const module = data.module;
    const elibrary = data.elibrary;
    const case_studies = data.case_studies;
    let package_price = 0;
    let message = "Fetched subject combination price";
    await db.query("select * from `exam_scholastic_subscribtion_master` where id = "+data.recid)
    .then(result=>{
      let package_details = JSON.parse(result[0].package_details)
      package_details.forEach(Element=>{
        if(Element.set == set_no){
            if(Element.module == module){
                  if(Element.mock == mock){
                      if(Element.library == elibrary){
                          if(Element.case_studies == case_studies){
                              package_price = Element.price;
                          } 
                      } 
                  }
            }

        }
      })
    })

    response = {status: status, msg: message, data: package_price};
  }
  catch(err){
    response = {status: 410, msg: err};
  }
  return response;
}

module.exports = {
 
    getscholasticsubscribtion_details,
    get_combination_price,
    get_last_date_month
  
}
const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function storeexamintegratedsubscription(data) {
  let response = {};
  let status = config.errorStatus;
  let message = "Something went wrong, please try again later.";

    const result = await db.query(`INSERT INTO integrated_subscription_master(board_id, class, sch_no_set, com_exam_details,  elibrary_exist, sticker_text, price,course_code) VALUES ('`+data.board_id+`','`+data.class+`','`+data.sch_no_set+`','`+JSON.stringify(data.com_exam_details)+`','`+data.elibrary_exist+`','`+data.sticker_text+`','`+data.price+`','`+data.course_code+`')`);  
    
    if (result.affectedRows) {
      status = config.successStatus;
      message = 'Integrated subscription details added successfully.';
    }
    response = {status: status, msg: message};
    return response;
}

async function getintegratedsubscription(data,purchased_packages) {
  let response = {};
  try{
  let status = config.successStatus;
  let message = "Fetched exam integrated subscribtion details";
  let examtype_list = [];
  await db.query(`select * from exam_type where is_deleted = 0 and status = 1`)
  .then(result=>{
    result.forEach(element=>{
      if(examtype_list[element.id] == null)
      {
        examtype_list[element.id] = [];
      }
      examtype_list[element.id].push(element.type_name);
    })
  })
  const examCategories = await db.query(`select boards.name as board_name,classes.class_no,integrated_subscription_master.* from integrated_subscription_master left join classes on classes.id = integrated_subscription_master.class left join boards on boards.id = integrated_subscription_master.board_id where integrated_subscription_master.board_id = `+data.board_id+` and \
  classes.class_no = '`+data.class_id+`' and integrated_subscription_master.status = 1 and integrated_subscription_master.is_deleted = 0 order by integrated_subscription_master.ranking_no asc`);
  let detailsdata = [];
  examCategories.forEach(Element=>{
    Element.is_purchased = 0;
    if(purchased_packages.data){
      purchased_packages.data.forEach(element_inner=>{
        if(element_inner.subscription_id === Element.id)
        {
            Element.is_purchased = 1;
        }
    })
  }
  let com_exam_details_ary = JSON.parse(Element.com_exam_details);
  let com_sub_details = "";
  let elibray_text = "";
  let com_sub_subheading = "";
  if(Element.elibrary_exist == 1){
    elibray_text = " e-library";
  }
  com_exam_details_ary.forEach(element_inner=>{
    com_sub_subheading += examtype_list[element_inner.exam_type]+" + ";
    com_sub_details += element_inner.set+"-Sets "+ examtype_list[element_inner.exam_type]+" ";
  }) 
  
  Element.subheading = Element.board_name+" "+Element.class_no+" + "+com_sub_subheading.slice(0,-2);
  Element.details = Element.sch_no_set+"Ch Test+Module+Mock "+com_sub_details+elibray_text;
  detailsdata.push(Element);
  })
  
  response = {status: status, msg: message, data: detailsdata};
  }
  catch(err){
    response = {status: 410, msg: err};
  }
  return response;
}

async function editexamscolasticsubscription(data) {
  const record_details = await db.query(`SELECT * FROM exam_scholastic_subscribtion_master WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise(async(resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No record found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
      message = "Subscription details updated";
   
      await db.query("update `exam_scholastic_subscribtion_master` set `subject_id` = '"+data.subject_id+"',`board_id` = '"+data.board_id+"',`class` = '"+data.class+"',\
      `package_details` = '"+JSON.stringify(data.package_details)+"',`sticker_text` = '"+data.sticker_text+"',`course_code` = '"+data.course_code+"' where `id` = '"+data.recid+"'");
      
     
      response = {status: 200, msg: message,data:data}
      resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function deleteexamscolasticsubscription(data) {
  const record_details = await db.query(`SELECT * FROM exam_scholastic_subscribtion_master WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No record found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
      message = "Subscription details deleted";
      db.query("update `exam_scholastic_subscribtion_master` set `is_deleted` = '1' where `id` = '"+data.recid+"'")
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
async function updatestatusexamscolasticsubscription(data) {
  const record_details = await db.query(`SELECT * FROM exam_scholastic_subscribtion_master WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No exam category found.';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
      message = "Subscription details status updated";
      db.query("update `exam_scholastic_subscribtion_master` set `status` ='"+data.status+"' where `id` = '"+data.recid+"'")
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


async function updateexamscolasticsubscription_ranking(data) {
  let response = {};
  const offset = helper.getOffset(data.page, config.listPerPage);
  let page = data.page;
  let status = config.successStatus;
  let message = "Fetched subscription details.";
  let subject_id = data.subject_id;
  let class_no = data.class_no;
  let board_id = data.board_id;
  let quesrydata = "";
  let ranking_no = parseInt(data.ranking_no);
  let recid = data.id;
  let current_class = 0;
  let current_board_id = 0;
  let highest_ranking = 0;
  let current_rank = 0;
  await db.query("select * from `exam_scholastic_subscribtion_master` where is_deleted = 0 and `id` ="+recid)
  .then(async result=>{
    current_class = result[0].class;
    current_board_id = result[0].board_id;
    current_rank = result[0].ranking_no;

    await db.query("select max(ranking_no) as ranking_no from `exam_scholastic_subscribtion_master` where is_deleted = 0 and `board_id` ="+current_board_id+" and class = "+current_class)
  .then(result_inner1=>{
    highest_ranking = result_inner1[0].ranking_no;
  })
  
  

    await db.query("select * from `exam_scholastic_subscribtion_master` where is_deleted = 0 and `ranking_no` = "+ranking_no+" and `board_id` ="+current_board_id+" and class = "+current_class)
    .then(async result_inner2=>{
      if(result_inner2.length == 0)
      {
          db.query("update exam_scholastic_subscribtion_master set `ranking_no` = "+ranking_no+" where is_deleted = 0 and `id` ="+recid);
      }else{
            let new_rank = ranking_no;
            if(current_rank > new_rank){
            for(let i = ranking_no;i< current_rank;i++){
            //  console.log("select * from exam_scholastic_subscribtion_master where `id` != "+recid+" and is_deleted = 0 and `ranking_no` = "+i+" and `board_id` ="+current_board_id+" and class = "+current_class+" order by ranking_no desc")
              await db.query("select * from exam_scholastic_subscribtion_master where `id` != "+recid+" and is_deleted = 0 and `ranking_no` = "+i+" and `board_id` ="+current_board_id+" and class = "+current_class+" order by ranking_no desc")
              .then(async result_inner4=>{
                
                if(result_inner4.length > 0){
                  new_rank += 1;
                 
               // console.log("update exam_scholastic_subscribtion_master set `ranking_no` = "+new_rank+" where `id` != "+recid+" and is_deleted = 0 and `ranking_no` = "+i+" and `board_id` ="+current_board_id+" and class = "+current_class+" and id= "+result_inner4[0].id)
                 await db.query("update exam_scholastic_subscribtion_master set `ranking_no` = "+new_rank+" where `id` != "+recid+" and is_deleted = 0 and `ranking_no` = "+i+" and `board_id` ="+current_board_id+" and class = "+current_class+" and id= "+result_inner4[0].id)
                }
              })
            }
          }else{
           
            console.log(current_rank, ranking_no)
            for(let i = ranking_no; current_rank<i ;i--){
             // console.log("fdfd")
             // console.log("select * from exam_scholastic_subscribtion_master where `id` != "+recid+" and is_deleted = 0 and `ranking_no` = "+i+" and `board_id` ="+current_board_id+" and class = "+current_class+" order by ranking_no desc")
              await db.query("select * from exam_scholastic_subscribtion_master where `id` != "+recid+" and is_deleted = 0 and `ranking_no` = "+i+" and `board_id` ="+current_board_id+" and class = "+current_class+" order by ranking_no desc")
              .then(async result_inner4=>{
                
                if(result_inner4.length > 0){
                  new_rank -= 1;
                 
                //console.log("update exam_scholastic_subscribtion_master set `ranking_no` = "+new_rank+" where `id` != "+recid+" and is_deleted = 0 and `ranking_no` = "+i+" and `board_id` ="+current_board_id+" and class = "+current_class+" and id= "+result_inner4[0].id)
                await db.query("update exam_scholastic_subscribtion_master set `ranking_no` = "+new_rank+" where `id` != "+recid+" and is_deleted = 0 and `ranking_no` = "+i+" and `board_id` ="+current_board_id+" and class = "+current_class+" and id= "+result_inner4[0].id)
                }
              })
            }
          }
           db.query("update exam_scholastic_subscribtion_master set `ranking_no` = "+ranking_no+" where is_deleted = 0 and `id` ="+recid);
          
      }
    })
  })

  if(subject_id != null && subject_id !=='')
  {
    quesrydata = ` and exam_scholastic_subscribtion_master.subject_id = ${subject_id}`;
  }
  if(class_no != null && class_no !== '')
  {
    quesrydata += ` and exam_scholastic_subscribtion_master.class = ${class_no}`;
  }
  if(board_id != null && board_id !== '')
  {
    quesrydata += ` and exam_scholastic_subscribtion_master.board_id = ${board_id}`;
  }


  //exam_scholastic_subscribtion_master.subject_id =`+data.subject_id+` and exam_scholastic_subscribtion_master.board_id =`+data.board_id+` and exam_scholastic_subscribtion_master.class =`+data.class+` and 
  const examCategories = await db.query(`select classes.short_code as class_no,boards.name as board_name, subjects.name as subject_name,exam_scholastic_subscribtion_master.* from exam_scholastic_subscribtion_master 
  left join boards on exam_scholastic_subscribtion_master.board_id = boards.id left join subjects on exam_scholastic_subscribtion_master.subject_id = subjects.id left join classes on exam_scholastic_subscribtion_master.class = classes.id \
  where exam_scholastic_subscribtion_master.is_deleted = 0 `+quesrydata+` order by exam_scholastic_subscribtion_master.id desc limit ${offset},${config.listPerPage}`);
  
  let total_records_ary = await db.query(`select classes.short_code as class_no,boards.name as board_name, subjects.name as subject_name,exam_scholastic_subscribtion_master.* from exam_scholastic_subscribtion_master 
  left join boards on exam_scholastic_subscribtion_master.board_id = boards.id left join subjects on exam_scholastic_subscribtion_master.subject_id = subjects.id left join classes on exam_scholastic_subscribtion_master.class = classes.id \
  where exam_scholastic_subscribtion_master.is_deleted = 0 `+quesrydata+` order by exam_scholastic_subscribtion_master.id desc`);
  
  let total_record_count = total_records_ary.length;
  let total_page = Math.ceil(total_record_count/config.listPerPage);
  let subscription_data = "";
  examCategories.forEach(element=>{
    subscription_data = element;
    if(element['package_details']!='' || element['package_details']!=null){
    subscription_data['package_details'] = JSON.parse(element['package_details']);
    }else{
      subscription_data['package_details'] = [];
    }
    if(element['sticker_text']!='' || element['sticker_text']!=null){
      subscription_data['sticker_text'] = element['sticker_text'];
      }else{
        subscription_data['sticker_text'] = "";
      }
    //delete subscription_data['created_at']
    delete subscription_data['updated_at']
    delete subscription_data['is_deleted']
  })
  response = {status: status, msg: message, data: examCategories,total_page:total_page,total_record_count:total_record_count};
  return response;
}

module.exports = {
  storeexamintegratedsubscription,
  getintegratedsubscription,
  editexamscolasticsubscription,
  deleteexamscolasticsubscription,
  updatestatusexamscolasticsubscription,
  updateexamscolasticsubscription_ranking
}
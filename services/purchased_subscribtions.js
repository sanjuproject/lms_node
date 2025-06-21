const db = require('./db');
var async = require('async');
const addtocart_subscription = require('./addtocart_subscription.js');
async function student_purchased_subscription(data){
    let is_subscribe = 0; // 0 = Not Subscribe ,1 = Scholactic,2 = Competitive, 3 = Both
    let is_subscribe_e_library = 0; // 0 = Not Subscribe ,1 = Scholactic,2 = Competitive, 3 = Both
    let result = await new Promise(async(resolve, reject) => {
       
        const exam_unique_id = Date.now()+"_"+data[0].student_id;
        const subscribtion_payment_trans_id = data[0].subscribtion_payment_trans_id;
        const student_id = data[0].student_id;
     
       
        const amount_paid = data[0].cart_amount;

        //db.query("select * from `purchased_subscribtions` where `is_active` = 1 and `student_id` = "+data.student_id)
            //.then(result_data=>{
                let result_data = data;
                
             // result_data.forEach(Element=>{
               // console.log(Element)
                var subscription_details = data;
                let e_subscribe_sch = 0;
                let e_subscribe_com = 0;
               
                subscription_details.forEach(Element_inner=>{
                
                    if(Element_inner.exam_category_id == 1 && Element_inner.only_elibrary == 0){
                      
                      if(is_subscribe == 2 || is_subscribe == 3){
                          is_subscribe = 3;
                          work_status = 2;
                      }
                      else{
                          is_subscribe = 1;
                      }
                    }
                    if(Element_inner.exam_category_id == 2 && Element_inner.only_elibrary == 0){
                      
                      if(is_subscribe == 1 || is_subscribe == 3){
                          is_subscribe = 3;
                          work_status = 2;
                      }
                      else{
                          is_subscribe = 2;
                      }
                      }
                      //////////////////////// E Library Section ///////////////////
                      if(Element_inner.exam_category_id == 1 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1))
                      {
                        is_subscribe_e_library = 1;
                        e_subscribe_sch = 1;
                      }
                      if(Element_inner.exam_category_id == 2 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1))
                      {
                        is_subscribe_e_library = 2;
                        e_subscribe_com = 1;
                      }
                      if(e_subscribe_sch == 1 && e_subscribe_com == 1)
                      {
                        is_subscribe_e_library = 3;
                      }
                })                

             // })
              
            //})
        await db.query("INSERT INTO `purchased_subscribtions`(`student_id`,`subscription_details`,`subscribtion_payment_trans_id`,`exam_unique_id`)\
         VALUES ('"+student_id+"','"+JSON.stringify(subscription_details)+"','"+subscribtion_payment_trans_id+"','"+exam_unique_id+"')")
        .then((result,err)=>{
                let e_subscribe_sch = 0;
                let e_subscribe_com = 0;
                subscription_details.forEach(Element_inner=>{
                    if(Element_inner.exam_category_id == 1 && Element_inner.only_elibrary == 0){
                      if(is_subscribe == 2 || is_subscribe == 3){
                          is_subscribe = 3;
                          work_status = 2;
                      }
                      else{
                          is_subscribe = 1;
                      }
                    }
                    if(Element_inner.exam_category_id == 2 && Element_inner.only_elibrary == 0){
                      if(is_subscribe == 1 || is_subscribe == 3){
                          is_subscribe = 3;
                          work_status = 2;
                      }
                      else{
                          is_subscribe = 2;
                      }
                      }
                      //////////////////////// E Library Section ///////////////////
                      if(Element_inner.exam_category_id == 1 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1))
                      {
                        is_subscribe_e_library = 1;
                        e_subscribe_sch = 1;
                      }
                      if(Element_inner.exam_category_id == 2 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1))
                      {
                        is_subscribe_e_library = 2;
                        e_subscribe_com = 1;
                      }
                      if(e_subscribe_sch == 1 && e_subscribe_com == 1)
                      {
                        is_subscribe_e_library = 3;
                      }
                      
                })
            if(result.affectedRows === 1){
                
                /*db.query("INSERT INTO `payment_trasns_details`(`student_id`, `payment_trans_id`, `paid_amount`,`exam_category_id`,`class`,`exam_type_id`,`subscription_id`,`no_set`,`no_module`,`no_mock`,`no_casestudy`,`category`,`category_short_code`,`type_name`,`board_name`,`subject_name`,`subject_id`,`has_library`,`only_elibrary`)\
                 VALUES ('"+student_id+"','"+subscribtion_payment_trans_id+"','"+amount_paid+"','"+subscription_details.exam_category_id+"','"+subscription_details.class+"','"+subscription_details.exam_type_id+"','"+subscription_details.subscription_id+"','"+subscription_details.no_set+"','"+subscription_details.no_module+"','"+subscription_details.no_mock+"','"+subscription_details.no_casestudy+"','"+subscription_details.category+"','"+subscription_details.category_short_code+"','"+subscription_details.type_name+"','"+subscription_details.board_name+"','"+subscription_details.subject_name+"','"+subscription_details.subject_id+"','"+subscription_details.has_library+"','"+subscription_details.only_elibrary+"')");*/
                 db.query("UPDATE `students` SET `exam_unique_id` ='"+exam_unique_id+"' where `id` = "+student_id)
                message = "User record not exist in the system";
              
                db.query("select * from `students` where `id` ="+student_id)
                .then(resultdata=>{ 
                    db.query("delete from `addtocart_subscription` where `student_id` = "+student_id)
                        response = {status: 200, msg: "Congratulations! Your subscription purchase has been processed successfully.",
                        email:resultdata[0].email,exam_unique_id:exam_unique_id,is_subscribe: is_subscribe,is_subscribe_e_library:is_subscribe_e_library}
                       
                        resolve(response);
                });
            }else{
                reject({msg:"Error in query. Please check",error:err});
            }
        })
        

    }).then((value) => {
        //console.log(value);
          return value;
          //
      }).catch((err) => {
          return err;
          //console.error(err);
      });
      
  return result;
}
async function getcartstlist(data){
    let result = await new Promise((resolve, reject) => {
        db.query("select addtocart_subscription.*,exam_categories.category,exam_categories.short_code as category_short_code,exam_type.type_name,boards.name as board_name from \
        `addtocart_subscription` left join exam_categories on exam_categories.id = addtocart_subscription.exam_category_id \
        left join exam_type on addtocart_subscription.exam_type_id = exam_type.id left join boards on addtocart_subscription.exam_type_id = boards.id where `student_id` = "+data.student_id)
        .then(async (result,err)=>{
            if(result.length > 0){
                    const exam_competitive_master = await db.query("select exam_competitive_subscribtion_master.* from `exam_competitive_subscribtion_master` where exam_competitive_subscribtion_master.is_deleted = 0 and exam_competitive_subscribtion_master.status = 1");
                    const exam_scholastic_master = await db.query("select exam_scholastic_subscribtion_master.*,subjects.name as subject_name from `exam_scholastic_subscribtion_master`\
                    left join subjects on exam_scholastic_subscribtion_master.subject_id = subjects.id where exam_scholastic_subscribtion_master.is_deleted = 0 and exam_scholastic_subscribtion_master.status = 1");
                    let finalresult = [];
                    var counter = 0;
                    result.forEach(element => {
                        if(element.exam_category_id == 1){
                            exam_scholastic_master.forEach(element_inner_1=>{
                                if(element_inner_1.id === element.subscription_id)
                                {
                                    element.board_name = element_inner_1.board_name;
                                    element.subject_name = element_inner_1.subject_name;
                                }
                            })
                            
                            finalresult[counter] = element;
                            counter++;
                        }

                        if(element.exam_category_id == 2){
                            exam_competitive_master.forEach(element_inner_2=>{
                                if(element_inner_2.id === element.subscription_id)
                                {
                                    element.exam_type = element_inner_2.type_name;
                                    element.subject_name = element_inner_2.subject_name;
                                }
                            })
                            
                            finalresult[counter] = element;
                            counter++;
                        }
                        
                    });
                    resolve({status:200,msg:"Cart record found",data:finalresult});
            }else{
                reject({msg:"Error in query. Please check",error:err});
            }
        })
    }).then((value) => {
        //console.log(value);
          return value;
          //
      }).catch((err) => {
          return err;
          //console.error(err);
      });
      
  return result;
}

/*
async function getsubjectslist(data){
    let subjects_list = [];
    let total_setcompleted = 0;
    let total_modulecompleted = 0;
    let total_mockcompleted = 0;
    let exam_completed_percentage = 0;
    let chapter_ary = []; 
    let exam_completed = [];
    let exam_completed_module = [];
    let exam_completed_mock = [];
    let resultdata = [];
    let exam_completed_subjects = [];
    let exam_completed_subjects_module = [];
    let exam_completed_subjects_mock = [];
     
        await db.query("select subject_id, count(*) as total_exam_completed from `exam_completed` where `exam_type` = 1 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
                exam_completed_subjects.push(element.subject_id);              
                exam_completed.push({"subject_id":element.subject_id,"total_exam_completed":element.total_exam_completed});
        })


        await db.query("select subject_id,branch_id, count(*) as total_chapter from `chapters` left join `branches` on `branches`.`id` = `chapters`.`branch_id` where `chapters`.`is_deleted` = 0 GROUP by subject_id")
        .then((total_chapter_result)=>{
            total_chapter_result.forEach(element2=>{
                chapter_ary.push({"subject_id":element2.subject_id,"total_chapters":element2.total_chapter});
            })
        })
    })

    /*await db.query("select subject_id, count(*) as total_exam_completed from `exam_completed` where `exam_type` = 2 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
                exam_completed_subjects_module.push(element.subject_id);              
                exam_completed_module.push({"subject_id":element.subject_id,"total_exam_completed":element.total_exam_completed});
               
        })
    })*/
//////////////////////// Exam Completed MODULE LIST //////////////////////////////
/*    await db.query("select * from `exam_completed` where `exam_type` = 2 and `student_id`= "+data.student_id)
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
                //exam_completed_subjects_module.push(element.subject_id);              
                exam_completed_module.push({"subject_id":element.subject_id,"module_no":element.exam_set_counter,"exam_unique_id":element.exam_unique_id});
               
        })
    })

        await db.query("select * from `exam_completed` where `exam_type` = 3 and `student_id`= "+data.student_id)
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
                exam_completed_subjects_mock.push(element.subject_id);              
                exam_completed_mock.push({"subject_id":element.subject_id,"mock_no":element.exam_set_counter,"exam_unique_id":element.exam_unique_id});
                
        })
    })
let final_result = [];
    chapter_ary.forEach(element_inner1=>{
        let subject_id = element_inner1.subject_id;
        let total_chapters = element_inner1.total_chapters;
        if(!exam_completed_subjects.toString().includes(subject_id)){
            final_result.push({"subject_id":subject_id,"exam_completed_percentage":0});
        }else{
        exam_completed.forEach(element_inner2=>{
            let subject_id_2 = element_inner2.subject_id;
            let total_exam_completed = element_inner2.total_exam_completed;
            if(subject_id == subject_id_2){
                //if(calculation_counter  < exam_completed.length)
                {
                exam_completed_percentage = Math.floor((total_exam_completed/total_chapters)*100);
                    final_result.push({"subject_id":subject_id_2,"exam_completed_percentage":exam_completed_percentage});
                
                }
            }   
        })
    }
    })
    //console.log(final_result)
    let result = await new Promise((resolve, reject) => {
        db.query("select * from `purchased_subscribtions` where `student_id`= "+data.student_id+" and is_active = 1")
        .then((result,err)=>{
                           
            let calculation_counter = 0;
           let counter = 0;
           if(result.length > 0){
            result.forEach(element_outer=>{          
                        const subscription_details = JSON.parse(element_outer.subscription_details);
                        //console.log(subscription_details)
                        //async.eachSeries(subscription_details,function(element){
                            subscription_details.forEach( element=>{
                                //console.log(element)
                                    if(element.exam_category_id.toString() === process.env.SCHOLASTIC){
                                        let exam_completed_percentage = 0;
                                       
                                        let exam_completed_module = [];
                                        let exam_completed_mock = [];

                                        let module_current_no = 1;
                                        let mock_current_no = 1;

                                        final_result.forEach(element_inner1=>{
                                            if(element_inner1.subject_id === element.subject_id)
                                            {
                                                exam_completed_module.forEach(element_inner2=>{
                                                    if(element_inner2.subject_id === element.subject_id)
                                                    {
                                                        module_current_no = element_inner2.total_exam_completed + 1;
                                                        exam_completed_module.push(element_inner2);
                                                    }
                                                })
                                                exam_completed_mock.forEach(element_inner2=>{
                                                    if(element_inner2.subject_id === element.subject_id)
                                                    {
                                                        mock_current_no = element_inner2.total_exam_completed + 1;
                                                        exam_completed_mock.push(element_inner2);
                                                    }
                                                })
                                                
                                                let exam_completed_percentage = parseInt(element_inner1.exam_completed_percentage);                                                
                                                let no_module = 0;
                                                if(element.no_module > 0){
                                                if(exam_completed_percentage >= 40 && exam_completed_percentage < 80)
                                                {
                                                    no_module = 1;
                                                }
                                                else if(exam_completed_percentage >= 80 && exam_completed_percentage < 100)
                                                {
                                                    no_module = 2;
                                                }
                                                else if(exam_completed_percentage >= 100)
                                                {
                                                    no_module = 3;
                                                }
                                            }

                                            let no_mock = 0;
                                                if(element.no_mock > 0){
                                                if(exam_completed_percentage >= 60 && exam_completed_percentage < 100)
                                                {
                                                    no_mock = 1;
                                                }
                                                else if(exam_completed_percentage >= 100)
                                                {
                                                    no_mock = 2;
                                                }

                                            }

                                                //console.log(no_module)
                                                subjects_list.push({subject_name:element.subject_name,subject_id:element.subject_id,
                                                exam_completed_percentage:exam_completed_percentage,module_count:no_module,mock_count:no_mock,
                                                set_count:element.no_set,exam_completed_module:exam_completed_module,exam_completed_mock:exam_completed_mock,
                                                module_current_no:module_current_no,mock_current_no:mock_current_no });
                                            }
                                        })
                                       
                                    }
                                  
                            })
                            
                })
               //console.log(subjects_list)
               resolve({status:200,msg:"Subject list which are purchased",data:subjects_list})
             }
             else{
                reject({status:200,msg:"Subscribed subject list not found"});
             }
        })
        

    }).then((value) => {
    
          return value;
          //
      }).catch((err) => {
          return err;
          //console.error(err);
      });
      
  return result;
}*/
async function getsubjectslist_groupwise(data,userdata){
    let subjects_list = [];
    let total_setcompleted = 0;
    let total_modulecompleted = 0;
    let total_mockcompleted = 0;
    let exam_completed_percentage = 0;
    let chapter_ary = []; 
    let exam_completed = [];
    let exam_completed_module = [];
    let exam_completed_mock = [];
    let resultdata = [];
    let exam_completed_subjects = [];
    let exam_completed_subjects_module = [];
    let exam_completed_subjects_module_record = [];
    let exam_completed_subjects_mock = [];
    let exam_completed_subjects_mock_record = [];
    let module_interm = 0;
    let mock_interm = 0;
    let exam_completed_subjects_casestudy = [];
    let exam_completed_subjects_casestudy_record = [];
    let module_1 = 40;
    let module_2 = 70;
    let module_3 = 100;
    let mock_1 = 60;
    let mock_2 = 100;
    let student_id = userdata.id;
    let group_subjects_ary = [];
    let single_subjects_ary = [];
    let combo_subjects_ary = [];
    let combo_subject_list = [];
    let non_grouped_subject_ary = [];
    let purchased_combo_subject_list = [];
    let subject_name_ary = [];
    let subject_id = data.subject_id;
    await db.query("select * from `subjects` where is_deleted = 0 and status = 1")
    .then(result=>{
        if(result.length >0)
        {
            result.forEach(element=>{
                if(element.group_exist == 3)
                {
                    combo_subjects_ary[element.id] =  (element.group_subjects);
                    combo_subject_list.push(element.id);
                }
                if(element.group_exist == 1)
                {
                    non_grouped_subject_ary.push(element.id);
                }
                subject_name_ary[element.id] = element.name;
            })
        }
    })
           ////////////////////Interm Module, Mock Exist or not ////////////////////
            let module_interm_ary = [];   
            let mock_interm_ary = []; 
           await db.query("select * from `interm_storeexamdata` where  `exam_category_id` = 1 and `student_id` = "+student_id+" and `exam_type` = 2 and subject_group_id = "+subject_id).then(result=>{
            if(result.length > 0)
            {
                result.forEach(element=>{
                    module_interm_ary[element.subject_id] = element.total_attempts;
                })
                
            }
        })
        
        await db.query("select * from `interm_storeexamdata` where `exam_category_id` = 1 and `student_id` = "+student_id+" and `exam_type` = 3 and subject_group_id = "+subject_id).then(result=>{
            if(result.length > 0)
            {
                result.forEach(element=>{
                    mock_interm_ary[element.subject_id] = element.total_attempts;
                })
            }
        })

    //////////////////////// EXAM COMPLETED SET ////////////////////////////////
    await db.query("select subject_id, count(DISTINCT chapter_id) as total_exam_completed,subjects.group_subjects from `exam_completed` left join `subjects` on `subjects`.`id` = `subject_id` where `exam_type` = 1 and `exam_status` = 2 and `student_id`= "+student_id+" and subject_group_id = "+subject_id+" and case_study_exam = 2 group by subject_id")
        .then(async completed_exam=>{
            if(completed_exam.length > 0){
            completed_exam.forEach(async element=>{
                let subject_id = element.subject_id;  
                exam_completed_subjects.push(subject_id);
                group_subjects_ary[subject_id] =  (element.group_subjects);
                single_subjects_ary[subject_id] = subject_id;
                //exam_completed.push({"subject_id":subject_id,"total_exam_completed":element.total_exam_completed});
                exam_completed[subject_id] = element.total_exam_completed;

        })
    }
    })

    //////////////////////// EXAM COMPLETED MODULE ////////////////////////////////
    await db.query("select subject_id, count(DISTINCT chapter_id) as total_exam_completed,exam_unique_id from `exam_completed` where `exam_type` = 2 and `student_id`= "+student_id+" and subject_group_id = "+subject_id+" group by subject_id")
        .then(async completed_exam=>{
            if(completed_exam.length > 0){
            completed_exam.forEach(element=>{
                exam_completed_subjects_module[element.subject_id] = element.total_exam_completed;
                exam_completed_subjects_module_record[element.subject_id] = element.exam_unique_id;
        })
    }
    })
    //console.log(exam_completed_subjects_module)

    //////////////////////// EXAM COMPLETED MOCK ////////////////////////////////
    await db.query("select subject_id, count(DISTINCT chapter_id) as total_exam_completed,exam_unique_id from `exam_completed` where `exam_type` = 3 and `student_id`= "+student_id+" and subject_group_id = "+subject_id+" group by subject_id")
        .then(async completed_exam=>{
            if(completed_exam.length > 0){
            completed_exam.forEach(element=>{
                exam_completed_subjects_mock[element.subject_id]= element.total_exam_completed;
                exam_completed_subjects_mock_record[element.subject_id] = element.exam_unique_id;
        })
    }
    })

    //////////////////////// EXAM COMPLETED Case Study ////////////////////////////////
    await db.query("select subject_id, count(DISTINCT chapter_id) as total_exam_completed from `exam_completed` where `exam_type` = 4 and `student_id`= "+student_id+" and subject_group_id = "+subject_id+" group by subject_id")
        .then(async completed_exam=>{
            if(completed_exam.length > 0){
            completed_exam.forEach(element=>{
                exam_completed_subjects_casestudy[element.subject_id]= element.total_exam_completed;
                
        })
    }
    })
    //console.log(exam_completed_subjects_mock)

    await db.query("select * from `chapters` where `is_deleted` = 0 and status = 1 and chapters.standard = "+userdata.class+" and chapters.board_id = "+userdata.board)
    .then(result=>{
        let i = 0;
        result.forEach(element=>{
        if(chapter_ary[element.id] == null){
            chapter_ary[element.branch_id] = [];
        }    
            //chapter_ary[element.branch_id].push(element);
        })

        for (var key in chapter_ary) {
            result.forEach(element=>{
                if(element.branch_id == key){
                    chapter_ary[key].push(element.id);
                }
            })
        }
    })
    
    let subscription_details_new = [];
    let subject_id_ary = [];
    await db.query("select * from `purchased_subscribtions` where `student_id`= "+student_id+" and is_active = 1")
    .then((result,err)=>{
        result.forEach(async element_outer=>{ 
            
            const subscription_details = JSON.parse(element_outer.subscription_details);
            subscription_details.forEach(async element=>{
                if(element.exam_category_id.toString() === process.env.SCHOLASTIC && element.only_elibrary === 0){
                   if(data.subject_id == Number(element.subject_id))
                   { 
                        if(!subject_id_ary.includes(Number(element.subject_id)))
                        {
                            subject_id_ary.push(Number(element.subject_id));
                            element.no_set = JSON.parse(element.no_set);
                            subscription_details_new[element.subject_id] = element;
                        }
                        else
                        {
                            if(element.no_casestudy > 0){
                                subscription_details_new[element.subject_id].no_casestudy = element.no_casestudy;
                            }
                            if(element.no_module > 0){
                                //console.log(element.no_module,element.subject_id);
                                subscription_details_new[element.subject_id].no_module = element.no_module;
                            }
                            if(element.no_mock > 0){
                                subscription_details_new[element.subject_id].no_mock = element.no_mock;
                            }
                            
                            if((element.no_set).length > 0){
                                
                                let cur_set_no = (subscription_details_new[element.subject_id].no_set);
                                let new_set_no = cur_set_no.concat(JSON.parse(element.no_set));
                            // console.log(element.subject_id,new_set_no);
                                subscription_details_new[element.subject_id].no_set = new_set_no;
                            }
                        }
                    }else if(data.subject_id == 0){
                        if(!combo_subject_list.includes(Number(element.subject_id)))
                        {
                            if(!subject_id_ary.includes(Number(element.subject_id)))
                            {
                                subject_id_ary.push(Number(element.subject_id));
                                element.no_set = JSON.parse(element.no_set);
                                subscription_details_new[element.subject_id] = element;
                            }
                            else
                            {
                                if(element.no_casestudy > 0){
                                    subscription_details_new[element.subject_id].no_casestudy = element.no_casestudy;
                                }
                                if(element.no_module > 0){
                                    //console.log(element.no_module,element.subject_id);
                                    subscription_details_new[element.subject_id].no_module = element.no_module;
                                }
                                if(element.no_mock > 0){
                                    subscription_details_new[element.subject_id].no_mock = element.no_mock;
                                }
                                
                                if((element.no_set).length > 0){
                                    
                                    let cur_set_no = (subscription_details_new[element.subject_id].no_set);
                                    let new_set_no = cur_set_no.concat(JSON.parse(element.no_set));
                                // console.log(element.subject_id,new_set_no);
                                    subscription_details_new[element.subject_id].no_set = new_set_no;
                                }
                            }
                        }
                    }
                    //console.log(subscription_details_new);
                }
            })
        });
        //console.log(subscription_details_new);
    });
    //console.log(subscription_details_new);
    //return;
    let result = await new Promise((resolve, reject) => {
    db.query("select * from `purchased_subscribtions` where `student_id`= "+student_id+" and is_active = 1")
        .then((result,err)=>{
            let calculation_counter = 0;
           let counter = 0;
           if(result.length > 0){
            result.forEach(async element_outer=>{    
                        //const subscription_details = JSON.parse(element_outer.subscription_details);
                        const subscription_details = subscription_details_new;
                            subscription_details.forEach(async element=>{
                              
                                    if(element.exam_category_id.toString() === process.env.SCHOLASTIC && element.only_elibrary === 0){
                                        
                                        let subjects_ary = [];
                                        if(typeof group_subjects_ary[element.subject_id]!='undefined' && group_subjects_ary[element.subject_id].length > 0){ 
                                            subjects_ary = (group_subjects_ary[element.subject_id]).split(",");
                                        }else{
                                            subjects_ary = single_subjects_ary;
                                        }
                                       
                                        let exam_completed_percentage = 0;
                                        let module_current_no = 0;
                                        let mock_current_no = 0;
                                        let casestudy_current_no = 1;
                                        let max_chapter_select = 0;
                                        let max_chapter_select_mock = 0;
                                        let exam_completed_module_completed = [];
                                        let exam_completed_mock_completed = [];
                                        let total_chapters = 0;
                                        if(typeof group_subjects_ary[element.subject_id]!='undefined' && group_subjects_ary[element.subject_id].length > 0)
                                        {
                                            subjects_ary.forEach(element=>{
                                                if(typeof chapter_ary[element] != 'undefined' && chapter_ary[element].length > 0){
                                                    total_chapters += chapter_ary[element].length;
                                                }
                                            })
                                        }else{
                                            
                                                if(typeof chapter_ary[element.subject_id] != 'undefined' && chapter_ary[element.subject_id].length > 0){
                                                    total_chapters = chapter_ary[element.subject_id].length;

                                                }
                                        }
                                       
                                        let total_exam_completed = exam_completed[element.subject_id];
                                        exam_completed_percentage = Math.ceil((total_exam_completed/total_chapters)*100);
                                        let no_module = 0;
                                        let no_casestudy = 0; 
                                        if( element.no_casestudy > 0){
                                            no_casestudy = 1;
                                        }
                                        
                                        if( element.no_module == 1){
                                            no_module = 3;
                                        }
                                        if(no_module > 0){
                                            if(exam_completed_percentage >= module_1)
                                            {
                                                module_current_no = 1;
                                            }
                                        }
                                        let no_mock = 0; 
                                        if( element.no_mock == 1){
                                            no_mock = 2;
                                        }

                                        if(element.no_mock > 0){
                                            
                                            if(exam_completed_percentage >= mock_1 && exam_completed_subjects_module[element.subject_id] >= 1)
                                            {
                                                mock_current_no = 1;
                                            }
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 1){
                                            module_current_no = 2;
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 2){
                                            module_current_no = 3;
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 3){
                                            module_current_no = 4;
                                        }
                                        if(exam_completed_subjects_mock[element.subject_id] == 1){
                                            mock_current_no = 2;
                                        }
                                        if(exam_completed_subjects_mock[element.subject_id] == 2){
                                            mock_current_no = 3;
                                        }

                                        if(exam_completed_subjects_casestudy[element.subject_id] == 1){
                                            casestudy_current_no = 2;
                                        }
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 2){
                                            casestudy_current_no = 3;
                                        }
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 3){
                                            casestudy_current_no = 0;
                                        }

                                        if(module_current_no == 1)
                                                {
                                                    max_chapter_select = Math.ceil(total_chapters * (module_1/100));
                                                }
                                                else if(module_current_no == 2)
                                                {
                                                    max_chapter_select = Math.ceil(total_chapters * ((module_2 - module_1)/100));
                                                }
                                                else if(module_current_no == 3)
                                                {
                                                    let max_chapter_select_1 = Math.ceil(total_chapters * (module_1/100));
                                                    let max_chapter_select_2 = Math.ceil(total_chapters * ((module_2 - module_1)/100));
                                                    max_chapter_select = total_chapters - (max_chapter_select_1 + max_chapter_select_2);
                                                }

                                                if(mock_current_no == 1)
                                                {
                                                    max_chapter_select_mock = Math.ceil(total_chapters * (mock_1/100));
                                                }
                                                else if(mock_current_no == 2)
                                                {
                                                    let max_chapter_select_mock_1 = Math.ceil(total_chapters * (mock_1/100));
                                                    max_chapter_select_mock = total_chapters - max_chapter_select_mock_1;
                                                }
                                                for(let i = 1; i <= exam_completed_subjects_module[element.subject_id];i++){
                                                exam_completed_module_completed.push({module_no:i,subject_id:element.subject_id,exam_unique_id:exam_completed_subjects_module_record[element.subject_id]});
                                                }
                                                for(let i = 1; i <= exam_completed_subjects_mock[element.subject_id];i++){
                                                    
                                                    exam_completed_mock_completed.push({mock_no:i,subject_id:element.subject_id,exam_unique_id:exam_completed_subjects_mock_record[element.subject_id]});
                                                }
                                                

                                        subjects_list.push({subject_name:element.subject_name,subject_id:element.subject_id,
                                            exam_completed_percentage:exam_completed_percentage,module_count:no_module,mock_count:no_mock,
                                            set_count:JSON.stringify(element.no_set),module_current_no:module_current_no,mock_current_no:mock_current_no,
                                            exam_completed_module:exam_completed_module_completed,exam_completed_mock:exam_completed_mock_completed,
                                        max_chapter_select:max_chapter_select,max_chapter_select_mock:max_chapter_select_mock,total_chapters:total_chapters,
                                        casestudy_count:no_casestudy,module_interm:module_interm,mock_interm:mock_interm });
                                        
                                   
                                       
                                    }
                                    
                                })
                                             
                            })
                            //console.log(subjects_list);
                            //return;
                             ///////////////////// NEW SECTION FOR GROUP SUBSCRIPTION  12-10-2023 //////
                            let interm_subjects_list = [];
                            let combo_subjects_details = [];
                            if(subjects_list.length > 0)
                            {
                                subjects_list.forEach(element=>{
                                    if(!combo_subject_list.includes(element.subject_id))
                                    {
                                        interm_subjects_list.push(element);
                                        
                                    }else{
                                        combo_subjects_details[element.subject_id] = element;
                                        purchased_combo_subject_list.push(element.subject_id);
                                    }
                                })
                            
                            let group_subjects = [];
                             group_subjects = combo_subjects_ary[purchased_combo_subject_list];
                             //group_subjects = group_subjects.split(",");
                            
                             purchased_combo_subject_list.forEach(element=>{
                                combo_subjects_ary[element].split(",").forEach(element_inner=>{
                                    //console.log(element_inner,element);
                                    combo_subjects_details[element].subject_id = Number(element_inner);
                                    combo_subjects_details[element].subject_name = subject_name_ary[element_inner];
                                    //console.log(combo_subjects_details[element]);
                                    interm_subjects_list.push(JSON.parse(JSON.stringify(combo_subjects_details[element])));
                                    
                                })
                            })
                        
                            subjects_list = interm_subjects_list;
                            }    
                          
                                                        ///////////////////// NEW SECTION FOR MULTIPLE SUBSCRIPTION  11-10-2023 //////
                           interm_subjects_list = [];
                           let final_subjects_list = [];
                           let subjects_list_ary = [];
                           let subjectswise_set_count = [];
                           let subjectswise_module_count = [];
                           let subjectswise_mock_count = [];
                           let exam_completed_module_completed = [];
                           let exam_completed_mock_completed = [];
                           let exam_completed_percentage = 0;
                                        let module_current_no = 0;
                                        let mock_current_no = 0;
                                        let casestudy_current_no = 1;
                                        let max_chapter_select = 0;
                                        let max_chapter_select_mock = 0;
                                        
                                    

                           subjects_list.forEach(element=>{
                            subjectswise_module_count[element.subject_id] = 0;
                            subjectswise_mock_count[element.subject_id] = 0;
                           })

                           subjects_list.forEach(element=>{
                            if(subjectswise_set_count[element.subject_id] == null){
                                subjectswise_set_count[element.subject_id] = [];
                            }
                            
                            if(!subjects_list_ary.includes(element.subject_id)){
                                subjects_list_ary.push(element.subject_id);
                                subjectswise_set_count[element.subject_id] = JSON.parse(element.set_count);
                                if(element.module_count > 0){
                                    subjectswise_module_count[element.subject_id] = element.module_count;
                                }
                                if(element.mock_count > 0){
                                    subjectswise_mock_count[element.subject_id] = element.mock_count;
                                }
                                interm_subjects_list.push(element);
                            }else{
                                if(element.module_count > 0){
                                    subjectswise_module_count[element.subject_id] = element.module_count;
                                }
                                if(element.mock_count > 0){
                                    subjectswise_mock_count[element.subject_id] = element.mock_count;
                                }
                                subjectswise_set_count[element.subject_id] = JSON.parse(element.set_count);
                            }
                           });

                           
                           interm_subjects_list.forEach(async element=>{
                            let total_chapters = 0;
                            let subjects_ary = [];
                                        if(typeof group_subjects_ary[element.subject_id]!='undefined' && group_subjects_ary[element.subject_id].length > 0){ 
                                            subjects_ary = (group_subjects_ary[element.subject_id]).split(",");
                                        }else{
                                            subjects_ary = single_subjects_ary;
                                        }
                            let exam_completed_percentage = 0;
                                        let module_current_no = 0;
                                        let mock_current_no = 0;
                                        let casestudy_current_no = 1;
                                        let max_chapter_select = 0;
                                        let max_chapter_select_mock = 0;
                                        
                                        if(typeof group_subjects_ary[element.subject_id]!='undefined' && group_subjects_ary[element.subject_id].length > 0)
                                        {
                                            subjects_ary.forEach(element=>{
                                                if(typeof chapter_ary[element] != 'undefined' && chapter_ary[element].length > 0){
                                                    total_chapters += chapter_ary[element].length;
                                                }
                                            })
                                        }else{
                                            
                                                if(typeof chapter_ary[element.subject_id] != 'undefined' && chapter_ary[element.subject_id].length > 0){
                                                    total_chapters = chapter_ary[element.subject_id].length;

                                                }
                                        }
                            element.total_chapters = total_chapters;
                          
                            let total_exam_completed = exam_completed[element.subject_id];
                                        exam_completed_percentage = Math.ceil((total_exam_completed/total_chapters)*100);
                                        let no_module = 0;
                                        let no_casestudy = 0; 
                                        if( element.casestudy_count > 0){
                                            no_casestudy = 1;
                                        }
                                       
                                        //no_module = element.module_count;
                                        
                                        no_module = subjectswise_module_count[element.subject_id];
                                        if(no_module > 0){
                                            if(exam_completed_percentage != null && exam_completed_percentage >= module_1)
                                            {
                                                module_current_no = 1;
                                            }
                                        }
                                        let no_mock = 0; 
                                        if( element.mock_count == 1){
                                            no_mock = 2;
                                        }

                                        if(element.mock_count > 0){
                                            
                                            if(exam_completed_percentage >= mock_1 && exam_completed_subjects_module[element.subject_id] >= 1)
                                            {
                                                mock_current_no = 1;
                                            }
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 1){
                                            module_current_no = 2;
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 2){
                                            module_current_no = 3;
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 3){
                                            module_current_no = 4;
                                        }
                                        if(exam_completed_subjects_mock[element.subject_id] == 1){
                                            mock_current_no = 2;
                                        }
                                        if(exam_completed_subjects_mock[element.subject_id] == 2){
                                            mock_current_no = 3;
                                        }
                                        
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 1){
                                            casestudy_current_no = 2;
                                        }
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 2){
                                            casestudy_current_no = 3;
                                        }
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 3){
                                            casestudy_current_no = 0;
                                        }
                                        //element.casestudy_current_no = casestudy_current_no;
                                        if(module_current_no == 1)
                                                {
                                                    max_chapter_select = Math.ceil(total_chapters * (module_1/100));
                                                }
                                                else if(module_current_no == 2)
                                                {
                                                    max_chapter_select = Math.ceil(total_chapters * ((module_2 - module_1)/100));
                                                }
                                                else if(module_current_no == 3)
                                                {
                                                    let max_chapter_select_1 = Math.ceil(total_chapters * (module_1/100));
                                                    let max_chapter_select_2 = Math.ceil(total_chapters * ((module_2 - module_1)/100));
                                                    max_chapter_select = total_chapters - (max_chapter_select_1 + max_chapter_select_2);
                                                }
                                                element.max_chapter_select = max_chapter_select;
                                                if(mock_current_no == 1)
                                                {
                                                    max_chapter_select_mock = Math.ceil(total_chapters * (mock_1/100));
                                                    element.max_chapter_select_mock = max_chapter_select_mock;
                                                }
                                                else if(mock_current_no == 2)
                                                {
                                                    let max_chapter_select_mock_1 = Math.ceil(total_chapters * (mock_1/100));
                                                    element.max_chapter_select_mock = total_chapters - max_chapter_select_mock_1;
                                                }
                                                
                                                for(let i = 1; i <= exam_completed_subjects_module[element.subject_id];i++){
                                                    exam_completed_module_completed.push({module_no:i,subject_id:element.subject_id,exam_unique_id:exam_completed_subjects_module_record[element.subject_id]});
                                                }
                                                for(let i = 1; i <= exam_completed_subjects_mock[element.subject_id];i++){
                                                    
                                                    exam_completed_mock_completed.push({mock_no:i,subject_id:element.subject_id,exam_unique_id:exam_completed_subjects_mock_record[element.subject_id]});
                                                }

                                
                                            
                             if(module_interm_ary[element.subject_id] > 0)
                             {
                                module_interm = module_interm_ary[element.subject_id];
                             }else{
                                module_interm = 0;
                             }   
                             if(mock_interm_ary[element.subject_id] > 0)
                             {
                                mock_interm = mock_interm_ary[element.subject_id];
                             }else{
                                mock_interm = 0;
                             }             
                            element.exam_completed_percentage = exam_completed_percentage;       
                            element.set_count = subjectswise_set_count[element.subject_id].sort();
                            element.module_count = no_module;
                            element.mock_count = subjectswise_mock_count[element.subject_id];
                            element.exam_completed_module = exam_completed_module_completed;                    
                            element.exam_completed_mock = exam_completed_mock_completed;
                            element.casestudy_count = no_casestudy;  
                            element.module_interm = module_interm;
                            element.mock_interm =  mock_interm;  
                            element.mock_current_no = mock_current_no;
                            element.module_current_no = module_current_no;             
                            final_subjects_list.push(element);
                           })
                         
                            resolve({status:200,msg:"Subject list which are purchased",data:final_subjects_list})
                        } 
                        else{
                            reject({status:200,msg:"Subscribed subject list not found"});
                        }        
            });

        }).then((value) => {
    
            return value;
            //
        }).catch((err) => {
            return err;
            //console.error(err);
        });
        
    return result;        

}
async function getsubjectslist(data,userdata){
    let subjects_list = [];
    let total_setcompleted = 0;
    let total_modulecompleted = 0;
    let total_mockcompleted = 0;
    let exam_completed_percentage = 0;
    let chapter_ary = []; 
    let exam_completed = [];
    let exam_completed_module = [];
    let exam_completed_mock = [];
    let resultdata = [];
    let exam_completed_subjects = [];
    let exam_completed_subjects_module = [];
    let exam_completed_subjects_module_record = [];
    let exam_completed_subjects_mock = [];
    let exam_completed_subjects_mock_record = [];
    let module_interm = 0;
    let mock_interm = 0;
    let exam_completed_subjects_casestudy = [];
    let exam_completed_subjects_casestudy_record = [];
    let module_1 = 40;
    let module_2 = 70;
    let module_3 = 100;
    let mock_1 = 60;
    let mock_2 = 100;
    let group_subjects_ary = [];
    let single_subjects_ary = [];
    let combo_subjects_ary = [];
    let combo_subject_list = [];
    let non_grouped_subject_ary = [];
    let purchased_combo_subject_list = [];
    let subject_name_ary = [];
    await db.query("select * from `subjects` where is_deleted = 0 and status = 1")
    .then(result=>{
        if(result.length >0)
        {
            result.forEach(element=>{
                if(element.group_exist == 3)
                {
                    combo_subjects_ary[element.id] =  (element.group_subjects);
                    combo_subject_list.push(element.id);
                }
                if(element.group_exist == 1)
                {
                    non_grouped_subject_ary.push(element.id);
                }
                subject_name_ary[element.id] = element.name;
            })
        }
    })

           ////////////////////Interm Module, Mock Exist or not ////////////////////
            let module_interm_ary = [];   
            let mock_interm_ary = []; 
           await db.query("select * from `interm_storeexamdata` where  `exam_category_id` = 1 and `student_id` = "+userdata.id+" and `exam_type` = 2").then(result=>{
            if(result.length > 0)
            {
                result.forEach(element=>{
                    module_interm_ary[element.subject_id] = element.total_attempts;
                })
                
            }
        })
        
        await db.query("select * from `interm_storeexamdata` where `exam_category_id` = 1 and `student_id` = "+userdata.id+" and `exam_type` = 3").then(result=>{
            if(result.length > 0)
            {
                result.forEach(element=>{
                    mock_interm_ary[element.subject_id] = element.total_attempts;
                })
            }
        })

    //////////////////////// EXAM COMPLETED SET ////////////////////////////////
    await db.query("select subject_id, count(DISTINCT chapter_id) as total_exam_completed,subjects.group_subjects from `exam_completed` left join `subjects` on `subjects`.`id` = `subject_id` where `exam_type` = 1 and `exam_status` = 2 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            if(completed_exam.length > 0){
            completed_exam.forEach(async element=>{
                let subject_id = element.subject_id;  
                exam_completed_subjects.push(subject_id);
                group_subjects_ary[subject_id] =  (element.group_subjects);
                single_subjects_ary[subject_id] = subject_id;
                //exam_completed.push({"subject_id":subject_id,"total_exam_completed":element.total_exam_completed});
                exam_completed[subject_id] = element.total_exam_completed;

        })
    }
    })

    //////////////////////// EXAM COMPLETED MODULE ////////////////////////////////
    await db.query("select subject_id, count(DISTINCT chapter_id) as total_exam_completed,exam_unique_id from `exam_completed` where `exam_type` = 2 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            if(completed_exam.length > 0){
            completed_exam.forEach(element=>{
                exam_completed_subjects_module[element.subject_id] = element.total_exam_completed;
                exam_completed_subjects_module_record[element.subject_id] = element.exam_unique_id;
        })
    }
    })
    //console.log(exam_completed_subjects_module)

    //////////////////////// EXAM COMPLETED MOCK ////////////////////////////////
    await db.query("select subject_id, count(DISTINCT chapter_id) as total_exam_completed,exam_unique_id from `exam_completed` where `exam_type` = 3 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            if(completed_exam.length > 0){
            completed_exam.forEach(element=>{
                exam_completed_subjects_mock[element.subject_id]= element.total_exam_completed;
                exam_completed_subjects_mock_record[element.subject_id] = element.exam_unique_id;
        })
    }
    })

    //////////////////////// EXAM COMPLETED Case Study ////////////////////////////////
    await db.query("select subject_id, count(DISTINCT chapter_id) as total_exam_completed from `exam_completed` where `exam_type` = 4 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            if(completed_exam.length > 0){
            completed_exam.forEach(element=>{
                exam_completed_subjects_casestudy[element.subject_id]= element.total_exam_completed;
                
        })
    }
    })
    //console.log(exam_completed_subjects_mock)

    await db.query("select * from `chapters` where `is_deleted` = 0 and status = 1 and chapters.standard = "+userdata.class+" and chapters.board_id = "+userdata.board)
    .then(result=>{
        let i = 0;
        result.forEach(element=>{
        if(chapter_ary[element.id] == null){
            chapter_ary[element.branch_id] = [];
        }    
            //chapter_ary[element.branch_id].push(element);
        })

        for (var key in chapter_ary) {
            result.forEach(element=>{
                if(element.branch_id == key){
                    chapter_ary[key].push(element.id);
                }
            })
        }
    })
    
    let subscription_details_new = [];
    let subject_id_ary = [];
    await db.query("select * from `purchased_subscribtions` where `student_id`= "+data.student_id+" and is_active = 1")
    .then((result,err)=>{
        result.forEach(async element_outer=>{ 
            
            const subscription_details = JSON.parse(element_outer.subscription_details);
            subscription_details.forEach(async element=>{
                if(element.exam_category_id.toString() === process.env.SCHOLASTIC && element.only_elibrary === 0){
                    if(subscription_details_new[element.subject_id] == null)
                    {
                        //subscription_details_new[element.subject_id] = [];
                    }
                    //console.log(element.no_set,element.subject_id);
                    if(!subject_id_ary.includes(Number(element.subject_id)))
                    {
                        subject_id_ary.push(Number(element.subject_id));
                        element.no_set = JSON.parse(element.no_set);
                        subscription_details_new[element.subject_id] = element;
                    }
                    else
                    {
                        
                        if(element.no_module > 0){
                            //console.log(element.no_module,element.subject_id);
                            subscription_details_new[element.subject_id].no_module = element.no_module;
                        }
                        if(element.no_mock > 0){
                            subscription_details_new[element.subject_id].no_mock = element.no_mock;
                        }
                        
                        if((element.no_set).length > 0){
                            
                            let cur_set_no = (subscription_details_new[element.subject_id].no_set);
                            let new_set_no = cur_set_no.concat(JSON.parse(element.no_set));
                           // console.log(element.subject_id,new_set_no);
                            subscription_details_new[element.subject_id].no_set = new_set_no;
                        }
                    }
                    //console.log(subscription_details_new);
                }
            })
        });
        //console.log(subscription_details_new);
    });
    
    //return;
    let result = await new Promise((resolve, reject) => {
    db.query("select * from `purchased_subscribtions` where `student_id`= "+data.student_id+" and is_active = 1")
        .then((result,err)=>{
            let calculation_counter = 0;
           let counter = 0;
           if(result.length > 0){
            result.forEach(async element_outer=>{    
                        //const subscription_details = JSON.parse(element_outer.subscription_details);
                        const subscription_details = subscription_details_new;
                            subscription_details.forEach(async element=>{
                                    if(element.exam_category_id.toString() === process.env.SCHOLASTIC && element.only_elibrary === 0){
                                        
                                    
                                        let subjects_ary = [];
                                        if(typeof group_subjects_ary[element.subject_id]!='undefined' && group_subjects_ary[element.subject_id].length > 0){ 
                                            subjects_ary = (group_subjects_ary[element.subject_id]).split(",");
                                        }else{
                                            subjects_ary = single_subjects_ary;
                                        }
                                       
                                        let exam_completed_percentage = 0;
                                        let module_current_no = 0;
                                        let mock_current_no = 0;
                                        let casestudy_current_no = 1;
                                        let max_chapter_select = 0;
                                        let max_chapter_select_mock = 0;
                                        let exam_completed_module_completed = [];
                                        let exam_completed_mock_completed = [];
                                        let total_chapters = 0;
                                        if(typeof group_subjects_ary[element.subject_id]!='undefined' && group_subjects_ary[element.subject_id].length > 0)
                                        {
                                            subjects_ary.forEach(element=>{
                                                if(typeof chapter_ary[element] != 'undefined' && chapter_ary[element].length > 0){
                                                    total_chapters += chapter_ary[element].length;
                                                }
                                            })
                                        }else{
                                            
                                                if(typeof chapter_ary[element.subject_id] != 'undefined' && chapter_ary[element.subject_id].length > 0){
                                                    total_chapters = chapter_ary[element.subject_id].length;

                                                }
                                        }
                                       
                                        let total_exam_completed = exam_completed[element.subject_id];
                                        exam_completed_percentage = Math.ceil((total_exam_completed/total_chapters)*100);
                                        let no_module = 0;
                                        let no_casestudy = 0; 
                                        if( element.no_casestudy > 0){
                                            no_casestudy = 3;
                                        }
                                        if( element.no_module == 1){
                                            no_module = 3;
                                        }
                                        if(no_module > 0){
                                            if(exam_completed_percentage >= module_1)
                                            {
                                                module_current_no = 1;
                                            }
                                        }
                                        let no_mock = 0; 
                                        if( element.no_mock == 1){
                                            no_mock = 2;
                                        }

                                        if(element.no_mock > 0){
                                            
                                            if(exam_completed_percentage >= mock_1 && exam_completed_subjects_module[element.subject_id] >= 1)
                                            {
                                                mock_current_no = 1;
                                            }
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 1){
                                            module_current_no = 2;
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 2){
                                            module_current_no = 3;
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 3){
                                            module_current_no = 4;
                                        }
                                        if(exam_completed_subjects_mock[element.subject_id] == 1){
                                            mock_current_no = 2;
                                        }
                                        if(exam_completed_subjects_mock[element.subject_id] == 2){
                                            mock_current_no = 3;
                                        }

                                        if(exam_completed_subjects_casestudy[element.subject_id] == 1){
                                            casestudy_current_no = 2;
                                        }
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 2){
                                            casestudy_current_no = 3;
                                        }
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 3){
                                            casestudy_current_no = 0;
                                        }

                                        if(module_current_no == 1)
                                                {
                                                    max_chapter_select = Math.ceil(total_chapters * (module_1/100));
                                                }
                                                else if(module_current_no == 2)
                                                {
                                                    max_chapter_select = Math.ceil(total_chapters * ((module_2 - module_1)/100));
                                                }
                                                else if(module_current_no == 3)
                                                {
                                                    let max_chapter_select_1 = Math.ceil(total_chapters * (module_1/100));
                                                    let max_chapter_select_2 = Math.ceil(total_chapters * ((module_2 - module_1)/100));
                                                    max_chapter_select = total_chapters - (max_chapter_select_1 + max_chapter_select_2);
                                                }

                                                if(mock_current_no == 1)
                                                {
                                                    max_chapter_select_mock = Math.ceil(total_chapters * (mock_1/100));
                                                }
                                                else if(mock_current_no == 2)
                                                {
                                                    let max_chapter_select_mock_1 = Math.ceil(total_chapters * (mock_1/100));
                                                    max_chapter_select_mock = total_chapters - max_chapter_select_mock_1;
                                                }
                                                for(let i = 1; i <= exam_completed_subjects_module[element.subject_id];i++){
                                                exam_completed_module_completed.push({module_no:i,subject_id:element.subject_id,exam_unique_id:exam_completed_subjects_module_record[element.subject_id]});
                                                }
                                                for(let i = 1; i <= exam_completed_subjects_mock[element.subject_id];i++){
                                                    
                                                    exam_completed_mock_completed.push({mock_no:i,subject_id:element.subject_id,exam_unique_id:exam_completed_subjects_mock_record[element.subject_id]});
                                                }
                                                

                                        subjects_list.push({subject_name:element.subject_name,subject_id:element.subject_id,
                                            exam_completed_percentage:exam_completed_percentage,module_count:no_module,mock_count:no_mock,
                                            set_count:JSON.stringify(element.no_set),module_current_no:module_current_no,mock_current_no:mock_current_no,
                                            exam_completed_module:exam_completed_module_completed,exam_completed_mock:exam_completed_mock_completed,
                                        max_chapter_select:max_chapter_select,max_chapter_select_mock:max_chapter_select_mock,total_chapters:total_chapters,
                                        casestudy_count:no_casestudy,module_interm:module_interm,mock_interm:mock_interm });
                                        
                                       
                                    }
                                    
                                })
                                             
                            })
                            //console.log(subjects_list);
                            //return;
                             ///////////////////// NEW SECTION FOR MULTIPLE SUBSCRIPTION  12-10-2023 //////
                            let interm_subjects_list = [];
                            let combo_subjects_details = [];
                            if(subjects_list.length > 0)
                            {
                                subjects_list.forEach(element=>{
                                    if(!combo_subject_list.includes(element.subject_id))
                                    {
                                        interm_subjects_list.push(element);
                                        
                                    }else{
                                        combo_subjects_details[element.subject_id] = element;
                                        purchased_combo_subject_list.push(element.subject_id);
                                    }
                                })
                            
                            let group_subjects = [];
                             group_subjects = combo_subjects_ary[purchased_combo_subject_list];
                             //group_subjects = group_subjects.split(",");
                            
                             purchased_combo_subject_list.forEach(element=>{
                                combo_subjects_ary[element].split(",").forEach(element_inner=>{
                                    //console.log(element_inner,element);
                                    combo_subjects_details[element].subject_id = Number(element_inner);
                                    combo_subjects_details[element].subject_name = subject_name_ary[element_inner];
                                    //console.log(combo_subjects_details[element]);
                                    interm_subjects_list.push(JSON.parse(JSON.stringify(combo_subjects_details[element])));
                                    
                                })
                            })
                        
                            subjects_list = interm_subjects_list;
                            }    
                          
                                                        ///////////////////// NEW SECTION FOR MULTIPLE SUBSCRIPTION  11-10-2023 //////
                           interm_subjects_list = [];
                           let final_subjects_list = [];
                           let subjects_list_ary = [];
                           let subjectswise_set_count = [];
                           let subjectswise_module_count = [];
                           let subjectswise_mock_count = [];
                           let exam_completed_module_completed = [];
                           let exam_completed_mock_completed = [];
                           let exam_completed_percentage = 0;
                                        let module_current_no = 0;
                                        let mock_current_no = 0;
                                        let casestudy_current_no = 1;
                                        let max_chapter_select = 0;
                                        let max_chapter_select_mock = 0;
                                        
                                    

                           subjects_list.forEach(element=>{
                            subjectswise_module_count[element.subject_id] = 0;
                            subjectswise_mock_count[element.subject_id] = 0;
                           })

                           subjects_list.forEach(element=>{
                            if(subjectswise_set_count[element.subject_id] == null){
                                subjectswise_set_count[element.subject_id] = [];
                            }
                            
                            if(!subjects_list_ary.includes(element.subject_id)){
                                subjects_list_ary.push(element.subject_id);
                                subjectswise_set_count[element.subject_id] = JSON.parse(element.set_count);
                                if(element.module_count > 0){
                                    subjectswise_module_count[element.subject_id] = element.module_count;
                                }
                                if(element.mock_count > 0){
                                    subjectswise_mock_count[element.subject_id] = element.mock_count;
                                }
                                interm_subjects_list.push(element);
                            }else{
                                if(element.module_count > 0){
                                    subjectswise_module_count[element.subject_id] = element.module_count;
                                }
                                if(element.mock_count > 0){
                                    subjectswise_mock_count[element.subject_id] = element.mock_count;
                                }
                                subjectswise_set_count[element.subject_id] = JSON.parse(element.set_count);
                            }
                           });

                           
                           interm_subjects_list.forEach(async element=>{
                            let total_chapters = 0;
                            let subjects_ary = [];
                                        if(typeof group_subjects_ary[element.subject_id]!='undefined' && group_subjects_ary[element.subject_id].length > 0){ 
                                            subjects_ary = (group_subjects_ary[element.subject_id]).split(",");
                                        }else{
                                            subjects_ary = single_subjects_ary;
                                        }
                            let exam_completed_percentage = 0;
                                        let module_current_no = 0;
                                        let mock_current_no = 0;
                                        let casestudy_current_no = 1;
                                        let max_chapter_select = 0;
                                        let max_chapter_select_mock = 0;
                                        
                                        if(typeof group_subjects_ary[element.subject_id]!='undefined' && group_subjects_ary[element.subject_id].length > 0)
                                        {
                                            subjects_ary.forEach(element=>{
                                                if(typeof chapter_ary[element] != 'undefined' && chapter_ary[element].length > 0){
                                                    total_chapters += chapter_ary[element].length;
                                                }
                                            })
                                        }else{
                                            
                                                if(typeof chapter_ary[element.subject_id] != 'undefined' && chapter_ary[element.subject_id].length > 0){
                                                    total_chapters = chapter_ary[element.subject_id].length;

                                                }
                                        }
                            element.total_chapters = total_chapters;
                          
                            let total_exam_completed = exam_completed[element.subject_id];
                                        exam_completed_percentage = Math.ceil((total_exam_completed/total_chapters)*100);
                                        let no_module = 0;
                                        let no_casestudy = 0; 
                                        if( element.casestudy_count > 0){
                                            no_casestudy = 1;
                                        }
                                       
                                        //no_module = element.module_count;
                                        
                                        no_module = subjectswise_module_count[element.subject_id];
                                        if(no_module > 0){
                                            if(exam_completed_percentage != null && exam_completed_percentage >= module_1)
                                            {
                                                module_current_no = 1;
                                            }
                                        }
                                        let no_mock = 0; 
                                        if( element.mock_count == 1){
                                            no_mock = 2;
                                        }

                                        if(element.mock_count > 0){
                                            
                                            if(exam_completed_percentage >= mock_1 && exam_completed_subjects_module[element.subject_id] >= 1)
                                            {
                                                mock_current_no = 1;
                                            }
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 1){
                                            module_current_no = 2;
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 2){
                                            module_current_no = 3;
                                        }
                                        if(exam_completed_subjects_module[element.subject_id] == 3){
                                            module_current_no = 4;
                                        }
                                        if(exam_completed_subjects_mock[element.subject_id] == 1){
                                            mock_current_no = 2;
                                        }
                                        if(exam_completed_subjects_mock[element.subject_id] == 2){
                                            mock_current_no = 3;
                                        }
                                        
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 1){
                                            casestudy_current_no = 2;
                                        }
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 2){
                                            casestudy_current_no = 3;
                                        }
                                        if(exam_completed_subjects_casestudy[element.subject_id] == 3){
                                            casestudy_current_no = 0;
                                        }
                                        //element.casestudy_current_no = casestudy_current_no;
                                        if(module_current_no == 1)
                                                {
                                                    max_chapter_select = Math.ceil(total_chapters * (module_1/100));
                                                }
                                                else if(module_current_no == 2)
                                                {
                                                    max_chapter_select = Math.ceil(total_chapters * ((module_2 - module_1)/100));
                                                }
                                                else if(module_current_no == 3)
                                                {
                                                    let max_chapter_select_1 = Math.ceil(total_chapters * (module_1/100));
                                                    let max_chapter_select_2 = Math.ceil(total_chapters * ((module_2 - module_1)/100));
                                                    max_chapter_select = total_chapters - (max_chapter_select_1 + max_chapter_select_2);
                                                }
                                                element.max_chapter_select = max_chapter_select;
                                                if(mock_current_no == 1)
                                                {
                                                    max_chapter_select_mock = Math.ceil(total_chapters * (mock_1/100));
                                                    element.max_chapter_select_mock = max_chapter_select_mock;
                                                }
                                                else if(mock_current_no == 2)
                                                {
                                                    let max_chapter_select_mock_1 = Math.ceil(total_chapters * (mock_1/100));
                                                    element.max_chapter_select_mock = total_chapters - max_chapter_select_mock_1;
                                                }
                                                
                                                for(let i = 1; i <= exam_completed_subjects_module[element.subject_id];i++){
                                                    exam_completed_module_completed.push({module_no:i,subject_id:element.subject_id,exam_unique_id:exam_completed_subjects_module_record[element.subject_id]});
                                                }
                                                for(let i = 1; i <= exam_completed_subjects_mock[element.subject_id];i++){
                                                    
                                                    exam_completed_mock_completed.push({mock_no:i,subject_id:element.subject_id,exam_unique_id:exam_completed_subjects_mock_record[element.subject_id]});
                                                }

                                
                                            
                             if(module_interm_ary[element.subject_id] > 0)
                             {
                                module_interm = module_interm_ary[element.subject_id];
                             }else{
                                module_interm = 0;
                             }   
                             if(mock_interm_ary[element.subject_id] > 0)
                             {
                                mock_interm = mock_interm_ary[element.subject_id];
                             }else{
                                mock_interm = 0;
                             }             
                            element.exam_completed_percentage = exam_completed_percentage;       
                            element.set_count = subjectswise_set_count[element.subject_id].sort();
                            element.module_count = no_module;
                            element.mock_count = subjectswise_mock_count[element.subject_id];
                            element.exam_completed_module = exam_completed_module_completed;                    
                            element.exam_completed_mock = exam_completed_mock_completed;
                            element.casestudy_count = no_casestudy;  
                            element.module_interm = module_interm;
                            element.mock_interm =  mock_interm;  
                            element.mock_current_no = mock_current_no;
                            element.module_current_no = module_current_no;             
                            final_subjects_list.push(element);
                           })
                         
                            resolve({status:200,msg:"Subject list which are purchased",data:final_subjects_list})
                        } 
                        else{
                            reject({status:200,msg:"Subscribed subject list not found"});
                        }        
            });

        }).then((value) => {
    
            return value;
            //
        }).catch((err) => {
            return err;
            //console.error(err);
        });
        
    return result;        

}
async function getsubjectslist_old_21_02_2023(data){
    let subjects_list = [];
    let total_setcompleted = 0;
    let total_modulecompleted = 0;
    let total_mockcompleted = 0;
    let exam_completed_percentage = 0;
    let chapter_ary = []; 
    let exam_completed = [];
    let exam_completed_module = [];
    let exam_completed_mock = [];
    let resultdata = [];
    let exam_completed_subjects = [];
    let exam_completed_subjects_module = [];
    let exam_completed_subjects_mock = [];
    
        await db.query("select subject_id, count(*) as total_exam_completed from `exam_completed` where `exam_type` = 1 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
           // console.log(completed_exam[0].total_exam_completed, element.total_chapter)
                //console.log(element)
                exam_completed_subjects.push(element.subject_id);              
                //resolve({exam_completed_percentage:exam_completed_percentage});
                exam_completed.push({"subject_id":element.subject_id,"total_exam_completed":element.total_exam_completed});
                //console.log(chapter_ary)  
        })
     //console.log(exam_completed);

        await db.query("select branch_id as subject_id,branch_id, count(*) as total_chapter from `chapters` left join `subjects` on `subjects`.`id` = `chapters`.`branch_id` where `chapters`.`is_deleted` = 0 GROUP by chapters.branch_id")
        .then((total_chapter_result)=>{
            total_chapter_result.forEach(element2=>{
                chapter_ary.push({"subject_id":element2.subject_id,"total_chapters":element2.total_chapter});
                //console.log(element) exam_completed_percentage = Math.floor((completed_exam[0].total_exam_completed/element.total_chapter)*100);       
            })
        })
        //console.log(chapter_ary)
        //console.log(exam_completed_subjects)
    })

    await db.query("select subject_id, count(*) as total_exam_completed from `exam_completed` where `exam_type` = 2 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
           // console.log(completed_exam[0].total_exam_completed, element.total_chapter)
                //console.log(element)
                exam_completed_subjects_module.push(element.subject_id);              
                
        })
    })

    //////////////////////// Exam Completed MODULE LIST //////////////////////////////
   await db.query("select * from `exam_completed` where `exam_type` = 2 and `student_id`= "+data.student_id)
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
                //exam_completed_subjects_module.push(element.subject_id);              
                exam_completed_module.push({"subject_id":element.subject_id,"module_no":element.exam_set_counter,"exam_unique_id":element.exam_unique_id});
               
        })
    })

        await db.query("select * from `exam_completed` where `exam_type` = 3 and `student_id`= "+data.student_id)
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
                exam_completed_subjects_mock.push(element.subject_id);              
                exam_completed_mock.push({"subject_id":element.subject_id,"mock_no":element.exam_set_counter,"exam_unique_id":element.exam_unique_id});
                
        })
    })
        await db.query("select subject_id, count(*) as total_exam_completed from `exam_completed` where `exam_type` = 3 and `student_id`= "+data.student_id+" group by subject_id")
        .then(async completed_exam=>{
            completed_exam.forEach(element=>{
           // console.log(completed_exam[0].total_exam_completed, element.total_chapter)
                //console.log(element)
                exam_completed_subjects_mock.push(element.subject_id);              
               
              
        })
    })
let final_result = [];
    chapter_ary.forEach(async element_inner1=>{
        let subject_id = element_inner1.subject_id;
        await db.query("SELECT * from `subjects` WHERE JSON_CONTAINS(`group_subjects`, '"+subject_id+"', '$')")
        .then(response=>{
            if(response.length > 0)
            {
                subject_id = response[0].id;
            }
        })
        let total_chapters = element_inner1.total_chapters;
        if(!exam_completed_subjects.toString().includes(subject_id)){
            final_result.push({"subject_id":subject_id,"exam_completed_percentage":0});
        }else{
        exam_completed.forEach(async element_inner2=>{
            let subject_id_2 = element_inner2.subject_id;
            await db.query("SELECT * from `subjects` WHERE JSON_CONTAINS(`group_subjects`, '"+subject_id_2+"', '$')")
        .then(response=>{
            if(response.length > 0)
            {
                subject_id_2 = response[0].id;
            }
        })
            let total_exam_completed = element_inner2.total_exam_completed;
            if(subject_id == subject_id_2){

                exam_completed_percentage = Math.floor((total_exam_completed/total_chapters)*100);
                    final_result.push({"subject_id":subject_id_2,"exam_completed_percentage":exam_completed_percentage,"total_chapters":total_chapters});
            }   
        })
    }
    })
    //console.log(final_result)
    //return;
    let result = await new Promise((resolve, reject) => {
        db.query("select * from `purchased_subscribtions` where `student_id`= "+data.student_id+" and is_active = 1")
        .then((result,err)=>{
            let calculation_counter = 0;
           let counter = 0;
           if(result.length > 0){
            result.forEach(element_outer=>{          
                        const subscription_details = JSON.parse(element_outer.subscription_details);
                        //console.log(subscription_details)
                        //async.eachSeries(subscription_details,function(element){
                            subscription_details.forEach( element=>{
                                    if(element.exam_category_id.toString() === process.env.SCHOLASTIC && element.only_elibrary === 0){
                                        
                                        
                                        let exam_completed_module_completed = [];
                                        let exam_completed_mock_completed = [];

                                   
                                        let mock_current_no = 0;
                                        let max_chapter_select = 0;
                                        let max_chapter_select_mock = 0;
                                        final_result.forEach(element_inner1=>{
                                            let exam_completed_percentage = parseInt(element_inner1.exam_completed_percentage);                                                
                                            let no_module = 0; 
                                            let module_current_no = 0;
                                            if( element.module_count == 1){
                                                no_module = 3;
                                            }
                                            if(no_module > 0){
                                            if(exam_completed_percentage >= 40)
                                            {
                                                module_current_no = 1;
                                            }
                                        }
                                        
                                        let no_mock = element.no_mock;
                                        if(element.no_mock > 0)
                                        {
                                            no_mock = 2;
                                        }
                                        if(element.no_mock > 0){
                                            
                                            if(exam_completed_percentage >= 60)
                                            {
                                                mock_current_no = 1;
                                            }
                                           
                                        }
            
                                            if(element_inner1.subject_id === element.subject_id)
                                            {                                    
                                                exam_completed_module.forEach(element_inner2=>{
                                                    if(element_inner2.subject_id === element.subject_id)
                                                    {
                                                        //console.log(element_inner2.module_no)
                                                        module_current_no = element_inner2.module_no + 1;
                                                        exam_completed_module_completed.push(element_inner2);
                                                    }
                                                })
                                                exam_completed_mock.forEach(element_inner2=>{
                                                    if(element_inner2.subject_id === element.subject_id)
                                                    {
                                                        mock_current_no = element_inner2.mock_no + 1;
                                                        exam_completed_mock_completed.push(element_inner2);
                                                    }
                                                })
                                             
                                                if(module_current_no == 1){
                                                    mock_current_no = 0;
                                                }
                                                else if(module_current_no == 2){
                                                    mock_current_no = 1;
                                                }

                                                if(module_current_no == 1)
                                                {
                                                    //max_chapter_select = Math.floor(element_inner1.total_chapters);
                                                }
                                                else if(module_current_no == 2)
                                                {
                                                   // max_chapter_select = Math.floor(element_inner1.total_chapters * 0.3);
                                                }
                                                else if(module_current_no == 3)
                                                {
                                                    
                                                   // max_chapter_select = Math.floor(element_inner1.total_chapters * 0.3);
                                                }

                                                if(mock_current_no == 1)
                                                {
                                                    max_chapter_select_mock = Math.floor(element_inner1.total_chapters * 0.6);
                                                }
                                                else if(mock_current_no == 2)
                                                {
                                                    max_chapter_select_mock = Math.floor(element_inner1.total_chapters * 0.4);
                                                }
                                                //console.log(element_inner1.total_chapters)
                                                
                                               
                                                //console.log(max_chapter_select)
                                                //console.log(no_module)
                                                subjects_list.push({subject_name:element.subject_name,subject_id:element.subject_id,
                                                exam_completed_percentage:exam_completed_percentage,module_count:no_module,mock_count:no_mock,
                                                set_count:element.no_set,module_current_no:module_current_no,mock_current_no:mock_current_no,
                                                exam_completed_module:exam_completed_module_completed,exam_completed_mock:exam_completed_mock_completed,
                                            max_chapter_select:max_chapter_select,max_chapter_select_mock:max_chapter_select_mock });
                                            }
                                        })
                                       
                                      
                                    }
                                  
                            })

                         
                            
                })
               //console.log(subjects_list)
               resolve({status:200,msg:"Subject list which are purchased",data:subjects_list})
             }
             else{
                reject({status:200,msg:"Subscribed subject list not found"});
             }
        })
        

    }).then((value) => {
    
          return value;
          //
      }).catch((err) => {
          return err;
          //console.error(err);
      });
      
  return result;
}


async function get_purchased_subscription_details(data){
    
    let result = await new Promise((resolve, reject) => {
        const exam_unique_id = Date.now()+"_"+data.student_id;
        db.query("select * from `purchased_subscribtions` where `student_id` = "+data.student_id+" and is_active = 1")
        .then((result,err)=>{
            let scholatic_details = [];
            let competive_details = [];
            let elibrary_details_com = [];
            let elibrary_details_sch = [];

            let scholatic_details_purchase = [];
            let competive_details_purchase = [];
            let elibrary_details_purchase = [];
            let elibrary_details_purchase_sch = [];
            let elibrary_details_purchase_com = [];

            let counter1 = 0;
            let counter2 = 0;
            let counter3 = 0;
            let counter4 = 0;
            result.forEach(element=>{
                let subscription_details = [];
                subscription_details = JSON.parse(element.subscription_details);
                subscription_details.forEach(element_inner=>{
                    if (element_inner.has_elibrary == 1) {
                        if (element_inner.only_elibrary == 0) {
                            if(element_inner.category_short_code == 'COM' && element_inner.exam_type_id == data.exam_type){
                                competive_details[counter1] = element_inner.subscription_id;
                                competive_details_purchase[counter1] = element_inner;
                                counter1++;
                            }
                            if(element_inner.category_short_code == 'SCH'){
                                scholatic_details[counter2] = element_inner.subject_id;
                                scholatic_details_purchase[counter2] = element_inner;
                                counter2++;
                            }
                        }
                        else{
                            if(element_inner.category_short_code == 'SCH'){
                                elibrary_details_sch[counter3] = element_inner.subject_id;
                                if(element_inner.only_elibrary!=0 || element_inner.has_library!=0){
                                    elibrary_details_purchase_sch[counter3] = element_inner;
                                }
                            counter3++;
                            }
                            if(element_inner.category_short_code == 'COM' && element_inner.exam_type_id == data.exam_type){
                                elibrary_details_com[counter4] = element_inner.subscription_id;
                                if(element_inner.only_elibrary!=0 || element_inner.has_library!=0){
                                    elibrary_details_purchase_com[counter4] = element_inner;
                                }
                            counter4++;
                            }
                        }
                        
                    }
                    else{
                        if(element_inner.category_short_code == 'COM' && element_inner.exam_type_id == data.exam_type){
                            competive_details[counter1] = element_inner.subscription_id;
                            competive_details_purchase[counter1] = element_inner;
                            if(element_inner.only_elibrary!=0 || element_inner.has_library!=0){
                                elibrary_details_purchase_com[counter1] = element_inner;
                            }
                            elibrary_details_com[counter1] = element_inner.subscription_id;
                            counter1++;
                        }
                        if(element_inner.category_short_code == 'SCH'){
                            scholatic_details[counter2] = element_inner.subject_id;
                            scholatic_details_purchase[counter2] = element_inner;
                            if(element_inner.only_elibrary!=0 || element_inner.has_library!=0){
                                elibrary_details_purchase_sch[counter2] = element_inner;
                                elibrary_details_sch[counter2] = element_inner.subject_id;
                            }
                            counter2++;
                        }
                    }
                });
            });
    
            let response = {scholatic:scholatic_details,competive:competive_details,elibrary_com:elibrary_details_com,
                scholatic_purcase:scholatic_details_purchase,competive_purchase:competive_details_purchase,
                elibrary_purchase:elibrary_details_purchase_sch,elibrary:elibrary_details_sch,
                elibrary_purchase_com:elibrary_details_purchase_com}
                
            resolve(response);
        })
        

    }).then((value) => {
        //console.log(value);
          return value;
          //
      }).catch((err) => {
          return err;
          //console.error(err);
      });
      
  return result;
}

async function getpurchased_competitivelist(data){
    
    let result = await new Promise(async(resolve, reject) => {
        const exam_unique_id = Date.now()+"_"+data.student_id;
        let interm_count = 0;

    await db.query("select * from `exam_type` where `type_name` = '"+data.exam_type+"'")
    .then(async result_data=>{  
        
        await db.query("select * from `interm_storeexamdata` where `exam_type` = "+result_data[0].id+" and `exam_category_id` = 2 and `student_id` = "+data.student_id)
        .then(result=>{
            if(result.length >0)
            {
                interm_count = result[0].total_attempts;
            }
        })
    })  

        let completed_exam = [];
        let completed_exam_other = [];
        let query = "";
        let query2 = "";
        if(data.exam_type == 'NTSE'){
            query = "select subscription_id,count(*) as total_exam_completed,exam_subtype_id from `exam_completed_competitive` where `exam_type` = '"+data.exam_type+"' and `student_id` = "+data.student_id+" and exam_subtype_id = "+data.subtype_id+" group by exam_subtype_id";
            if(data.subtype_id == 1){
                data.subtype_id_other = 2;
            }else{
                data.subtype_id_other = 1;
            }
            query2 = "select subscription_id,count(*) as total_exam_completed,exam_subtype_id from `exam_completed_competitive` where `exam_type` = '"+data.exam_type+"' and `student_id` = "+data.student_id+" and exam_subtype_id = "+data.subtype_id_other+" group by exam_subtype_id order by id desc";
        }else{
            query = "select subscription_id,count(*) as total_exam_completed,exam_subtype_id from `exam_completed_competitive` where `exam_type` = '"+data.exam_type+"' and `student_id` = "+data.student_id+" group by exam_type";
        }
        await db.query(query)
        .then((result,err)=>{
            result.forEach(element=>{
                completed_exam.push({"subscription_id":element.subscription_id,"total_exam_completed":element.total_exam_completed,"exam_subtype":element.exam_subtype_id})
            })
        })
    
    if(data.exam_type == 'NTSE'){    
        await db.query(query2)
        .then((result,err)=>{
            result.forEach(element=>{
                completed_exam_other.push({"subscription_id":element.subscription_id,"total_exam_completed":element.total_exam_completed,"exam_subtype":element.exam_subtype_id})
            })
        })
    }
        await db.query("select * from `purchased_subscribtions` where `student_id` = "+data.student_id+" and is_active = 1")
        .then((result,err)=>{
            let scholatic_details = [];
    let competive_details = [];
                let counter1 = 0;
                let counter2 = 0;
                let total_set_no = 0;
            result.forEach(element=>{
                let subscription_details = [];
                subscription_details = JSON.parse(element.subscription_details);
                let is_active = 0;
                    subscription_details.forEach(element_inner=>{
                  
                            if(element_inner.category == 'COMPETITIVE' && element_inner.type_name === data.exam_type){
                                total_set_no += Number(element_inner.no_set);
                                if(completed_exam.length > 0){
                                completed_exam.forEach(element_inner2=>{    
                                    
                                    if(completed_exam_other.length > 0){
                                        if((element_inner2.total_exam_completed < completed_exam_other[0].total_exam_completed)){
                                            is_active = 1;
                                        }
                                        if((element_inner2.total_exam_completed === completed_exam_other[0].total_exam_completed) && (data.subtype_id === 1)){
                                            is_active = 1;
                                        }
                                    }
                                    competive_details[counter1] = {"id":element_inner.subscription_id,"no_set":element_inner.no_set,current_exam_set:element_inner2.total_exam_completed + 1,is_active:is_active};
                                    
                                })
                            }else{
                                if(data.subtype_id == 2 && completed_exam_other.length > 0){
                                    is_active = 1;
                                }else{
                                    if(data.subtype_id == 1){
                                        is_active = 1;    
                                    }
                                }
                                competive_details[counter1] = {"id":element_inner.subscription_id,"no_set":element_inner.no_set,current_exam_set: 1,is_active:is_active};
                            }
                                counter1++;
                            }
                    })
            })
            let competive_details_final = [];
            let count_record = 0;
            competive_details.forEach(element=>{
                element.no_set = total_set_no;
                element.interm_count = interm_count;
               if(count_record < 1){ 
                competive_details_final.push(element);
                count_record++;
               }
            })
            let response = {status:200,msg:"Competititve subscribed details",competive:competive_details_final}
            resolve(response);
        })
        

    }).then((value) => {
        //console.log(value);
          return value;
          //
      }).catch((err) => {
          return err;
          //console.error(err);
      });
      
  return result;
}

async function list_scolastic_subjects(data){
    let response = {};
    let subjects_list = [];
    const result = await db.query(`select * from purchased_subscribtions where student_id = `+data.student_id+``);
    if (result.length > 0) {
        result.forEach(element => {
            let subscription_details = [];
            subscription_details = JSON.parse(element.subscription_details);
           
            subscription_details.forEach(element_inner => {
                if (element_inner.hasOwnProperty('only_elibrary')) {
                    if (element_inner.only_elibrary == 1 && element_inner.category == 'SCHOLASTIC') {
                        subjects_list.push({subject_id: element_inner.subject_id, subject_name: element_inner.subject_name});
                    }
                   else if (element_inner.has_library == 1 && element_inner.category == 'SCHOLASTIC') {
                            subjects_list.push({subject_id: element_inner.subject_id, subject_name: element_inner.subject_name});
                        }
                    
                }else{
                    subjects_list.push({subject_id: element_inner.subject_id, subject_name: element_inner.subject_name});
                }
            });
        });
        return response = {status: 200, msg: "Subject List", data: subjects_list};
    }
    else{
        return response = {status: 200, msg: "No data found.", data:[]};
    }
}

async function list_competitive_library(data){
    let response = {};
    let subjects_list = [];
    let is_subscribe_ntse = 0;
    let is_subscribe_nstse = 0;
    let type_id = 0;
    const exam_type_list = await db.query(`select * from exam_type where status = 1 and is_deleted = 0`);

    const result = await db.query(`select * from purchased_subscribtions where student_id = `+data.student_id+``);
    if (result.length > 0) {
        result.forEach(element => {
            let subscription_details = [];
            subscription_details = JSON.parse(element.subscription_details);
           
            subscription_details.forEach(element_inner => {
                if (element_inner.hasOwnProperty('only_elibrary') && element_inner.category == 'COMPETITIVE') {
                    if (element_inner.only_elibrary == 1 && element_inner.category == 'COMPETITIVE') {
                        
                        if(element_inner.type_name == 'NTSE'){
                            is_subscribe_ntse = 1;
                        }
                        if(element_inner.type_name == 'NSTSE'){
                            is_subscribe_nstse = 1;
                        }
                    }
                   else if (element_inner.has_library == 1 && element_inner.category == 'COMPETITIVE') {
                    if(element_inner.type_name == 'NTSE'){
                        is_subscribe_ntse = 1;
                    }
                    if(element_inner.type_name == 'NSTSE'){
                        is_subscribe_nstse = 1;
                    }
                    
                }else if(element_inner.category == 'COMPETITIVE'){
                    if(element_inner.type_name == 'NTSE'){
                        is_subscribe_ntse = 1;
                    }
                    if(element_inner.type_name == 'NSTSE'){
                        is_subscribe_nstse = 1;
                    }    
                }
            }
            });
        });
        let finallyary = [];
        if(exam_type_list.length > 0)
        {
            exam_type_list.forEach(element=>{
                if(element.short_code =='NT'){
                    element.is_subscribe = is_subscribe_ntse;
                }
                if(element.short_code =='NS'){
                    element.is_subscribe = is_subscribe_nstse;
                }
                delete element.created_at;
                delete element.updated_at;
                finallyary.push(element);
            })
        }

        return response = {status: 200, msg: "Competitive e-library List", data: finallyary};
    }
    else{
        return response = {status: 200, msg: "No data found.", data:[]};
    }
}

async function delete_allsubscribtion_bystudentid(data){
    let result = await new Promise(async (resolve, reject) => {
        await db.query("delete from `purchased_subscribtions` where `student_id` = "+data+"")
        .then((result,err)=>{
            if(result.affectedRows > 0){
                response = {status: 200, msg: "All subscribtion details deleted successfully"}
                resolve(response);
            }else{
                reject({status:200,msg:"No record deleted",error:err});
            }
        })
    }).then((value) => {
        //console.log(value);
          return value;
          //
      }).catch((err) => {
          return err;
          //console.error(err);
      });
      
  return result;
}

async function get_studentlist_notsubscribe_library(){
    let result = await new Promise(async (resolve, reject) => {
        /*let library_notsubscribed_students = [];
        let already_subscribed_students = [];
        await db.query("select * from `purchased_subscribtions` where is_active = 1")
        .then((result,err)=>{
            if(result.length > 0){
                result.forEach(element => {     
                    let subscription_details = JSON.parse(element.subscription_details);
                    subscription_details.forEach(element_inner=>{
                        if(element_inner.has_library == 1 || element_inner.only_elibrary == 1){
                            already_subscribed_students.push(element.student_id);
                        }
                    })
                })
                result.forEach(element => {     
                let subscription_details = JSON.parse(element.subscription_details);
                subscription_details.forEach(element_inner=>{
                     if(!already_subscribed_students.includes(element.student_id) && !library_notsubscribed_students.includes(element.student_id)){
                        library_notsubscribed_students.push(element.student_id);
                    }
                })
               });
              
                response = {status: 200, msg: "Library not Subscribed students list",student_list:library_notsubscribed_students}
                resolve(response);
            }else{
                reject({status: 200,msg:"Error in query. Please check",error:err});
            }
        });*/
        response = {status: 200, msg: "Library not Subscribed students list"}
                resolve(response);
    }).then((value) => {
        //console.log(value);
          return value;
          //
      }).catch((err) => {
          return err;
          //console.error(err);
      });
      
  return result;
}
module.exports = {
    student_purchased_subscription,
    getcartstlist,
    getsubjectslist,
    get_purchased_subscription_details,
    getpurchased_competitivelist,
    list_scolastic_subjects,
    list_competitive_library,
    delete_allsubscribtion_bystudentid,
    get_studentlist_notsubscribe_library,
    getsubjectslist_groupwise
}
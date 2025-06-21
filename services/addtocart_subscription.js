const db = require('./db');

async function addtocart(data){
    let result = await new Promise(async (resolve, reject) => {
        
        if(data.class =='' || data.class== undefined || data.class== 'undefined')
        {
            data.class = 0;
        }
        if(data.no_casestudy =='' || data.no_casestudy== undefined || data.no_casestudy== 'undefined')
        {
            data.no_casestudy = 0;
        }
        if (data.only_elibrary == undefined) {
            only_elibrary = 0;
        }
        else{
            only_elibrary = data.only_elibrary;
        }
        if (data.has_library == undefined || data.has_library == 0) {
            has_library = 0;
        }
        else{
            has_library = data.has_library;
        }
        let payment_amount = 0;
        if(data.exam_category_id == 1)
        {
            await db.query("select * from `exam_scholastic_subscribtion_master` where `id` = "+data.subscription_id)
            .then(result=>{
                result.forEach(element=>{
                 let package_details = JSON.parse(element.package_details);
                    package_details.forEach(element_inner=>{
                        if(Number(element_inner.set) == data.no_set.length && element_inner.module == data.no_module && element_inner.mock == data.no_mock && element_inner.library == data.has_library && element_inner.case_studies == data.no_casestudy){
                            payment_amount = element_inner.price;
                        }
                    })
                })
            })
        }
        if(data.exam_category_id == 2)
        {
            await db.query("select * from `exam_competitive_subscribtion_master` where `id` = "+data.subscription_id)
            .then(result=>{
                result.forEach(element=>{
                        if(element.set_count == data.no_set && element.exam_type_id == data.exam_type_id){
                            payment_amount = element.amount;
                        }
                        if(data.has_library == 1){
                            payment_amount += element.library_price;
                        }
                })
            })
        }
        if(data.exam_category_id == 3){
            await db.query("select * from `integrated_subscription_master` where `id` = "+data.subscription_id)
            .then(result=>{
                result.forEach(element=>{
                    payment_amount += element.price;
                })
            })
        }

        await db.query("select * from `e_library_subscription_master` where `exam_category` = "+data.exam_category_id+" and  `id` = "+data.subscription_id)
            .then(result=>{
                result.forEach(element=>{
                        if(data.only_elibrary == 1){
                            payment_amount = element.library_price;
                        }
                })
            })

        data.cart_amount = payment_amount;
        //let payment_amount = data.cart_amount;
        
        await db.query("select purchased_subscribtions_details.*,exam_competitive_subscribtion_master.amount,exam_competitive_subscribtion_master.library_price from `purchased_subscribtions_details` left join exam_competitive_subscribtion_master on exam_competitive_subscribtion_master.id = purchased_subscribtions_details.subscription_id where `purchased_subscribtions_details`.`student_id` = "+data.student_id+" and `purchased_subscribtions_details`.`exam_category_id` = 2 and `purchased_subscribtions_details`.`exam_type_id` = "+data.exam_type_id+" order by purchased_subscribtions_details.id desc")
        .then(result=>{
            if(result.length > 0)
            {
                if(data.exam_category_id == 2){
                        if(result[0].has_library == 1 && result[0].only_library == 0)
                        {
                            
                            //payment_amount = (data.cart_amount - result[0].amount);
                            payment_amount = (data.cart_amount);
                            has_library = 1;
                        }
                        else{
                            //payment_amount = data.cart_amount - result[0].amount;
                            payment_amount = data.cart_amount;
                        }
                    }
            }
        })


        await db.query("INSERT INTO `addtocart_subscription`(`student_id`,`exam_type_id`, `class`, `exam_category_id`, `subscription_id`,`no_set`,`no_module`, `no_mock`, `no_casestudy`, `cart_amount`,`payment_amount`, `only_elibrary`,`has_library`) VALUES ('"+data.student_id+"','"+data.exam_type_id+"','"+data.class+"','"+data.exam_category_id+"','"+data.subscription_id+"','"+JSON.stringify(data.no_set)+"','"+data.no_module+"','"+data.no_mock+"','"+data.no_casestudy+"','"+payment_amount+"','"+payment_amount+"','"+only_elibrary+"','"+has_library+"')")
        .then((result,err)=>{
            if(result.affectedRows === 1){
                response = {status: 200, msg: "Cart added successfully"}
                resolve(response);
            }else{
                reject({msg:"Error in query. Please check",error:err});
            }
        });
        

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
    let total = 0;
    let subtotal = 0;
    let gst_rate = 18;
    let gst_amount = 0;
    let total_count = 0;
    let combo_subject_ids = [];
    let combo_subjects_details = [];
    await db.query("select * from subjects where is_deleted = 0 and status = 1 and group_exist = 3 and board_id = "+data.board_id+" and exam_category_id = 1")
    .then(result=>{
      result.forEach(Element=>{
        if(combo_subject_ids[Element.id] == null){
    
            combo_subject_ids[Element.id] = [];
        }
        let com_subjects = Element.group_subjects.split(",");
        com_subjects.forEach(Element_inner=>{
         
          combo_subject_ids[Element.id].push(parseInt(Element_inner));
            combo_subjects_details.push(parseInt(Element_inner));
          
        })
      })
    })

    let result = await new Promise((resolve, reject) => {
        db.query("select addtocart_subscription.*,exam_categories.category,exam_categories.short_code as category_short_code,exam_type.type_name,boards.name as board_name from \
        `addtocart_subscription` left join exam_categories on exam_categories.id = addtocart_subscription.exam_category_id \
        left join exam_type on addtocart_subscription.exam_type_id = exam_type.id left join boards on addtocart_subscription.exam_type_id = boards.id where `student_id` = "+data.student_id)
        .then(async (result,err)=>{
            if(result.length > 0){
                    const exam_intergrated_master = await db.query("select integrated_subscription_master.* from `integrated_subscription_master` where integrated_subscription_master.is_deleted = 0 and integrated_subscription_master.status = 1");
                    const exam_competitive_master = await db.query("select exam_competitive_subscribtion_master.* from `exam_competitive_subscribtion_master` where exam_competitive_subscribtion_master.is_deleted = 0 and exam_competitive_subscribtion_master.status = 1");
                    const exam_scholastic_master = await db.query("select exam_scholastic_subscribtion_master.*,subjects.name as subject_name from `exam_scholastic_subscribtion_master`\
                    left join subjects on exam_scholastic_subscribtion_master.subject_id = subjects.id where exam_scholastic_subscribtion_master.is_deleted = 0 and exam_scholastic_subscribtion_master.status = 1");
                    const e_library_subscription_master = await db.query(`select e_library_subscription_master.*,exam_type.type_name,boards.name as board_name, subjects.name as subject_name from e_library_subscription_master\
                    left join exam_type on exam_type.id = e_library_subscription_master.exam_type_id left join boards on e_library_subscription_master.board_id = boards.id left join subjects on e_library_subscription_master.subject_id = subjects.id where e_library_subscription_master.is_deleted = 0 and e_library_subscription_master.status = 1`);
                    let finalresult = [];
                    var counter = 0;
                    result.forEach(element => {
                        if (element.only_elibrary == 1) {
                            e_library_subscription_master.forEach(element_inner_3=>{
                                if(element_inner_3.id === element.subscription_id)
                                {
                                    element.exam_type = element_inner_3.type_name;
                                    element.board_name = element_inner_3.board_name;
                                    element.subject_name = element_inner_3.subject_name;
                                    element.subject_id = element_inner_3.subject_id;
                                    if(combo_subject_ids[element_inner_3.subject_id] != undefined)
                                    {
                                        element.combo_subject_ids = combo_subject_ids[element_inner_3.subject_id];
                                    }
                                    else{
                                        element.combo_subject_ids = [element_inner_3.subject_id];
                                    }
                                }
                            });
                            finalresult[counter] = element;
                            counter++;
                        }
                        else{
                            if(element.exam_category_id == 1){
                                exam_scholastic_master.forEach(element_inner_1=>{
                                    if(element_inner_1.id === element.subscription_id)
                                    {
                                        element.board_name = element_inner_1.board_name;
                                        element.subject_name = element_inner_1.subject_name;
                                        element.subject_id = element_inner_1.subject_id;
                                        if(combo_subject_ids[element_inner_1.subject_id] != undefined)
                                        {
                                            element.combo_subject_ids = combo_subject_ids[element_inner_1.subject_id];
                                        }
                                        else{
                                            element.combo_subject_ids = [element_inner_1.subject_id];
                                        }
                                    }
                                })
                                element.type_name = "";
                                finalresult[counter] = element;
                                counter++;
                            }
                            if(element.exam_category_id == 2){
                                exam_competitive_master.forEach(element_inner_2=>{
                                    if(element_inner_2.id === element.subscription_id)
                                    {
                                        element.exam_type = element_inner_2.type_name;
                                        element.subject_name = element_inner_2.subject_name;
                                        element.subject_id = element_inner_2.subject_id;
                                        if(combo_subject_ids[element_inner_2.subject_id] != undefined)
                                        {
                                            element.combo_subject_ids = combo_subject_ids[element_inner_2.subject_id];
                                        }
                                        else{
                                            element.combo_subject_ids = [element_inner_2.subject_id];
                                        }
                                    }
                                })
                                
                                finalresult[counter] = element;
                                counter++;
                            }
                            if(element.exam_category_id == 3){
                                exam_intergrated_master.forEach(element_inner_2=>{
                                    if(element_inner_2.id === element.subscription_id)
                                    {
                                        element.exam_type = element_inner_2.integrated_name;
                                        element.subject_name = element_inner_2.subject_name;
                                        element.subject_id = element_inner_2.subject_id;
                                    }
                                })
                                
                                finalresult[counter] = element;
                                counter++;
                            }
                        }
                        subtotal += parseInt(element.cart_amount);
                    });
                    gst_amount = (subtotal * gst_rate)/100;
                    total = subtotal + gst_amount;
                    total_count = result.length;
                    resolve({status:200,msg:"Cart record found",data:finalresult,totalamount:{subtotal:subtotal,gst_amount:gst_amount,
                    gst_rate:gst_rate,total_count:total_count,total:total}});
            }else{
                reject({status: 200,msg:"No Cart Record Found",error:err});
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

async function delete_addtocart(data){
    let result = await new Promise((resolve, reject) => {
        db.query("delete from `addtocart_subscription` where `student_id` = "+data.student_id+" and `id` = '"+data.id+"'")
        .then((result,err)=>{
            if(result.affectedRows === 1){
                response = {status: 200, msg: "Product deleted successfully"}
                resolve(response);
            }else{
                reject({status:200,msg:"No cart record found",error:err});
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

async function delete_allcart(data){
    let result = await new Promise((resolve, reject) => {
        db.query("delete from `addtocart_subscription` where `student_id` = "+data.student_id)
        .then((result,err)=>{
            if(result.affectedRows > 0){
                response = {status: 200, msg: "All product deleted successfully"}
                resolve(response);
            }else{
                reject({status:410,msg:"No record deleted",error:err});
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

module.exports = {
    addtocart,
    getcartstlist,
    delete_addtocart,
    delete_allcart
}
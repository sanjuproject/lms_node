const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function storepattern(data) {
  let response = {};
  let status = config.errorStatus;
  let message = "Something went wrong, please try again later.";
  // board_ids come in comma separated value format i.e. 2,4,6,7
  const result = await db.query(
    `INSERT INTO question_pattern (name, short_code, exam_category_id, board_ids, marks) 
    VALUES ('`+data.name+`', '`+data.short_code+`', '`+data.exam_category_id+`', '`+data.board_ids+`', '`+data.marks+`')`
  );
  if (result.affectedRows) {
    status = config.successStatus;
    message = 'Question pattern added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}

async function getpattern() {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched question pattern";

  const board_details = await db.query(`select id,name from boards`);

  const patterns = await db.query(`select question_pattern.*, exam_categories.category as category_name from question_pattern left join exam_categories on 
  question_pattern.exam_category_id = exam_categories.id where question_pattern.is_deleted = 0`);
  for(var i in patterns) {

    const selected_boards = [];
    var boards = patterns[i].board_ids;
    boards = boards.split(",");
      for (var b in boards)
      {
        for(var k in board_details)
          {
            if(board_details[k].id == boards[b])
            {
              selected_boards.push(board_details[k].name);
            }
          }
      }
      patterns[i].boards = selected_boards;
    
  }  
  response = {status: status, msg: message, data: patterns};
  return response;
}

async function deletequestionpattern(data)
{
    const record_details = await db.query(`SELECT * FROM question_pattern WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No question pattern record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update question_pattern set is_deleted = 1 where id = '`+data.recid+`' `);
          message = "Question pattern record deleted successfully";
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

async function updatestatusquestionpattern(data)
{
    const record_details = await db.query(`SELECT * FROM question_pattern WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No question pattern record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update question_pattern set status = '`+data.status+`' where id = '`+data.recid+`' `);
          message = "Question pattern record status updated successfully";
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

module.exports = {
  storepattern,
  getpattern,
  deletequestionpattern,
  updatestatusquestionpattern
}
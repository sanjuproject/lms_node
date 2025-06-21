const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function storesetconfiguration(data) {
  let response = {};
  let status = config.errorStatus;
  let message = "Something went wrong, please try again later.";
  const result = await db.query(
    `INSERT INTO exam_set_configuration (question_pattern_id, type, question_no) 
    VALUES ('`+data.question_pattern_id+`', '`+data.type+`', '`+data.question_no+`')`
  );
  if (result.affectedRows) {
    status = config.successStatus;
    message = 'Configuration added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}

async function getsetconfiguration() {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched question patterns";
  const configuration = await db.query(`select * from exam_set_configuration`);
  response = {status: status, msg: message, data: configuration};
  return response;
}

module.exports = {
  storesetconfiguration,
  getsetconfiguration
}
/*const mysql = require('mysql2/promise');
const config = require('../config');

async function query(sql, params) 
{
  const pool = await mysql.createPool(config.db);
  const connection = await pool.getConnection();
  const [results, ] = await connection.execute(sql);
  //connection.end();
  return results;
}

module.exports = {
  query
}*/

const mysql = require('mysql2/promise');
const config = require('../config');

async function query(sql, params) {
  const connection = await mysql.createConnection(config.db);
  try {
    const [results] = await connection.execute(sql, params);  // Pass params to execute
    return results;
  } catch (error) {
    console.error('Error during query execution:', error);
    throw error;
  } finally {
    try {
      await connection.end();  // Await connection end
      //console.log('MySQL connection closed.');
    } catch (closeError) {
      console.error('Error closing MySQL connection:', closeError);
    }
  }
}

module.exports = {
  query
};

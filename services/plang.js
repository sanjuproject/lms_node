const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function list(page = 1)
{
  const offset = helper.getOffset(page, config.listPerPage);

  const rows = await db.query(
    `SELECT id, name, released_year, githut_rank, pypl_rank, tiobe_rank 
    FROM demotable LIMIT ${offset},${config.listPerPage}`
  );

  const data = helper.emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

async function create(pl)
{
    const result = await db.query(
      `INSERT INTO demotable 
      (name, released_year, githut_rank, pypl_rank, tiobe_rank) 
      VALUES ('` + pl.name + `', '` + pl.released_year + `', '` + pl.githut_rank + `', '` + pl.pypl_rank + `', '` + pl.tiobe_rank + `')`
    );

    let message = 'Error in creating programming language';
  
    if (result.affectedRows) {
      message = 'Programming language created successfully';
    }
  
    return {message};
}

async function update(id, pl)
{
    const result = await db.query(
      `UPDATE demotable 
      SET name="${pl.name}", released_year=${pl.released_year}, githut_rank=${pl.githut_rank}, 
      pypl_rank=${pl.pypl_rank}, tiobe_rank=${pl.tiobe_rank} 
      WHERE id=${id}` 
    );
  
    let message = 'Error in updating programming language';
  
    if (result.affectedRows) {
      message = 'Programming language updated successfully';
    }
  
    return {message};
}

async function remove(id)
{
    const result = await db.query(
      `DELETE FROM demotable WHERE id=${id}`
    );
  
    let message = 'Error in deleting programming language';
  
    if (result.affectedRows) {
      message = 'Programming language deleted successfully';
    }
  
    return {message};
  }

module.exports = {
  list,
  create,
  update,
  remove
}
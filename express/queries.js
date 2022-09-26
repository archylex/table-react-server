const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'tkdlccvwzqrial',
  host: 'ec2-3-214-2-141.compute-1.amazonaws.com',
  database: 'd9kschblbbghok',
  password: 'cba942f75136c6dcefea304ac6ae63cbf8855088e729b535fcae8797b51850e6',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  },
});

const ITEMS_ON_PAGE = 5;

function getFilter(column, condition, search) {
    let str = '';

    switch(condition) {
        case 'equals':
            if (column === '_name') {
                str = `${column}='${search}'`;
            } else {
                str = `${column}=${search}`;
            }
            break;
        case 'contains':
            if (column === '_name') {
                str = `${column} like '%${search}%'`;
            } else {
                str = `${column}::varchar(255) like '%${search}%'`;
            }
            break;
        case 'more':
            if (column === '_name') {
                str = `${column}>'${search}'`;
            } else {
                str = `${column}>${search}`;
            }
            break;
        case 'less':
            if (column === '_name') {
                str = `${column}<'${search}'`;
            } else {
                str = `${column}<${search}`;
            }
            break;
    }

    return str;
}

async function getDataByPage(page, sort, order, search, column, condition) {
    const startNumber = (page - 1) * ITEMS_ON_PAGE;
    const orderBy = (search == null || sort === '') ? '' : `ORDER BY ${sort} ${order}`;
    const filter = (search == null || search === '') ? '' : 'WHERE ' + getFilter(column, condition, search) ;
    const dataSql = `SELECT * FROM data ${filter} ${orderBy} LIMIT ${ITEMS_ON_PAGE} OFFSET ${startNumber}`;
    const countSql = `SELECT COUNT(*) AS _amount FROM data ${filter}`;

    try {
        const dataResponse = await pool.query(dataSql);
        const countResponse = await pool.query(countSql);
        console.log(countResponse.rows)
        return {
            "data": dataResponse.rows,
            "count": countResponse.rows[0]._amount
        };
    } catch (error) {
        console.log(error);
    }
}

async function getData (request, response) {
  console.log(request.query);

  const dataRes = await getDataByPage(request.query.page, request.query.sort, request.query.order, request.query.search, request.query.column, request.query.condition);

  const pages = Math.ceil(dataRes.count / ITEMS_ON_PAGE);
  const newData = {
    "pages": pages,
    "data": dataRes.data
  };

  response.status(200).json(newData);
}

module.exports = {
  getData
}



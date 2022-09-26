const http = require('http');
const fs = require('fs');
const Pool = require('pg').Pool

const PORT = process.env.PORT || 5000;

const ITEMS_ON_PAGE = 5;

const pool = new Pool({
    user: 'tkdlccvwzqrial',
    host: 'ec2-3-214-2-141.compute-1.amazonaws.com',
    database: 'd9kschblbbghok',
    password: 'cba942f75136c6dcefea304ac6ae63cbf8855088e729b535fcae8797b51850e6',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    },
})

const getCommand = (url) => {
    const indexCmd = url.indexOf('?')
    return url.substring(0, indexCmd);
}

const getParams = (url) => {
    const index = url.indexOf('?') + 1;
    const string = url.substring(index);
    const array = string.split('&');
    const params = {}

    array.forEach( (e) => {
        const index = e.indexOf('=');
        params[e.substring(0, index)] = e.substring(index + 1);
    })

    return params;
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

function postResponse(res, data) {
    /*const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Requested-With,content-type',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Max-Age': 2592000,
        'Content-Security-Policy': "default-src *; style-src 'self' 'unsafe-inline';"
    };*/
    /*res.setHeader("Content-Type", "application/json");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.writeHead(200);*/
    res.setHeader("Content-Type", "application/json");
    res.setHeader('Access-Control-Allow-Origin', 'cors-anywhere.herokuapp.com');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.setHeader('Access-Control-Max-Age', 2592000);
    //res.writeHead(200, headers);
    res.writeHead(200, {
			"Content-Type":"application/json",
			"Access-Control-Allow-Origin":"*", // REQUIRED CORS HEADER
			"Access-Control-Allow-Headers":"Origin, X-Requested-With, Content-Type, Accept" // REQUIRED CORS HEADER
		}););
    res.statusCode = 200;
    const jsonContent = JSON.stringify(data);
    return res.end(jsonContent);
}


async function requestListener(req, res) {
    const url = req.url;
    const method = req.method;

    if (method === 'GET') {
        const command = getCommand(url);

        switch (command) {
            case '/getdata':
                const cmdParams = getParams(url);
                const dataRes = await getDataByPage(cmdParams.page, cmdParams.sort, cmdParams.order, cmdParams.search, cmdParams.column, cmdParams.condition);
                const pages = Math.ceil(dataRes.count / ITEMS_ON_PAGE);
                const newData = {
                    "pages": pages,
                    "data": dataRes.data
                }
                postResponse(res, newData);
                break;
            default:
                const jdata = {
                    success: false,
                    status: "Bad request.",
                    err: error,
                }
                postResponse(res, jdata);
                break;
        }
    } else {
        const jdata = {
            success: false,
            status: "Bad method.",
            err: error,
        }
        postResponse(res, jdata);
        return res.end();
    }
}

const server = http.createServer(requestListener)

server.listen(PORT);

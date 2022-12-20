const express = require('express');
const mysql = require('mysql');

const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3050;

const app = express();
// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//MYSQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test_crud_rest'
});

//RUTAS

//LOGIN
app.post('/login', (req, res) => {

    const {email, password} = req.body;
    let sql = `SELECT employee_email, tryouts FROM employees where employee_email = '${email}'`;
    connection.query(sql, (error, result1) => {
        if(error) throw error;
        if(result1.length == 0){
            res.send({
                respuesta: "correo no registrado",
                error: true
            });
        }else{
            if(result1[0]["tryouts"] > 4){
                res.send({
                    respuesta: "Maximo de intentos alcanzado: cuenta suspendida contacte al administrador",
                    error: true
                });
            }else{
                sql = `SELECT employee_id, employee_name, employee_type, employee_email FROM employees where employee_email = '${email}' and employee_pass = '${password}'`;
                connection.query(sql, (error, result2) => {
                    if(error) throw error;
                    if(result2.length > 0){
                            sql = `UPDATE employees SET tryouts = 0 where employee_email = '${email}'`;
                            connection.query(sql, (error, result2) => {
                                if(error) throw error;
                            });
                            res.send({
                                respuesta: result2,
                                error: false
                            })
                            // res.json();
                        }else{
                            sql = `UPDATE employees SET tryouts = tryouts + 1 where employee_email = '${email}'`;
                            connection.query(sql, (error, result2) => {
                                if(error) throw error;
                                res.send({
                                    respuesta: `no match, intentos antes de bloqueo: ${ 5 - result1[0]["tryouts"] - 1}`,
                                    error: true
                                });
                            });
                    }
                });
            }
        }
    });


    
    // });
});

//EMPLOYEES

app.get('/employee_dashboard', (req, res) => {
    const sql = 'SELECT e.employee_id, e.employee_name, e.employee_type, e.employee_email, c.user_type_name, re.restaurant_id FROM employees as e inner join cat_user_types as c on c.user_type_id = e.employee_type left join restaurant_employees as re on re.employee_id = e.employee_id where e.activo = 1;';
    connection.query(sql, (error, results) => {
        if(error) throw error;
        if(results.length > 0){
            res.json(results);
        }else{
            res.send("no hay registros");
        }
    });
});

app.get('/employee/:id', (req, res) => {
    const {id} = req.params;
    const sql = `SELECT employee_id, employee_name, employee_type, employee_email  FROM employees where employee_id = ${id}`;
    connection.query(sql, (error, result) => {
        if(error) throw error;
        if(result.length > 0){
            res.json(result);
        }else{
            res.send("no hay registros");
        }
    });
});


app.post('/add_employee', (req, res) => {
    const sql = 'INSERT INTO employees SET ?';
    const employeeObj = {
        employee_pass: req.body.employee_pass,
        employee_name: req.body.employee_name,
        employee_type: req.body.employee_type,
        employee_email: req.body.employee_email
    }
    connection.query(sql, employeeObj, error => {
        if(error){
            if(error.errno == 1062){
                res.send("email en uso!");
                return;
            }
            throw error
        }
        res.send("Added!");
    });
});

app.put('/employee_update/:id', (req, res) => {
    const {id} = req.params;
    const { employee_pass, employee_name, employee_type, employee_email, restaurant_id } = req.body;
    const restid = (restaurant_id == '') ? null : restaurant_id;
    const sql = `UPDATE employees SET employee_name = '${employee_name}', employee_pass = '${employee_pass}', employee_type = ${employee_type}, employee_email = '${employee_email}' where employee_id = ${id}`;
    connection.query(sql, error => {
        if(error) throw error;
        const setRest = `INSERT INTO restaurant_employees (employee_id, restaurant_id) VALUES(${id}, ${restid}) ON DUPLICATE KEY UPDATE employee_id=${id}, restaurant_id=${restid};`;
        connection.query(setRest, error => {
            if(error) throw error;
            res.send({
                respuesta: "Employee updated",
                error: false
            });
        });
    });
});

app.delete('/employee_delete/:id', (req, res) => {
    const {id} = req.params;
    const { employee_type, employee_id } = req.body;
    if(employee_type == 1) {
        res.send({
            respuesta: "401",
            error: true
        });
    }else if(employee_id == id){
        res.send({
            respuesta: "Self deletion disabled",
            error: true
        });
    }
    else{
        const sql = `UPDATE employees SET activo = 0 where employee_id = ${id}`;
        connection.query(sql, error => {
            if(error) throw error;
            res.send({
                respuesta: "Employee Deleted",
                error: false
            });
        });
    }
});

//////

app.get('/restaurant_dashboard', (req, res) => {
    const sql = 'SELECT r.restaurant_id, r.restaurant_location, r.restaurant_name FROM restaurants as r where r.activo = 1';
    connection.query(sql, (error, results) => {
        if(error) throw error;
        if(results.length > 0){
            res.json({
                respuesta: results,
                error: false
            });
        }else{
            res.send({
                respuesta: "No data",
                error: true
            });
        }
    });
});


app.post('/add_restaurant', (req, res) => {
    const sql = 'INSERT INTO restaurants SET ?';
    const employeeObj = {
        restaurant_name: req.body.restaurant_name,
        restaurant_location: req.body.restaurant_location
    }
    connection.query(sql, employeeObj, error => {
        if(error) throw error;
        res.send("Added!");
    });
});

app.delete('/restaurant_delete/:id', (req, res) => {
    const { employee_type } = req.body;
    const {id} = req.params;
    if(employee_type == 1) {
        res.send({
            respuesta: "401",
            error: true
        });
    }else{
        const sql = `UPDATE restaurants SET activo = 0 where restaurant_id = ${id}`;
        connection.query(sql, error => {
            if(error) throw error;
            res.send({
                respuesta: "Restaurant Deleted",
                error: false
            });
        });
    }
});

app.put('/restaurant_update/:id', (req, res) => {
    const {id} = req.params;
    const { edit_restaurant_name, edit_restaurant_location, edit_restaurant_id, employee_type } = req.body;
    if(employee_type == 1) {
        res.send({
            respuesta: "401",
            error: true
        });
    }else{
        const sql = `UPDATE restaurants SET restaurant_name = '${edit_restaurant_name}', restaurant_location = ${edit_restaurant_location} where restaurant_id = ${id}`;
        connection.query(sql, error => {
            if(error) throw error;
            res.send({
                respuesta: "Restaurant Updated",
                error: false
            });
        });
    }
});

//DISHES
app.get('/dish_dashboard', (req, res) => {
    const sql = 'SELECT d.dish_name, d.dish_id, IFNULL(rd.restaurant_id,"") as restaurant_id from Dishes as d left join restaurant_dishes as rd on rd.dish_id = d.dish_id WHERE activo = 1;'
    connection.query(sql, (error, results) => {
        if(error) throw error;
        if(results.length > 0){
            res.json({
                respuesta: results,
                error: false
            });
        }else{
            res.send({
                respuesta: "No data",
                error: true
            });
        }
    });
});

app.post('/add_dish', (req, res) => {
    const sql = 'INSERT INTO dishes SET ?';
    const employeeObj = {
        dish_name: req.body.dish_name
    }
    connection.query(sql, employeeObj, error => {
        if(error) throw error;
        res.send("Added!");
    });
});

app.put('/dish_update/:id', (req, res) => {
    const {id} = req.params;
    const { employee_type, edit_dish_name, edit_dish_restaurant } = req.body;
    if(employee_type == 1) {
        res.send({
            respuesta: "401",
            error: true
        });
    }else{
        const restid = (edit_dish_restaurant == '') ? null : edit_dish_restaurant;
        const sql = `UPDATE dishes SET dish_name = '${edit_dish_name}' where dish_id = ${id}`;
        connection.query(sql, error => {
            if(error) throw error;
            const setRest = `INSERT INTO restaurant_dishes (dish_id, restaurant_id) VALUES(${id}, ${restid}) ON DUPLICATE KEY UPDATE dish_id=${id}, restaurant_id=${restid};`;
            connection.query(setRest, error => {
                if(error) throw error;
                res.send({
                    respuesta: "Dish updated",
                    error: false
                });
            });
        });
    }
});


app.delete('/dish_delete/:id', (req, res) => {
    const { employee_type } = req.body;
    const {id} = req.params;
    if(employee_type == 1) {
        res.send({
            respuesta: "401",
            error: true
        });
    }else{
        const sql = `UPDATE dishes SET activo = 0 where dish_id = ${id}`;
        connection.query(sql, error => {
            if(error) throw error;
            res.send({
                respuesta: "Dish Deleted",
                error: false
            });
        });
    }
});

connection.connect(error => {
    if(error) throw error;
    console.log('DB ON')
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
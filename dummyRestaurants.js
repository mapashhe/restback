var mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test_crud_rest'
});

connection.connect(error => {
    if(error) throw error;
    console.log('dummyRestaurant.js script successfuly connected to the DB');

    const sql = `INSERT INTO restaurants (restaurant_name, restaurant_location) values 
    ('La Cabaña', 101), ('Fido DIdo', null), ('El Vaquero', 12), ('El Tejon Rabioso', 33), 
    ('El Huichol', 56), ('Restaurant Generico #12', 28), ('Ska', 44), ('A Tragar', 63), 
    ('Inspiracion', 103), ('Ultimo', 99);`;
    connection.query(sql, error => {
        if(error) throw error;
        console.log("Restaurants agregados!");
    });

});


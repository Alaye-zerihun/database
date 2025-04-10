/*******************************
 * QUESTION 1 IMPLEMENTATION
 * Create database connection
 *******************************/

// Import required modules
const mysql = require("mysql");          // MySQL driver for Node.js
const express = require("express");      // Express framework for routing
const bodyParser = require("body-parser"); // Middleware to parse request bodies
const cors = require("cors");            // Middleware to enable CORS

const app = express();                   // Create Express application instance
const port = 3001;                      // Port number for the server

// Database connection configuration object
const connection = mysql.createConnection({
  host: "localhost",                    // MySQL server address
  user: "myDBuser",                     // Database username
  password: "myDBuser",                 // Database password
  database: "myDB",                     // Database name to connect to
});

// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    // If connection fails, log error and exit
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  // On successful connection
  console.log("Successfully connected to MySQL database!");
});

/*******************************
 * QUESTION 2 IMPLEMENTATION
 * Create tables via /install route
 *******************************/

// Add JSON parsing middleware to Express
app.use(express.json());

// Array of SQL queries to create all required tables
const createTablesQueries = [
  // Products table - main table for iPhone products
  `CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,  // Unique identifier
    name VARCHAR(255) NOT NULL,                // Product name
    price DECIMAL(10,2) NOT NULL,              // Product price
    description TEXT,                          // Detailed description
    release_date DATE,                         // When product was released
    image_url VARCHAR(255)                     // URL to product image
);`, 

  // Colors table - available colors for each product
`CREATE TABLE IF NOT EXISTS colors (
    color_id INT AUTO_INCREMENT PRIMARY KEY,   // Unique color ID
    product_id INT,                           // Links to products table
    color_name VARCHAR(100) NOT NULL,         // Human-readable color name
    color_code VARCHAR(7) NOT NULL,           // Hex color code
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    // Cascade delete if product is deleted
);`, 

  // Storage options table - different capacities
`CREATE TABLE IF NOT EXISTS storage_options (
    storage_id INT AUTO_INCREMENT PRIMARY KEY, // Unique storage ID
    product_id INT,                           // Links to products table
    capacity VARCHAR(50) NOT NULL,            // Storage size (e.g., "128GB")
    price_diff DECIMAL(10,2) DEFAULT 0,       // Price difference from base model
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);`, 

  // Features table - product features
`CREATE TABLE IF NOT EXISTS features (
    feature_id INT AUTO_INCREMENT PRIMARY KEY, // Unique feature ID
    product_id INT,                           // Links to products table
    feature_name VARCHAR(255) NOT NULL,       // Feature name
    feature_description TEXT,                 // Feature details
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE 
);`, 

  // Specifications table - technical specs
`CREATE TABLE IF NOT EXISTS specifications (
    spec_id INT AUTO_INCREMENT PRIMARY KEY,   // Unique spec ID
    product_id INT,                          // Links to products table
    spec_name VARCHAR(255) NOT NULL,         // Specification name (e.g., "Weight")
    spec_value VARCHAR(255) NOT NULL,        // Specification value (e.g., "174g")
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
  );`
];

// Route to install/create all tables
app.get("/install", (req, res) => {
  // First disable foreign key checks to allow table creation in any order
  connection.query("SET FOREIGN_KEY_CHECKS = 0", (err) => {
    if (err) return res.status(500).send("Error disabling foreign key checks");

    // Recursive function to execute queries one after another
    const executeQuery = (index) => {
      // Base case: all queries executed
      if (index >= createTablesQueries.length) {
        // Re-enable foreign key checks when done
        connection.query("SET FOREIGN_KEY_CHECKS = 1", (err) => {
          if (err) console.error("Error re-enabling foreign key checks:", err);
          res.send("All tables created successfully!");
        });
        return;
      }

      // Execute current query
      connection.query(createTablesQueries[index], (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err);
          return res.status(500).send(`Error creating table ${index + 1}: ${err.sqlMessage}`);
        }
        console.log(`Table ${index + 1} created successfully`);
        // Execute next query recursively
        executeQuery(index + 1);
      });
    };

    // Start executing queries from index 0
    executeQuery(0);
  });
});

/*******************************
 * QUESTION 3 IMPLEMENTATION
 * Handle form submission
 *******************************/

// Enable CORS for cross-origin requests
app.use(cors());
// Parse URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

// Route to handle product form submission
app.post("/add-product", (req, res) => {
  // Destructure form data from request body
const { name, price, description, release_date, image_url } = req.body;

  // SQL query with parameterized values to prevent SQL injection
const insertQuery = `
    INSERT INTO products (name, price, description, release_date, image_url)
    VALUES (?, ?, ?, ?, ?)
`;

  // Execute query with form values
connection.query(
    insertQuery,
    [name, price, description, release_date, image_url],
    (err, results) => {
    if (err) {
        console.error("Error inserting product:", err);
        return res.status(500).send(`Error adding product: ${err.sqlMessage}`);
    }
      // On success, log the new product ID and send success response
    console.log("Product added successfully with ID:", results.insertId);
    res.send("Product added successfully!");
    }
);
});

/*******************************
 * SERVER INITIALIZATION
 *******************************/

// Basic root route with endpoint documentation
app.get("/", (req, res) => {
res.send(`
    <h1>MySQL Database Server</h1>
    <p>Endpoints:</p>
    <ul>
    <li><a href="/install">/install</a> - Create tables</li>
    <li>/add-product - POST endpoint for adding products</li>
    </ul>
`);
});

// Start the Express server
app.listen(port, () => {
console.log(`Server running at http://localhost:${port}`);
}).on('error', (err) => {
  // Handle server startup errors
console.error('Server failed to start:', err);
});

// Export connection for potential use in other modules
module.exports = connection;







// it is about cors example
// Example:
// Your React app runs at http://localhost:3000
// Your Node.js  runs at http://localhost:5000
// in this case the browser blocks this request. this is the case where CORS comes in.



















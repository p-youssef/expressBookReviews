const express           = require('express');
const jwt               = require('jsonwebtoken');
const session           = require('express-session')
const customer_routes   = require('./router/auth_users.js').authenticated;
const genl_routes       = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req, res, next) {
    // Check for access token in session
    const session = req.session;
    const tokenFromSession = session && session.authorization ? session.authorization.accessToken : null;

    // Check for access token in Authorization header
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader ? authHeader.split(' ')[1] : null;

    // Determine the token source
    const token = tokenFromSession || tokenFromHeader;

    if (!token) {
        // If no token is found
        return res.status(401).send({ message: "Unauthorized: No Access Token in Session or Header!" });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET || "fallback_secret", (err, decoded) => {
        if (err) {
            console.error("Token verification failed:", err.message);
            return res.status(403).json({ message: "Forbidden: Invalid or Expired Token!" });
        }
        req.user = decoded;
        next();
    });
});


 
const PORT =5200;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));

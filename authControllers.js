const pool = require("../db");

const loginUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExist = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExist.rows.length > 0) {
      const user = userExist.rows[0];

      if (user.password === password) {
        return res.json({
          message: "success",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      } else {
        return res.status(401).send("Incorrect Password");
      }
    }

    const newUser = await pool.query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email",
      [name, email, password]
    );

    res.json({
      message: "success",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Database Error");
  }
};

module.exports = {
  loginUser,
};
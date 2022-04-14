const api = require("express");
const router = api.Router();
const cors = require("cors");

var admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const whitelist = ["https://cpsu-mis.web.app"];

var corsOptions = {
  origin: function (origin, callback) {
    const index = whitelist.indexOf(origin);

    if (index !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

const authTokenVerifyMiddleware = async (req, res, next) => {
  const tokenString = req.headers["authorization"]
    ? req.headers["authorization"].split(" ")
    : null;
  if (!tokenString) res.send("No headers provided.");
  else if (!tokenString[1]) res.send("No token provided.");
  else {
    const decodedToken = await getAuth().verifyIdToken(tokenString[1]);
    console.log(decodedToken);
    if (!decodedToken.admin) {
      return res.status(400).send({
        message: "Restricted: Limited permission.",
      });
    }
    next();
  }
};

router.use(api.json());
router.use(cors(corsOptions));

// Set user Role
router.put("/addRole/:id", authTokenVerifyMiddleware, async (req, res) => {
  const role = req.body;
  try {
    await getAuth().setCustomUserClaims(req.params.id, role);
    const userData = await getAuth().getUser(req.params.id);
    console.log(userData);
    res.status(200).send({
      message: "User role updated!",
    });
  } catch (err) {
    res.status(400).send({
      message: err,
    });
  }
});

// AddUser
router.post("/addUser", authTokenVerifyMiddleware, async (req, res) => {
  const payload = req.body;
  const user = {
    email: payload.email,
    emailVerified: false,
    displayName: payload.displayName,
    password: payload.password,
    disabled: false,
  };
  if (payload.phoneNumber) {
    user.phoneNumber = payload.phoneNumber;
  }
  const userData = await getAuth().createUser(user);
  res.json(userData);
});

// Get Users
router.get("/getUsers", authTokenVerifyMiddleware, async (req, res) => {
  let usersData = [];
  const listAllUsers = async (nextPageToken) => {
    try {
      const listResult = await getAuth().listUsers(1000, nextPageToken);
      listResult.users.forEach(async (userRecord) => {
        usersData.push(userRecord.toJSON());
      });
      if (listResult.pageToken) {
        // List next batch of users.
        listAllUsers(listResult.pageToken);
      }
      res.json(usersData);
    } catch (err) {
      console.log("Error listing users:", err);
    }
  };

  listAllUsers();
});

//Update User
router.put("/updateUser/:id", authTokenVerifyMiddleware, async (req, res) => {
  const payload = req.body;
  const user = {
    email: payload.email,
    emailVerified: false,
    displayName: payload.displayName,
  };
  if (payload.phoneNumber) {
    user.phoneNumber = payload.phoneNumber;
  }
  if (payload.password) {
    user.password = payload.password;
  }

  try {
    const userData = await getAuth().updateUser(req.params.id, user);
    res.json(userData);
  } catch (err) {
    res.status(400).send({
      message: err,
    });
  }
});

//Delete User
router.delete(
  "/deleteUser/:id",
  authTokenVerifyMiddleware,
  async (req, res) => {
    try {
      await getAuth().deleteUser(req.params.id);
      res.status(200).send({
        message: "User deleted!",
      });
    } catch (err) {
      res.status(400).send({
        message: err,
      });
    }
  }
);

module.exports = router;

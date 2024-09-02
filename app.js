const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
let db = null;
const dbToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server successfully running :http://localhost:3000/");
    });
  } catch (e) {
    console.log(`db Error :${e.message}`);
    process.exit(1);
  }
};

dbToServer();

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `
  SELECT * FROM user WHERE username ='${username}';`;
  const userData = await db.get(getUser);
  if (userData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const compare = await bcrypt.compare(password, userData.password);
    if (compare === true) {
      const playHold = {
        username: username,
      };
      const jwtToken = jwt.sign(playLoad, "Srinu1098@");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

const authentication = (request, response, next) => {
  let jwtToken = null;
  const auth = request.headers["authorization"];
  if (auth !== undefined) {
    jwtToken = auth.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "Srinu1098@", async (error, playLoad) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};
// get all states
app.get("/states/", authentication, async (request, response) => {
  const getAllStates = `
    SELECT state_id as stateId,state_name as stateName,population FROM state;`;
  const dbResponse = await db.all(getAllStates);
  response.send(dbResponse);
});
// get a single states
app.get("/states/:stateId/", authentication, async (request, response) => {
  const { stateId } = request.params;
  const getSingleState = `
    SELECT state_id as stateId,state_name as stateName,population FROM state WHERE state_id =${stateId};`;
  const dbResponse = await db.get(getSingleState);
  response.send(dbResponse);
});

//post a district

app.post("/districts/", authentication, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const getALlDistricts = `
  INSERT INTO district(district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}',${stateId},'${cases}','${cured}','${active}','${deaths}');`;
  const dbResponse = await db.run(getALlDistricts);
  response.send("District Successfully Added");
});

//get a district based on districtId

app.get(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const getADistrict = `
    SELECT district_id as districtId ,district_name as districtName ,state_id as stateId,cases,cured,active,deaths FROM district WHERE district_id =${districtId};`;
    const dbResponse = await db.get(getADistrict);
    response.send(dbResponse);
  }
);

// delete

app.delete(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const deleteDistrict = `
    DELETE FROM district WHERE district_id = ${districtId};`;
    const dbResponse = await db.run(deleteDistrict);
    response.send("District Removed");
  }
);

// put district

app.put(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const dbDetails1 = request.body;
    const { districtName, stateId, cases, cured, active, deaths } = dbDetails1;

    const updateTheDataDis = `
    UPDATE district SET district_name = '${districtName}',state_id = ${stateId},cases=${cases},cured =${cured},active = ${active},deaths = ${deaths} WHERE district_id = ${districtId};`;
    const dbResponse2 = await db.run(updateTheDataDis);
    response.send("District Details Updated");
  }
);
// get total stats
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDb = `
  SELECT 
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths) 
  FROM district WHERE state_id = ${stateId};`;
  const dbResponse = await db.get(getDb);
  response.send({
    totalCases: dbResponse["SUM(cases)"],
    totalCured: dbResponse["SUM(cured)"],
    totalActive: dbResponse["SUM(active)"],
    totalDeaths: dbResponse["SUM(deaths)"],
  });
});

module.exports = app;

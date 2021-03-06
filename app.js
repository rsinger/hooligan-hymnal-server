var express = require("express");
var app = express();
var mongoose = require("mongoose");
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);
var env = require("dotenv");
var bodyParser = require("body-parser");
var fs = require("fs");
var morgan = require("morgan");
var cors = require("cors");
var passport = require("passport");
var Scheduler = require("./models/scheduledTasks");
var helmet = require("helmet");
var { promisify } = require("es6-promisify");
var cookieParser = require("cookie-parser");
var flash = require("connect-flash");
var fileUpload = require("express-fileupload");
var errorHandlers = require("./handlers/errorHandlers");
var helpers = require("./helpers");

env.config();

const PORT = process.env.PORT || 3000;
var MONGO_URI = process.env.MONGO_URI;

app.use(express.static(__dirname + "/public"));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.disable("x-powered-by");
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp/"
	})
);

app.set("view engine", "pug");
app.set("views", "views");

mongoose
	.connect(
		MONGO_URI,
		{
			useNewUrlParser: true,
			useUnifiedTopology: true
		},
		function() {
			console.log("Connection has been made");
		}
	)
	.catch(function(err) {
		console.log("App starting error:", err.stack);
		process.exit(1);
	});
mongoose.set("useFindAndModify", false);

app.use(cookieParser());

app.use(
	session({
		secret: process.env.SECRET_KEY,
		resave: false,
		saveUninitialized: false,
		store: new MongoStore({ mongooseConnection: mongoose.connection })
	})
);

fs.readdirSync("models").forEach(file => {
	if (file.substr(-3) === ".js") {
		require(`./models/${file}`);
	}
});

const Players = mongoose.model("players");
async function changePlayerImages() {
	const players = await Players.find();
	for(const player of players) {
		if (player.image) {
			player.images.push(player.image);
			player.image = undefined;
			player.save();
		}
	}
}
changePlayerImages();

app.use(passport.initialize());
app.use(passport.session());
require("./handlers/passport");

app.use(flash());

let langs = process.env.INPUT_LANGUAGES;
if (!langs) {
	langs = "en";
}
langs = langs.split(",").map(function(lang) {
	return lang.trim();
});

app.use((req, res, next) => {
	res.locals.h = helpers;
	res.locals.currentUser = req.user || null;
	res.locals.flashes = req.flash();
	res.locals.langs =
    process.env.INPUT_LANGUAGES ? JSON.parse(process.env.INPUT_LANGUAGES) : ["en"];
	next();
});

app.use((req, res, next) => {
	req.login = promisify(req.login, req);
	next();
});
const web = require("./routes/web");
app.use("/", web);
const api = require("./routes/api");
app.use("/api", api);

app.use(errorHandlers.notFound);

app.use(errorHandlers.flashValidationErrors);

if (app.get("env") === "development") {
	app.use(errorHandlers.developmentErrors);
}

Scheduler.loadAllScheduledTasks();
//sample task creation:
//var task = {};
//task.creator = "maxgene@gmail.com";
//task.triggerAt = new Date(2019, 11, 14, 14, 41, 0);
//task.data = { "foo": "bar" };
//Scheduler.scheduleNewsPost(task);

app.use(errorHandlers.productionErrors);

app.listen(PORT, function() {
	if (app.get("env") === "development") {
		console.log(`app listening on http://localhost:${PORT}`);
	} else {
		console.log("Express app is running");
	}
});

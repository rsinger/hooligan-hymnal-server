const mongoose = require("mongoose");
const Song = mongoose.model("song");

exports.index = async (req, res) => {
	const page = req.query.page || 1;
	const limit = 10;
	const skip = (page * limit) - limit;
	const filter = req.query.filter || "";

	const songsPromise = Song
		.find({
			$or: [
				{
					title: {
						$regex: `.*${filter}.*`,
						$options: "i"
					},
				},
				{
					lyrics: {
						$regex: `.*${filter}.*`,
						$options: "i"
					},
				},
				{
					reference_title: {
						$regex: `.*${filter}.*`,
						$options: "i"
					}
				},
				{
					category: {
						$regex: `.*${filter}.$`,
						$options: "i"
					}
				}
			]
		})
		.skip(skip)
		.limit(limit)
		.sort({ "title": "asc" });

	const countPromise = Song.count();
	const searchCountPromise = Song.find({
		$or: [
			{
				title: {
					$regex: `.*${filter}.*`,
					$options: "i"
				},
			},
			{
				lyrics: {
					$regex: `.*${filter}.*`,
					$options: "i"
				},
			},
			{
				reference_title: {
					$regex: `.*${filter}.*`,
					$options: "i"
				}
			},
			{
				category: {
					$regex: `.*${filter}.$`,
					$options: "i"
				}
			}
		]
	}).count();
	const [songs, totalCount, searchCount] = await Promise.all([songsPromise, countPromise, searchCountPromise]);
	const pages = Math.ceil((searchCount ? searchCount : totalCount) / limit);
	if (!songs.length && skip) {
		req.flash("error", `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
		res.redirect(`/songs?page=${pages}`);
	}

	res.render("songs/index", {
		title: "All Songs",
		songs,
		totalCount,
		searchCount,
		skip,
		page,
		pages,
		filter
	});
};

exports.search = async (req, res) => {
	const filter = req.query.filter || "";
	const page = req.query.page || 1;
	const limit = 10;
	const skip = (page * limit) - limit;

	const query = {
		$or: [
			{
				title: {
					$regex: `.*${filter}.*`,
					$options: "i"
				},
			},
			{
				lyrics: {
					$regex: `.*${filter}.*`,
					$options: "i"
				},
			},
			{
				reference_title: {
					$regex: `.*${filter}.*`,
					$options: "i"
				}
			},
			{
				category: {
					$regex: `.*${filter}.$`,
					$options: "i"
				}
			}
		]
	};

	const songsPromise = Song
		.find(query)
		.skip(skip)
		.limit(limit)
		.sort({
			"title": "asc"
		});

	const totalCountPromise = Song.countDocuments();
	const searchCountPromise = Song.find(query).countDocuments();
	const [songs, totalCount, searchCount] = await Promise.all([songsPromise, totalCountPromise, searchCountPromise]);
	const pages = Math.ceil(searchCount / limit);

	res.render("songs/_songsList", {
		songs,
		filter,
		skip,
		page,
		pages,
		totalCount,
		searchCount
	});

};
exports.create = (req, res) => {
	res.render("songs/create", {
		title: "Create Song"
	});
};
exports.store = async (req, res) => {
	const song = await new Song(req.body).save();
	req.flash("success", `${song.title} was created!`);
	res.redirect("/songs");
};
exports.show = async (req, res) => {
	const song = await Song.findById(req.params.id);
	res.render("songs/show", {
		title: `${song.title}`,
		song
	});
};
exports.edit = async (req, res) => {
	const song = await Song.findById(req.params.id);
	res.render("songs/edit", {
		title: `Edit ${song.title}`,
		song
	});
};
exports.update = async (req, res) => {
	const song = await Song.findOneAndUpdate(
		{
			_id: req.params.id
		},
		{
			$set: req.body
		},
		{
			new: true,
			runValidators: true,
			context: "query"
		}
	);
	req.flash("success", `${song.title} was updated!`);
	res.redirect(`/songs/${song._id}`);
};
exports.deleteConfirm = async (req, res) => {
	const song = await Song.findById(req.params.id);
	res.render("songs/delete", {
		title: `Delete ${song.title}`,
		song
	});
};
exports.delete = async (req, res) => {
	const song = await Song.findByIdAndDelete(req.params.id);
	req.flash("success", `${song.title} was deleted`);
	res.redirect("/songs");
};

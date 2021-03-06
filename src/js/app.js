require("alpinejs");
import dropzone from "./modules/dropzone";


dropzone(
  "/players/thumbnail",
  "thumbnail-template",
  document.getElementById("thumbnail-upload-section"),
  "#thumbnail-previews",
  "#thumbnail-target",
  "Thumbnail",
  1,
  "thumbnail"
)

dropzone(
  "/players/images",
  "images-template",
  document.getElementById("images-upload-section"),
  "#images-previews",
  "#images-target",
  "Player Images",
  10,
  "images"
)

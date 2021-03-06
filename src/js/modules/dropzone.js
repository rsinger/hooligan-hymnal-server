/* eslint-disable */
import Dropzone from "dropzone";
import axios from "axios";
import slugify from "slugify"
/* eslint-enable */

/**
 *
 * @param {String} url
 * @param {String} templateId
 * @param {Element} uploadSection
 * @param {String} previewsContainer
 * @param {String} target
 * @param {String} text
 * @param {Number} maxFiles
 * @param {String} inputName
 * @param {String} initUrl
 */
function dropzone(url, templateId, uploadSection, previewsContainer, target, text, maxFiles = null, inputName, initUrl) {
  var previewNode = document.getElementById(templateId);
  if (!previewNode || !templateId) return;
  previewNode.id = "";
  var previewTemplate = previewNode.parentNode.innerHTML;
  let playerId;
  var myDropzone = new Dropzone(uploadSection, {
    url: url,
    maxFiles: maxFiles,
    previewTemplate: previewTemplate,
    autoQueue: false,
    previewsContainer: previewsContainer,
    withCredentials: true,
    init: function() {
        previewNode.remove();
        const thisDropzone = this;
        playerId = document.getElementById("player-id");
        if (playerId) {
          axios.get(`/players/images?playerId=${playerId.innerText}&type=${inputName.toLowerCase()}`, {
            withCredentials: true
          })
            .then(({ data }) => {
              if (data.images) {
                for (const d of data.images) {
                  var mockFile = {
                    name: `${data.name} image`,
                  }
                  thisDropzone.defaultOptions.addedfile.call(thisDropzone, mockFile);
                  thisDropzone.defaultOptions.thumbnail.call(thisDropzone, mockFile, d);
                  var tEl = document.querySelector(target);
                  var input = document.createElement("input");
                  input.value = d;
                  input.setAttribute("data-id", `${slugify(data.name).toLowerCase()}-image`);
                  input.classList.add = "hidden";
                  input.setAttribute("name", inputName);
                  tEl.appendChild(input);
                }
              } else if (data.thumbnail.length) {
                var mockFile = {
                  name: `${data.name} thumbnail`,
                }
                thisDropzone.defaultOptions.addedfile.call(thisDropzone, mockFile);
                thisDropzone.defaultOptions.thumbnail.call(thisDropzone, mockFile, data.thumbnail);
                var tEl = document.querySelector(target);
                var input = document.createElement("input");
                input.value = data.thumbnail;
                input.setAttribute("data-id", `${slugify(data.name).toLowerCase()}-thumbnail`);
                input.classList.add = "hidden";
                input.setAttribute("name", inputName);
                tEl.appendChild(input);
              }
            }).catch(err => {
              console.log(err);
            });
        }
    }
  });

  let submitButton;

  myDropzone.on("addedfile", function (file, res){
    const form = document.querySelector("main form");
    submitButton = form.querySelector("button[type='submit']");
    submitButton.setAttribute("disabled", "disabled");
    submitButton.classList.add("cursor-disabled");
    submitButton.classList.add("opacity-75");
    if (!document.getElementById(`small-${slugify(text.toLowerCase())}`)) {
      const smallAlert = document.createElement("small");
      smallAlert.innerText = `Please upload ${text} to submit form`;
      smallAlert.id = "small-"+slugify(text.toLowerCase());
      smallAlert.classList.add("block");
      smallAlert.classList.add("text-red-700");
      submitButton.parentNode.appendChild(smallAlert);
    }
  });

  myDropzone.on("success", (_, res) => {
    var tEl = document.querySelector(target);
    var input = document.createElement("input");
    input.value = res.url;
    input.setAttribute("data-id", res.id);
    input.classList.add = "hidden";
    input.setAttribute("name", inputName);
    tEl.appendChild(input);

    const form = document.querySelector("main form");
    submitButton = form.querySelector("button[type='submit']");
    submitButton.removeAttribute("disabled");
    submitButton.classList.remove("cursor-disabled");
    submitButton.classList.remove("opacity-75");
    if(document.querySelector(`#small-${slugify(text).toLowerCase()}`)) {
      document.querySelector(`#small-${slugify(text).toLowerCase()}`).remove();
    }
  });

  myDropzone.on("removedfile", ({ previewElement }) => {
    const img = previewElement.querySelector("img");
    if (playerId) {
      axios.post(`/players/remove-images?playerId=${playerId.innerText}&type=${slugify(inputName.toLowerCase())}`, {
        withCredentials: true,
        img: img.src
      })
        .then(() => {
            const inputs = document.querySelectorAll(`input[name="${inputName.toLowerCase()}"]`);
            inputs.forEach(input => {
              if (input.value == img.src) {
                input.remove();
              }
            });
        }).catch((err) => {
          console.error(err);
        })
    }
    const form = document.querySelector("main form");
    submitButton = form.querySelector("button[type='submit']");
    submitButton.removeAttribute("disabled");
    submitButton.classList.remove("cursor-disabled");
    submitButton.classList.remove("opacity-75");
    const small = document.querySelector(`#small-${text.toLowerCase()}`);
    if (small) {
      small.remove();
    }
  });

  myDropzone.on("maxfilesexceeded", function () {
    alert(`Max files exceeded: ${maxFiles}`)
  });

  const progressBar = document.querySelector(`#${slugify(inputName.toLowerCase())} .progress-bar`)
  myDropzone.on("totaluploadprogress", function (progress) {
    progressBar.style.width = progress + "%";
  });

  const uploadButton = document.querySelector(`#${slugify(inputName.toLowerCase())} .actions .upload`)
  if (uploadButton) {
    uploadButton.onclick = function () {
      myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));
    }
  }

  const cancelButton = document.querySelector(`#${slugify(inputName.toLowerCase())} .actions .cancel`);
  if (cancelButton) {
    cancelButton.onclick = function() {
      myDropzone.removeAllFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));
    };
  }
}

export default dropzone;

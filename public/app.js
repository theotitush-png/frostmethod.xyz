const form = document.getElementById("uploadForm");
const input = document.getElementById("videoInput");
const dropzone = document.getElementById("dropzone");
const submitBtn = document.getElementById("submitBtn");
const fileRow = document.getElementById("fileRow");
const statusBox = document.getElementById("status");
let selectedFile = null;

function chooseFile(file) {
  if (!file) return;
  const allowed = /\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name);
  if (!allowed) return alert("Please choose an MP4, MOV, M4V, WebM, or MKV video.");
  if (file.size > 500 * 1024 * 1024) return alert("Maximum upload size is 500 MB.");
  selectedFile = file;
  document.getElementById("fileTitle").textContent = "Video ready to enhance";
  document.getElementById("fileSub").textContent = "Your video has been selected";
  document.getElementById("fileName").textContent = file.name;
  fileRow.hidden = false;
  submitBtn.disabled = false;
  statusBox.hidden = true;
}
input.addEventListener("change", () => chooseFile(input.files[0]));
document.getElementById("removeFile").addEventListener("click", () => {
  selectedFile = null; input.value = ""; fileRow.hidden = true; submitBtn.disabled = true;
  document.getElementById("fileTitle").textContent = "Drop your video here";
  document.getElementById("fileSub").textContent = "or click to browse · MP4, MOV, WebM, MKV · max 500 MB";
});
["dragenter","dragover"].forEach(evt => dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add("drag"); }));
["dragleave","drop"].forEach(evt => dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.remove("drag"); }));
dropzone.addEventListener("drop", e => chooseFile(e.dataTransfer.files[0]));

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!selectedFile) return;
  submitBtn.disabled = true;
  statusBox.hidden = false;
  document.getElementById("statusTitle").textContent = "Uploading your video…";
  document.getElementById("statusText").textContent = "Uploading";
  document.getElementById("statusDetail").textContent = "Please keep this page open.";
  document.getElementById("progressBar").style.width = "8%";
  document.getElementById("downloadLink").hidden = true;
  const body = new FormData(); body.append("video", selectedFile);
  try {
    const response = await fetch("/api/enhance", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed.");
    document.getElementById("statusTitle").textContent = "Enhancing your video…";
    document.getElementById("statusText").textContent = "Processing";
    document.getElementById("progressBar").style.width = "35%";
    poll(result.id);
  } catch (err) {
    document.getElementById("statusTitle").textContent = "Something went wrong";
    document.getElementById("statusText").textContent = "Error";
    document.getElementById("statusDetail").textContent = err.message;
    submitBtn.disabled = false;
  }
});

async function poll(id) {
  try {
    const response = await fetch(`/api/jobs/${id}`);
    const job = await response.json();
    if (!response.ok) throw new Error(job.error || "Could not check processing status.");
    if (job.status === "done") {
      document.getElementById("statusTitle").textContent = "Your enhanced video is ready";
      document.getElementById("statusText").textContent = "Complete";
      document.getElementById("progressBar").style.width = "100%";
      document.getElementById("statusDetail").textContent = "Your MP4 export is ready to download.";
      const link = document.getElementById("downloadLink"); link.href = job.output; link.hidden = false;
      submitBtn.disabled = false; return;
    }
    if (job.status === "error") throw new Error(job.error || "Processing failed.");
    setTimeout(() => poll(id), 2500);
  } catch (err) {
    document.getElementById("statusTitle").textContent = "Processing failed";
    document.getElementById("statusText").textContent = "Error";
    document.getElementById("statusDetail").textContent = err.message;
    submitBtn.disabled = false;
  }
}

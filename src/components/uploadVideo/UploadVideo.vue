<template>
  <div class="video-upload">
    <label>Upload Video</label>
    <input type="file" accept="video/*" @change="handleFileChange" />

    <!-- Error Message -->
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Preview -->
    <video v-if="videoUrl" controls width="90%" class="preview">
      <source :src="videoUrl" />
      Your browser does not support video.
    </video>

    <!-- Upload Button -->
    <button type="button" :disabled="!selectedFile" @click="uploadVideo">
      Upload
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  courseId: Number,
});
import { ref } from "vue";

const selectedFile = ref(null);
const videoUrl = ref(null);
const error = ref("");

// Validation rules
const maxSizeMB = 50;
const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];

function handleFileChange(event) {
  error.value = "";
  const file = event.target.files[0];

  if (!file) return;

  // ✅ Type validation
  if (!allowedTypes.includes(file.type)) {
    error.value = "Only MP4, WebM, and OGG videos are allowed.";
    return;
  }

  // ✅ Size validation
  if (file.size > maxSizeMB * 1024 * 1024) {
    error.value = `File must be smaller than ${maxSizeMB}MB.`;
    return;
  }

  selectedFile.value = file;

  // Preview
  videoUrl.value = URL.createObjectURL(file);
}

async function uploadVideo() {
  console.log(props.courseId);
  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append("file", selectedFile.value);
  ///api/v1/teacher/courses/{courseId}/preview-video
  try {
    await fetch(
      `/api/v1/teacher/courses/${props.courseId.courseId}/preview-video`,
      {
        method: "POST",
        body: formData,
      }
    );

    alert("Upload successful!");
  } catch (err) {
    error.value = "Upload failed.";
    console.log(err);
  }
}
</script>

<style scoped>
.video-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
}

.error {
  color: red;
}

.preview {
  border: 1px solid #ccc;
}
</style>

# Course API Examples

This file contains example payloads and request formats for the course management and public course content APIs.

## API URLs

Teacher (course management):
- `POST /api/v1/teacher/courses`
- `GET /api/v1/teacher/courses`
- `GET /api/v1/teacher/courses/{courseId}`
- `PUT /api/v1/teacher/courses/{courseId}`
- `DELETE /api/v1/teacher/courses/{courseId}`
- `POST /api/v1/teacher/courses/{courseId}/preview-video`
- `DELETE /api/v1/teacher/courses/{courseId}/preview-video`
- `POST /api/v1/teacher/courses/{courseId}/modules`
- `PUT /api/v1/teacher/courses/{courseId}/modules/{moduleId}`
- `DELETE /api/v1/teacher/courses/{courseId}/modules/{moduleId}`
- `POST /api/v1/teacher/courses/{courseId}/modules/reorder`
- `POST /api/v1/teacher/courses/{courseId}/modules/{moduleId}/lessons`
- `PUT /api/v1/teacher/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`
- `DELETE /api/v1/teacher/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`
- `POST /api/v1/teacher/courses/{courseId}/modules/{moduleId}/lessons/reorder`

Public (course content):
- `GET /api/v1/public/{slug}/courses`
- `GET /api/v1/public/{slug}/courses/{courseId}`

## Teacher - Create Course

```json
{
  "title": "Physics Masterclass",
  "type": "recorded",
  "price": 499.0,
  "currency": "EGP",
  "description": "A complete physics foundation course.",
  "whatYouWillLearn": "Kinematics, dynamics, energy, and momentum.",
  "courseOverview": "Structured lessons with quizzes and assignments.",
  "curriculum": "Week 1: Motion\nWeek 2: Forces\nWeek 3: Energy",
  "instructor": "Dr. Ahmed, PhD in Physics",
  "testimonials": "\"Very clear explanations.\"",
  "pricing": "499 EGP full access",
  "faq": "Q: Is it beginner friendly?\nA: Yes.",
  "certificateInfo": "Certificate upon completion.",
  "hasCertificate": true,
  "duration": 90,
  "targetAudience": "High school students",
  "courseRequirements": "Basic algebra knowledge",
  "previewVideo": "Optional text/notes about preview",
  "refundPolicy": "7-day refund policy.",
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "level": "beginner",
  "language": "ar",
  "active": true
}
```

## Teacher - Update Course

```json
{
  "title": "Physics Masterclass (Updated)",
  "type": "recorded",
  "price": 399.0,
  "currency": "EGP",
  "description": "Updated curriculum and new practice sheets.",
  "whatYouWillLearn": "Kinematics, dynamics, energy, momentum + waves.",
  "courseOverview": "Updated modules and live Q&A sessions.",
  "curriculum": "Week 1: Motion\nWeek 2: Forces\nWeek 3: Energy\nWeek 4: Waves",
  "instructor": "Dr. Ahmed",
  "testimonials": "\"Excellent course.\"",
  "pricing": "399 EGP limited offer",
  "faq": "Q: How long? A: 90 minutes total.",
  "certificateInfo": "Digital certificate after passing quiz.",
  "hasCertificate": true,
  "duration": 90,
  "targetAudience": "High school & early college",
  "courseRequirements": "Basic math + curiosity",
  "previewVideo": "Preview available in the first section.",
  "refundPolicy": "7-day refund policy.",
  "thumbnailUrl": "https://cdn.example.com/thumb-v2.jpg",
  "level": "beginner",
  "language": "ar",
  "active": true
}
```

## Teacher - Upload Preview Video

```
POST /api/v1/teacher/courses/{courseId}/preview-video
Content-Type: multipart/form-data

FormData:
- file: <video file>
- durationSeconds: 300 (optional)
- videoWidth: 1280 (optional)
- videoHeight: 720 (optional)
```

## Teacher - Delete Preview Video

```
DELETE /api/v1/teacher/courses/{courseId}/preview-video
```

## Teacher - Course Detail Response (example)

```json
{
  "id": 12,
  "title": "Physics Masterclass",
  "description": "A complete physics foundation course.",
  "whatYouWillLearn": "Kinematics, dynamics, energy, and momentum.",
  "courseOverview": "Structured lessons with quizzes and assignments.",
  "curriculum": "Week 1: Motion\nWeek 2: Forces\nWeek 3: Energy",
  "instructor": "Dr. Ahmed",
  "testimonials": "\"Very clear explanations.\"",
  "pricing": "499 EGP full access",
  "faq": "Q: Is it beginner friendly?\nA: Yes.",
  "certificateInfo": "Certificate upon completion.",
  "hasCertificate": true,
  "duration": 90,
  "targetAudience": "High school students",
  "courseRequirements": "Basic algebra knowledge",
  "previewVideo": "https://video.example.com/preview.m3u8",
  "refundPolicy": "7-day refund policy.",
  "type": "recorded",
  "price": 499.0,
  "currency": "EGP",
  "active": true,
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "level": "beginner",
  "language": "ar",
  "modules": [],
  "teacher": {
    "id": 5,
    "name": "Dr. Ahmed",
    "subject": "Physics",
    "photoUrl": "https://cdn.example.com/teacher.jpg",
    "bio": "10 years of experience."
  }
}
```

## Public - Course Preview Response (example)

```json
{
  "course": {
    "id": 12,
    "title": "Physics Masterclass",
    "type": "recorded",
    "price": 499.0,
    "currency": "EGP",
    "level": "beginner",
    "language": "ar",
    "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
    "description": "A complete physics foundation course.",
    "whatYouWillLearn": "Kinematics, dynamics, energy, and momentum.",
    "courseOverview": "Structured lessons with quizzes and assignments.",
    "curriculum": "Week 1: Motion\nWeek 2: Forces\nWeek 3: Energy",
    "instructor": "Dr. Ahmed",
    "testimonials": "\"Very clear explanations.\"",
    "pricing": "499 EGP full access",
    "faq": "Q: Is it beginner friendly?\nA: Yes.",
    "certificateInfo": "Certificate upon completion.",
    "hasCertificate": true,
    "duration": 90,
    "targetAudience": "High school students",
    "courseRequirements": "Basic algebra knowledge",
    "previewVideo": "https://video.example.com/preview.m3u8",
    "refundPolicy": "7-day refund policy.",
    "stats": { "modules": 3, "lessons": 12, "durationMinutes": 180 },
    "reviews": { "rating": 4.8, "count": 120 },
    "offers": [],
    "nextLiveSessions": [],
    "sampleLessons": [],
    "modules": [],
    "cta": {
      "enrollRoute": "/checkout/12",
      "liveRoute": null,
      "tutoringRoute": null
    }
  },
  "teacher": {
    "id": 5,
    "slug": "dr-ahmed",
    "name": "Dr. Ahmed",
    "subject": "Physics",
    "tagline": "Learn physics with confidence",
    "photoUrl": "https://cdn.example.com/teacher.jpg",
    "landingUpdatedAt": "2026-02-22T00:00:00Z",
    "branding": {}
  },
  "seo": {
    "title": "Physics Masterclass",
    "description": "A complete physics foundation course."
  }
}
```

## Public - Course Summary Response (example)

```json
{
  "id": 12,
  "title": "Physics Masterclass",
  "type": "recorded",
  "price": 499.0,
  "currency": "EGP",
  "level": "beginner",
  "language": "ar",
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "description": "A complete physics foundation course.",
  "whatYouWillLearn": "Kinematics, dynamics, energy, and momentum.",
  "courseOverview": "Structured lessons with quizzes and assignments.",
  "curriculum": "Week 1: Motion\nWeek 2: Forces\nWeek 3: Energy",
  "instructor": "Dr. Ahmed",
  "testimonials": "\"Very clear explanations.\"",
  "pricing": "499 EGP full access",
  "faq": "Q: Is it beginner friendly?\nA: Yes.",
  "certificateInfo": "Certificate upon completion.",
  "hasCertificate": true,
  "duration": 90,
  "targetAudience": "High school students",
  "courseRequirements": "Basic algebra knowledge",
  "previewVideo": "https://video.example.com/preview.m3u8",
  "refundPolicy": "7-day refund policy."
}
```

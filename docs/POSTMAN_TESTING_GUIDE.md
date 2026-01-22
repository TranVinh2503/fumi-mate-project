# Postman Testing Guide - Question Generation API

## 📥 Import the Collection

1. **Open Postman**
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose: `fumi-mate-api-question-generation.postman_collection.json`
5. Click **Import**

You should now see "Fumi-Mate Question Generation API" in your Collections.

---

## 🚀 Prerequisites

### 1. Start the Flask Server

```bash
cd fumi-mate-api
python run.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
```

### 2. Verify Database is Ready

Make sure you have run the seed script to create test users:
```bash
python seed.py
```

This creates:
- **Teacher:** username: `sensei_akiko`, password: `password123`
- **Student:** username: `student_hana`, password: `password123`

---

## 📋 Step-by-Step Testing Instructions

### **Step 1: Authentication** 🔐

#### 1.1 Login as Teacher
1. Expand **"1. Authentication"** folder
2. Click **"Login as Teacher"**
3. Click **Send** button
4. **Expected Response (200 OK):**
   ```json
   {
     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "user": {
       "id": 1,
       "username": "sensei_akiko",
       "role": "teacher"
     }
   }
   ```
5. ✅ **The token is automatically saved** to collection variable `teacherToken`
6. Check the **Console** (bottom of Postman) - you should see: "Teacher token saved: ..."

#### 1.2 Login as Student (Optional - for testing authorization)
1. Click **"Login as Student"**
2. Click **Send**
3. Token is saved to `studentToken`

---

### **Step 2: Generate Questions** ✨

#### 2.1 Generate a Letter Question (手紙)
1. Expand **"2. Generate Questions"** folder
2. Click **"Generate Question - Letter (手紙) N3"**
3. Review the request body:
   ```json
   {
     "genre": "手紙",
     "topic": "ホームステイの思い出",
     "level": "N3"
   }
   ```
4. Click **Send**
5. **Expected Response (201 Created):**
   ```json
   {
     "success": true,
     "message": "Question generated and saved successfully",
     "question": {
       "id": 1,
       "genre": "手紙",
       "topic": "ホームステイの思い出",
       "content": "日本で１週間ホームスティしました。お世話になった...",
       "level": "N3",
       "required_points": "[\"楽しかった思い出を２つ以上書く\",\"感謝の気持ちを伝える\"]",
       "similarity_hash": "a1b2c3d4..."
     }
   }
   ```
6. ✅ **Question ID is automatically saved** to `questionId` variable
7. **Note:** First request may take 30 seconds due to rate limiting

#### 2.2 Generate a Speech Question (スピーチ)
1. Click **"Generate Question - Speech (スピーチ) N2"**
2. Click **Send**
3. ⏳ **Wait 30 seconds** (rate limiting for Gemini API)
4. Expected: 201 Created with speech question

#### 2.3 Generate an Opinion Question (意見・感想)
1. Click **"Generate Question - Opinion (意見・感想) N3"**
2. Click **Send**
3. ⏳ **Wait 30 seconds**
4. Expected: 201 Created with opinion question

**💡 Tip:** If you see "Rate limiting: waiting X seconds" in server logs, this is normal!

---

### **Step 3: List & Filter Questions** 📋

#### 3.1 List All Questions
1. Expand **"3. List & Filter Questions"** folder
2. Click **"List All Questions"**
3. Click **Send**
4. **Expected Response (200 OK):**
   ```json
   {
     "success": true,
     "total": 3,
     "limit": 50,
     "offset": 0,
     "questions": [
       {
         "id": 1,
         "genre": "手紙",
         "topic": "ホームステイの思い出",
         "content": "...",
         "level": "N3",
         "required_points": "[...]"
       },
       // ... more questions
     ]
   }
   ```

#### 3.2 Filter by Genre
1. Click **"Filter by Genre - Letter (手紙)"**
2. Notice the URL has `?genre=手紙`
3. Click **Send**
4. Expected: Only letter-type questions

#### 3.3 Filter by Level
1. Click **"Filter by Level - N3"**
2. Notice the URL has `?level=N3`
3. Click **Send**
4. Expected: Only N3 level questions

#### 3.4 Combined Filters
1. Click **"Filter by Genre AND Level"**
2. Notice the URL has `?genre=手紙&level=N3`
3. Click **Send**
4. Expected: Only N3 letter questions

#### 3.5 Pagination
1. Click **"Pagination - First 10"**
2. Notice `?limit=10&offset=0`
3. Click **Send**
4. Expected: First 10 questions

5. Click **"Pagination - Next 10"**
6. Notice `?limit=10&offset=10`
7. Click **Send**
8. Expected: Next 10 questions (if available)

---

### **Step 4: Error Handling Tests** ⚠️

#### 4.1 Missing Fields
1. Expand **"4. Error Handling Tests"** folder
2. Click **"Missing Fields Error"**
3. Notice the body only has `genre` (missing `topic` and `level`)
4. Click **Send**
5. **Expected Response (400 Bad Request):**
   ```json
   {
     "error": "Missing required fields: genre, topic, level"
   }
   ```

#### 4.2 Invalid Genre
1. Click **"Invalid Genre Error"**
2. Notice `"genre": "invalid_genre"`
3. Click **Send**
4. **Expected Response (400 Bad Request):**
   ```json
   {
     "error": "Invalid genre. Must be one of: 手紙, スピーチ, 意見・感想"
   }
   ```

#### 4.3 Invalid Level
1. Click **"Invalid Level Error"**
2. Notice `"level": "N5"` (only N3 and N2 are valid)
3. Click **Send**
4. **Expected Response (400 Bad Request):**
   ```json
   {
     "error": "Invalid level. Must be one of: N3, N2"
   }
   ```

#### 4.4 Unauthorized Access
1. Click **"Unauthorized - No Token"**
2. Notice there's no Authorization header
3. Click **Send**
4. **Expected Response (401 Unauthorized):**
   ```json
   {
     "msg": "Missing Authorization Header"
   }
   ```

#### 4.5 Forbidden - Student Role
1. Click **"Forbidden - Student Role"**
2. Notice it uses `{{studentToken}}` instead of `{{teacherToken}}`
3. Click **Send**
4. **Expected Response (403 Forbidden):**
   ```json
   {
     "error": "Teacher role required"
   }
   ```

#### 4.6 Duplicate Detection
1. Click **"Duplicate Question (Cache Test)"**
2. This tries to generate the same question as Step 2.1
3. Click **Send**
4. **Possible Responses:**
   - **If cached:** 201 Created with same content (from cache)
   - **If hash matches:** 409 Conflict
   ```json
   {
     "error": "A similar question already exists in the database",
     "details": "This question appears to be a duplicate based on content similarity"
   }
   ```

---

### **Step 5: Test Existing Task Generation** 📝

#### 5.1 Generate Task - Letter
1. Expand **"5. Existing Task Generation"** folder
2. Click **"Generate Task - Letter"**
3. Click **Send**
4. **Expected Response (200 OK):**
   ```json
   {
     "taskId": 1234567890,
     "title": "Japanese Writing: Letter",
     "level": "N5",
     "description": "Write in Japanese about letter...",
     "prompts": [
       {
         "id": 1,
         "type": "letter",
         "prompt": "日本で１週間ホームスティしました...",
         "wordCount": 500,
         "vocabulary": ["ホームスティ", "お世话", "思い出"],
         "grammar": ["〜ました", "〜てください"]
       }
     ],
     "rubric": { ... }
   }
   ```

#### 5.2 Generate Task - Speech
1. Click **"Generate Task - Speech"**
2. Click **Send**
3. Expected: 200 OK with speech task

---

## 🎯 Testing Checklist

Use this checklist to track your testing:

### Authentication
- [ ] Login as Teacher (token saved automatically)
- [ ] Login as Student (token saved automatically)

### Question Generation
- [ ] Generate Letter question (手紙)
- [ ] Generate Speech question (スピーチ)
- [ ] Generate Opinion question (意見・感想)
- [ ] Verify questions saved to database

### List & Filter
- [ ] List all questions
- [ ] Filter by genre
- [ ] Filter by level
- [ ] Filter by both genre and level
- [ ] Test pagination (first page)
- [ ] Test pagination (next page)

### Error Handling
- [ ] Missing fields error (400)
- [ ] Invalid genre error (400)
- [ ] Invalid level error (400)
- [ ] Unauthorized access (401)
- [ ] Forbidden - student role (403)
- [ ] Duplicate detection (409 or cached)

### Existing Endpoints
- [ ] Generate task - letter
- [ ] Generate task - speech

---

## 🔍 What to Look For

### ✅ Success Indicators
1. **Status Codes:**
   - 200 OK for GET requests
   - 201 Created for successful question generation
   - 400/401/403/409 for expected errors

2. **Response Structure:**
   - All required fields present
   - Japanese text displays correctly
   - required_points is valid JSON array
   - similarity_hash is 64 characters

3. **Server Logs:**
   - "✅ Question saved to database with ID: X"
   - "✅ Using cached result" (for repeated requests)
   - "⏳ Rate limiting: waiting X seconds..."

### ❌ Failure Indicators
1. **Connection Errors:**
   - "Connection refused" → Server not running
   - "404 Not Found" → Wrong endpoint URL

2. **Authentication Errors:**
   - "Missing Authorization Header" → Token not set
   - "Token has expired" → Need to login again

3. **Server Errors:**
   - 500 Internal Server Error → Check server logs
   - Database errors → Check database connection

---

## 💡 Tips & Tricks

### 1. View Collection Variables
- Click the collection name
- Go to **Variables** tab
- See `teacherToken`, `studentToken`, `questionId`

### 2. Check Server Logs
Watch the terminal where Flask is running to see:
- API calls being processed
- Rate limiting messages
- Database operations
- Error details

### 3. Test Rate Limiting
- Make multiple requests quickly
- Server will automatically wait 30 seconds between Gemini API calls
- Cached requests return immediately

### 4. Clear Cache
Restart the Flask server to clear the in-memory cache:
```bash
# Stop server: Ctrl+C
# Start again:
python run.py
```

### 5. Inspect Responses
- Click **Body** tab to see JSON response
- Click **Headers** tab to see response headers
- Click **Test Results** to see script output
- Click **Console** (bottom) to see all requests

---

## 🐛 Troubleshooting

### Problem: "Connection refused"
**Solution:** Make sure Flask server is running on port 5000
```bash
cd fumi-mate-api
python run.py
```

### Problem: "Missing Authorization Header"
**Solution:** 
1. Run "Login as Teacher" first
2. Check that `{{teacherToken}}` variable is set
3. Verify Authorization header is present in request

### Problem: "Token has expired"
**Solution:** Login again to get a new token

### Problem: "Rate limiting: waiting 30 seconds"
**Solution:** This is normal! Wait for the countdown or use cached results

### Problem: "GEMINI_API_KEY not found"
**Solution:** The API will automatically use mock data. No action needed, or add your API key to `.env`

### Problem: Questions not appearing in list
**Solution:** 
1. Check if generation was successful (201 Created)
2. Verify you're using the correct token
3. Check server logs for errors

---

## 📊 Expected Test Results Summary

| Test | Expected Status | Expected Behavior |
|------|----------------|-------------------|
| Login as Teacher | 200 | Token saved automatically |
| Generate Letter Q | 201 | Question saved to DB |
| Generate Speech Q | 201 | Question saved to DB |
| Generate Opinion Q | 201 | Question saved to DB |
| List All Questions | 200 | Shows all questions |
| Filter by Genre | 200 | Shows filtered results |
| Filter by Level | 200 | Shows filtered results |
| Pagination | 200 | Shows paginated results |
| Missing Fields | 400 | Error message |
| Invalid Genre | 400 | Error with valid genres |
| Invalid Level | 400 | Error with valid levels |
| No Token | 401 | Unauthorized error |
| Student Role | 403 | Forbidden error |
| Duplicate | 409 or 201 | Conflict or cached |
| Generate Task | 200 | Task with prompts |

---

## 🎓 Learning Points

After completing these tests, you will have verified:

1. ✅ **Authentication & Authorization**
   - JWT token generation
   - Role-based access control
   - Token validation

2. ✅ **Question Generation**
   - Gemini AI integration
   - Mock data fallback
   - Database persistence
   - Deduplication

3. ✅ **Data Retrieval**
   - Filtering by multiple criteria
   - Pagination
   - Response formatting

4. ✅ **Error Handling**
   - Input validation
   - Authentication errors
   - Authorization errors
   - Duplicate detection

5. ✅ **Rate Limiting**
   - API call throttling
   - Caching mechanism

---

## 📞 Need Help?

If you encounter issues:
1. Check the server logs in the terminal
2. Review the Postman Console (bottom panel)
3. Verify all prerequisites are met
4. Check the API documentation: `API_QUESTION_GENERATION.md`
5. Review the quick start guide: `QUICK_START_QUESTION_API.md`

---

**Happy Testing! 🎉**
